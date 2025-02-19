
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import ProductCard from "@/components/search/ProductCard";
import SearchFilters from "@/components/search/SearchFilters";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { RotateCcw, AlertCircle } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { FirecrawlService } from "@/services/FirecrawlService";
import { EbayService } from "@/services/EbayService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ProductWithRetailer = Database['public']['Tables']['products']['Row'] & {
  retailer_name?: string;
  distance?: number;
};

interface AmazonProduct {
  title: string;
  price: string;
  rating: string;
  reviews: string;
  image: string;
}

interface EbayProduct {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  image: string;
  condition: string;
  location: string;
  url: string;
}

const SearchResults = () => {
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState("all");
  const [category, setCategory] = useState("all");
  const [distanceRange, setDistanceRange] = useState("all");
  const [isLoadingAmazon, setIsLoadingAmazon] = useState(false);
  const [isLoadingEbay, setIsLoadingEbay] = useState(false);
  const [amazonProducts, setAmazonProducts] = useState<AmazonProduct[]>([]);
  const [ebayProducts, setEbayProducts] = useState<EbayProduct[]>([]);
  const { toast } = useToast();

  // Get search query from URL
  const searchParams = new URLSearchParams(window.location.search);
  const submittedQuery = searchParams.get('q') || '';

  const { data: products, isLoading } = useQuery({
    queryKey: ["search-products", submittedQuery],
    queryFn: async () => {
      let query: ProductWithRetailer[];
      
      if (submittedQuery) {
        const { data, error } = await supabase.rpc('search_products', {
          search_term: submittedQuery
        });
        if (error) throw error;
        query = data as ProductWithRetailer[];

        // Fetch Amazon products
        setIsLoadingAmazon(true);
        try {
          const amazonResult = await FirecrawlService.crawlAmazonProduct(submittedQuery);
          if (amazonResult.success && amazonResult.data) {
            setAmazonProducts(amazonResult.data);
          }
        } catch (error) {
          console.error('Error fetching Amazon products:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch Amazon products"
          });
        } finally {
          setIsLoadingAmazon(false);
        }

        // Fetch eBay products
        setIsLoadingEbay(true);
        try {
          const ebayResult = await EbayService.searchProducts(submittedQuery);
          if (ebayResult.success && ebayResult.data) {
            setEbayProducts(ebayResult.data);
          }
        } catch (error) {
          console.error('Error fetching eBay products:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch eBay products"
          });
        } finally {
          setIsLoadingEbay(false);
        }

        return query;
      } else {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            users (
              name
            )
          `);
        if (error) throw error;
        
        query = (data || []).map(product => ({
          ...product,
          retailer_name: (product.users as { name: string } | null)?.name,
          distance: undefined
        }));

        return query;
      }
    },
    enabled: true
  });

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

  const filterProducts = (products: ProductWithRetailer[] | undefined) => {
    if (!products) return [];
    
    let filteredProducts = [...products];

    if (category !== "all") {
      filteredProducts = filteredProducts.filter(
        product => product.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      if (max) {
        filteredProducts = filteredProducts.filter(
          product => product.price >= min && product.price <= max
        );
      } else {
        filteredProducts = filteredProducts.filter(
          product => product.price >= min
        );
      }
    }

    switch (sortBy) {
      case "price-asc":
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "distance":
        if (distanceRange !== "all") {
          const maxDistance = parseInt(distanceRange);
          filteredProducts = filteredProducts.filter(
            product => typeof product.distance === 'number' && product.distance <= maxDistance
          );
        }
        filteredProducts.sort((a, b) => {
          const distA = a.distance ?? Infinity;
          const distB = b.distance ?? Infinity;
          return distA - distB;
        });
        break;
      case "rating":
        break;
    }

    return filteredProducts;
  };

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

  const filteredProducts = filterProducts(products);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={null} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center mb-6">
            <div className="flex-1">
              <SearchFilters
                sortBy={sortBy}
                setSortBy={setSortBy}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                category={category}
                setCategory={setCategory}
                distanceRange={distanceRange}
                setDistanceRange={setDistanceRange}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="w-full md:w-auto"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {submittedQuery ? `Search Results for "${submittedQuery}"` : "All Products"}
          </h1>
        </div>

        {/* Local Products */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Local Stores</h2>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          ) : products && products.length > 0 ? (
            filterProducts(products).map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  store_latitude: null,
                  store_longitude: null
                }}
                onContactRetailer={handleContactRetailer}
                onGetDirections={handleGetDirections}
              />
            ))
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No local results</AlertTitle>
              <AlertDescription>
                No products found in local stores matching your search.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* eBay Products */}
        {submittedQuery && (
          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">eBay Products</h2>
            {isLoadingEbay ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                ))}
              </div>
            ) : ebayProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ebayProducts.map((product) => (
                  <div key={product.itemId} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <img 
                      src={product.image} 
                      alt={product.title}
                      className="w-full h-48 object-contain mb-4"
                    />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {product.title}
                    </h3>
                    <p className="text-xl font-bold text-primary mb-2">
                      {product.price.currency} {product.price.value}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                      <span>{product.condition}</span>
                      <span>•</span>
                      <span>{product.location}</span>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => window.open(product.url, '_blank')}
                    >
                      View on eBay
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No eBay results</AlertTitle>
                <AlertDescription>
                  No products found on eBay matching your search.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Amazon Products */}
        {submittedQuery && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Amazon Products</h2>
            {isLoadingAmazon ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                ))}
              </div>
            ) : amazonProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {amazonProducts.map((product, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <img 
                      src={product.image} 
                      alt={product.title}
                      className="w-full h-48 object-contain mb-4"
                    />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {product.title}
                    </h3>
                    <p className="text-xl font-bold text-primary mb-2">${product.price}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span>Rating: {product.rating}</span>
                      <span>•</span>
                      <span>{product.reviews} reviews</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Amazon results</AlertTitle>
                <AlertDescription>
                  No products found on Amazon matching your search.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResults;

