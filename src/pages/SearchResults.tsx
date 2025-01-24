import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import SearchFilters from "@/components/search/SearchFilters";
import ProductCard from "@/components/search/ProductCard";
import { useLocation as useUserLocation } from "@/hooks/useLocation";
import { useProductFilters } from "@/hooks/useProductFilters";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  availability: boolean;
  retailer_name: string;
  store_latitude: number;
  store_longitude: number;
  distance?: number;
}

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const userLocation = useUserLocation();
  const {
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    category,
    setCategory,
    distanceRange,
    setDistanceRange,
    filterProducts,
  } = useProductFilters();

  const handleContactRetailer = (retailerName: string) => {
    toast({
      title: "Contact Information",
      description: `Contact ${retailerName} for more information about this product.`,
    });
  };

  const handleGetDirections = (lat: number, lng: number, storeName: string) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${storeName}`,
      '_blank'
    );
  };

  const calculateDistance = (storeLat: number, storeLng: number) => {
    if (!userLocation) return Infinity;
    
    const R = 6371; // Earth's radius in km
    const dLat = (storeLat - userLocation.lat) * Math.PI / 180;
    const dLon = (storeLng - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(storeLat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.rpc('search_products', {
          search_term: query
        });

        if (error) throw error;

        const productsWithDistance = (data as Product[]).map(product => ({
          ...product,
          distance: product.store_latitude && product.store_longitude && userLocation
            ? calculateDistance(product.store_latitude, product.store_longitude)
            : Infinity
        }));

        setProducts(productsWithDistance);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error fetching products",
          description: error instanceof Error ? error.message : "An error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query, userLocation, toast]);

  const filteredProducts = filterProducts(products);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-white">
      <Navigation user={null} />
      
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
              Search Results
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Showing results for "{query}"
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="w-full md:w-auto"
          >
            Back to Search
          </Button>
        </div>

        <div className="mb-6">
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found matching your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onContactRetailer={handleContactRetailer}
                onGetDirections={handleGetDirections}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResults;