
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useLocation } from "@/hooks/useLocation";
import { Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  retailer_id?: string;
  retailer_name?: string;
  distance?: number;
}

const LocalRetailerProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { userLocation } = useLocation();

  useEffect(() => {
    const fetchLocalProducts = async () => {
      if (!userLocation) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Get some random local products with a simple search
        const { data, error } = await supabase.rpc('search_products', {
          search_term: '',
          category_filter: null
        });
        
        if (error) {
          console.error('Error fetching local products:', error);
          return;
        }

        console.log('Retrieved local products:', data);

        // Process the products to calculate distance and sort by proximity
        const productsWithDistance = data
          .filter((product: any) => product.stores?.latitude && product.stores?.longitude)
          .map((product: any) => {
            const storeLat = product.stores.latitude;
            const storeLng = product.stores.longitude;
            
            // Calculate distance
            const R = 6371; // Earth's radius in km
            const dLat = (storeLat - userLocation.lat) * Math.PI / 180;
            const dLon = (storeLng - userLocation.lng) * Math.PI / 180;
            const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(storeLat * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;
            
            // Add distance to product
            return {
              ...product,
              distance,
              retailer_name: product.retailers?.name
            };
          })
          .sort((a: any, b: any) => a.distance - b.distance)
          .slice(0, 4); // Take only the 4 closest products
        
        setProducts(productsWithDistance);
      } catch (error) {
        console.error('Error processing local products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocalProducts();
  }, [userLocation]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log("Local product image failed to load:", (e.target as HTMLImageElement).src);
    (e.target as HTMLImageElement).src = '/placeholder.svg';
  };

  if (isLoading) {
    return (
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Local Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <Card 
              key={item} 
              className="flex flex-col h-64 items-center justify-center animate-pulse"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (!products.length) {
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Products Near You</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card 
            key={product.id} 
            className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 relative">
              {product.image_url ? (
                <img 
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  onError={handleImageError}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No Image
                </div>
              )}
              {product.distance !== undefined && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs py-1 px-2 rounded-full">
                  {product.distance.toFixed(1)} km away
                </div>
              )}
            </div>
            <CardContent className="flex flex-col flex-grow p-4">
              <h3 className="font-medium mb-1 line-clamp-2">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-1">
                {product.category}
              </p>
              <div className="flex items-center justify-between mt-auto pt-3">
                <span className="font-bold text-primary">AED {product.price}</span>
                <Button 
                  size="sm" 
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default LocalRetailerProducts;
