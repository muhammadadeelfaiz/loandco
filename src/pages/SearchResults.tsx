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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <Navigation user={null} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">
            Search Results for "{query}"
          </h1>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>

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

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            No products found matching your search criteria
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>
    </div>
  );
};

export default SearchResults;