
import { useState } from "react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/components/ui/use-toast";
import { SearchHeader } from "@/components/search/SearchHeader";
import { ProductResults } from "@/components/search/ProductResults";
import { useProductSearch } from "@/hooks/useProductSearch";

const SearchResults = () => {
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState("all");
  const [category, setCategory] = useState("all");
  const [distanceRange, setDistanceRange] = useState("all");
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const submittedQuery = searchParams.get('q') || '';
  const categoryFromUrl = searchParams.get('category');

  // Initialize category from URL if present
  useState(() => {
    if (categoryFromUrl) {
      setCategory(categoryFromUrl);
    }
  });

  // Fetch products using custom hook
  const {
    products,
    isLoading,
    amazonProducts,
    isLoadingAmazon,
    ebayProducts,
    isLoadingEbay
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

    // Apply price range filter
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

    // Apply sorting
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

    // Apply distance filter for local products
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation user={null} />
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
      <Navigation user={null} />
      
      <main className="container mx-auto px-4 py-8">
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
