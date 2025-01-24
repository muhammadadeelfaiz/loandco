import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Mail, Navigation as NavigationIcon } from 'lucide-react';
import Map from "@/components/map/Map";

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
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState("all");
  const [category, setCategory] = useState("all");
  const [distanceRange, setDistanceRange] = useState("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleContactRetailer = (retailerName: string) => {
    // In a real application, this would open a contact form or modal
    toast({
      title: "Contact Information",
      description: `Contact ${retailerName} for more information about this product.`,
    });
  };

  const handleGetDirections = (lat: number, lng: number, storeName: string) => {
    // Open in Google Maps
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${storeName}`,
      '_blank'
    );
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Unable to get your location. Distance-based features may be limited."
          });
        }
      );
    }
  }, [toast]);

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

        let filteredProducts = [...(data as Product[])].map(product => ({
          ...product,
          distance: product.store_latitude && product.store_longitude && userLocation
            ? calculateDistance(product.store_latitude, product.store_longitude)
            : Infinity
        }));

        // Apply price range filter
        if (priceRange !== "all") {
          const [min, max] = priceRange.split("-").map(Number);
          filteredProducts = filteredProducts.filter(
            product => product.price >= min && (max ? product.price <= max : true)
          );
        }

        // Apply category filter
        if (category !== "all") {
          filteredProducts = filteredProducts.filter(
            product => product.category.toLowerCase() === category.toLowerCase()
          );
        }

        // Apply distance filter
        if (distanceRange !== "all" && userLocation) {
          const maxDistance = parseInt(distanceRange);
          filteredProducts = filteredProducts.filter(
            product => product.distance && product.distance <= maxDistance
          );
        }

        // Apply sorting
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
            filteredProducts.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
            break;
        }

        setProducts(filteredProducts);
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
  }, [query, sortBy, priceRange, category, distanceRange, userLocation, toast]);

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="name-desc">Name: Z to A</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger>
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="0-50">Under 50 AED</SelectItem>
              <SelectItem value="50-100">50 - 100 AED</SelectItem>
              <SelectItem value="100-500">100 - 500 AED</SelectItem>
              <SelectItem value="500">500 AED and above</SelectItem>
            </SelectContent>
          </Select>

          <Select value={distanceRange} onValueChange={setDistanceRange}>
            <SelectTrigger>
              <SelectValue placeholder="Distance Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Distance</SelectItem>
              <SelectItem value="5">Within 5 km</SelectItem>
              <SelectItem value="10">Within 10 km</SelectItem>
              <SelectItem value="20">Within 20 km</SelectItem>
              <SelectItem value="50">Within 50 km</SelectItem>
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="clothing">Clothing</SelectItem>
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            No products found matching your search criteria
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-2">Category: {product.category}</p>
                <p className="text-primary font-bold">{product.price.toFixed(2)} AED</p>
                {product.distance && product.distance !== Infinity && (
                  <p className="text-sm text-gray-500 mt-1">
                    Distance: {product.distance.toFixed(1)} km
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Seller: {product.retailer_name}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleContactRetailer(product.retailer_name)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                  {product.store_latitude && product.store_longitude && (
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleGetDirections(
                        product.store_latitude,
                        product.store_longitude,
                        product.retailer_name
                      )}
                    >
                      <NavigationIcon className="w-4 h-4 mr-2" />
                      Directions
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
