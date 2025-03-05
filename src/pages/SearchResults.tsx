import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import Navigation from "@/components/Navigation";
import { useToast } from "@/components/ui/use-toast";
import { SearchHeader } from "@/components/search/SearchHeader";
import { ProductResults } from "@/components/search/ProductResults";
import { useProductSearch } from "@/hooks/useProductSearch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Key } from "lucide-react";
import { FirecrawlService } from "@/services/FirecrawlService";
import { Button } from "@/components/ui/button";
import { ApiKeyForm } from "@/components/search/ApiKeyForm";

interface SearchResultsProps {
  user: User | null;
}

const SearchResults = ({ user }: SearchResultsProps) => {
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState("all");
  const [category, setCategory] = useState("all");
  const [distanceRange, setDistanceRange] = useState("all");
  const [apiKeySet, setApiKeySet] = useState<boolean | null>(null);
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkApiKey = async () => {
      FirecrawlService.resetQuotaExceeded();
      await FirecrawlService.resetApiKeyCache();
      const initialized = await FirecrawlService.initialize();
      setApiKeySet(initialized);
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    const activateApiKey = async () => {
      if (!apiKeySet) {
        try {
          const apiKey = "1f98c121c7mshd020b5c989dcde0p19e810jsn206cf8a3609d";
          const success = await FirecrawlService.saveApiKey(apiKey);
          if (success) {
            toast({
              title: "API Key Activated",
              description: "Successfully activated the RapidAPI key for Amazon product search."
            });
            setApiKeySet(true);
            window.location.reload();
          }
        } catch (error) {
          console.error("Error activating API key:", error);
        }
      }
    };
    
    activateApiKey();
  }, [apiKeySet, toast]);

  const searchParams = new URLSearchParams(window.location.search);
  const submittedQuery = searchParams.get('q') || '';
  const categoryFromUrl = searchParams.get('category');

  useState(() => {
    if (categoryFromUrl) {
      setCategory(categoryFromUrl);
    }
  });

  const {
    products,
    isLoading,
    amazonProducts,
    amazonError,
    isLoadingAmazon,
    ebayProducts,
    isLoadingEbay,
    apiKeyInitialized
  } = useProductSearch(submittedQuery, category);

  const handleContactRetailer = (retailerName: string) => {
    toast({
      title: "Contact Information",
      description: `Contact ${retailerName} for more information.`,
    });
  };

  const handleGetDirections = (lat: number, lng: number, storeName: string) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${storeName}`,
      "_blank"
    );
  };

  const resetFilters = () => {
    setSortBy("default");
    setPriceRange("all");
    setCategory("all");
    setDistanceRange("all");
  };

  const filterAndSortProducts = (items: any[], type: 'local' | 'ebay') => {
    if (!items) return [];
    
    let filteredItems = [...items];

    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      filteredItems = filteredItems.filter(item => {
        const price = type === 'local' ? item.price : parseFloat(item.price.value);
        if (max) {
          return price >= min && price <= max;
        }
        return price >= min;
      });
    }

    filteredItems.sort((a, b) => {
      const priceA = type === 'local' ? a.price : parseFloat(a.price.value);
      const priceB = type === 'local' ? b.price : parseFloat(b.price.value);
      const nameA = type === 'local' ? a.name : a.title;
      const nameB = type === 'local' ? b.name : b.title;

      switch (sortBy) {
        case "price-asc":
          return priceA - priceB;
        case "price-desc":
          return priceB - priceA;
        case "name-asc":
          return nameA.localeCompare(nameB);
        case "name-desc":
          return nameB.localeCompare(nameA);
        case "distance":
          if (type === 'local') {
            const distA = a.distance ?? Infinity;
            const distB = b.distance ?? Infinity;
            return distA - distB;
          }
          return 0;
        default:
          return 0;
      }
    });

    if (type === 'local' && distanceRange !== "all") {
      const maxDistance = parseInt(distanceRange);
      filteredItems = filteredItems.filter(
        item => typeof item.distance === 'number' && item.distance <= maxDistance
      );
    }

    return filteredItems;
  };

  const filteredLocalProducts = filterAndSortProducts(products, 'local');
  const filteredEbayProducts = filterAndSortProducts(ebayProducts, 'ebay');

  const handleRefreshApiKey = async () => {
    toast({
      title: "Reconnecting",
      description: "Attempting to reconnect to the product search service..."
    });
    
    FirecrawlService.resetQuotaExceeded();
    await FirecrawlService.resetApiKeyCache(); 
    
    const apiKey = "1f98c121c7mshd020b5c989dcde0p19e810jsn206cf8a3609d";
    const success = await FirecrawlService.saveApiKey(apiKey);
    
    if (success) {
      toast({
        title: "Success",
        description: "Successfully connected to the product search service. Refreshing products..."
      });
      window.location.reload();
    } else {
      toast({
        title: "Connection Error",
        description: "Failed to connect to the product search service. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleApiKeySuccess = () => {
    setShowApiKeyForm(false);
    setApiKeySet(true);
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation user={user} />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={user} />
      
      <main className="container mx-auto px-4 py-8">
        {showApiKeyForm ? (
          <div className="mb-8">
            <ApiKeyForm onSuccess={handleApiKeySuccess} />
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => setShowApiKeyForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : apiKeySet === false && (
          <Alert className="mb-6" variant="destructive">
            <Key className="h-4 w-4" />
            <AlertTitle>Product Search Service Unavailable</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>We're currently experiencing difficulties connecting to our Amazon product search service.</p>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefreshApiKey}
                >
                  Refresh Connection
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setShowApiKeyForm(true)}
                >
                  Set API Key
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <SearchHeader
          query={submittedQuery}
          category={category}
          sortBy={sortBy}
          setSortBy={setSortBy}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          setCategory={setCategory}
          distanceRange={distanceRange}
          setDistanceRange={setDistanceRange}
          onResetFilters={resetFilters}
        />

        <ProductResults
          filteredLocalProducts={filteredLocalProducts}
          filteredEbayProducts={filteredEbayProducts}
          amazonProducts={amazonProducts}
          amazonError={amazonError}
          isLoading={isLoading}
          isLoadingEbay={isLoadingEbay}
          isLoadingAmazon={isLoadingAmazon}
          query={submittedQuery}
          onContactRetailer={handleContactRetailer}
          onGetDirections={handleGetDirections}
        />
      </main>
    </div>
  );
};

export default SearchResults;
