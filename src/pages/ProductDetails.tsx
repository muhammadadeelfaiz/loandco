import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { useLocation as useUserLocation } from "@/hooks/useLocation";
import { Heart, MapPin, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Store {
  id: string;
  name: string;
  price: number;
  distance?: number;
  website?: string;
}

const ProductDetails = () => {
  const { id } = useParams();
  const userLocation = useUserLocation();

  const { data: product } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          stores:retailer_id (
            id,
            name,
            latitude,
            longitude
          )
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: similarProducts } = useQuery({
    queryKey: ["similar-products", product?.category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", product?.category)
        .neq("id", id)
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!product,
  });

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation user={null} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation user={null} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Similar Products Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Similar Products</h2>
            {similarProducts?.map((similarProduct) => (
              <Card key={similarProduct.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-md mb-2" />
                <h3 className="font-medium text-gray-800 dark:text-gray-200">{similarProduct.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">AED {similarProduct.price}</p>
              </Card>
            ))}
          </div>

          {/* Main Product Display */}
          <div className="md:col-span-3 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{product.name}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{product.category}</p>
                </div>
                <Button variant="outline" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div>
                  <p className="text-3xl font-bold text-primary">AED {product.price}</p>
                  <Badge variant="secondary" className="mt-1">15% off</Badge>
                </div>
                {userLocation && product.stores?.latitude && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        product.stores.latitude,
                        product.stores.longitude
                      ).toFixed(1)}km away
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-8">
                <h3 className="font-semibold">Select Size</h3>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 38).map((size) => (
                    <Button
                      key={size}
                      variant="outline"
                      className="w-full"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 mb-8">
                <Button className="flex-1">
                  <Store className="w-4 h-4 mr-2" />
                  Visit Store
                </Button>
                <Button variant="outline" className="flex-1">
                  Compare Prices
                </Button>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <h3>Product Description</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {product.description || "No description available for this product."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;