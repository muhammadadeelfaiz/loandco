import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { useLocation as useUserLocation } from "@/hooks/useLocation";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    const R = 6371; // Earth's radius in km
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
    return <div>Loading...</div>;
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
              <Card key={similarProduct.id} className="p-4">
                <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-md mb-2" />
                <h3 className="font-medium text-gray-800 dark:text-gray-200">{similarProduct.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">AED {similarProduct.price}</p>
              </Card>
            ))}
          </div>

          {/* Main Product Display */}
          <div className="md:col-span-3 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{product.name}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{product.category}</p>
              
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-6" />
              
              <div className="flex items-center gap-2 mb-6">
                <p className="text-2xl font-bold text-primary">AED {product.price}</p>
                {userLocation && product.stores?.latitude && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      product.stores.latitude,
                      product.stores.longitude
                    ).toFixed(1)}km away
                  </span>
                )}
              </div>

              {/* Retailers Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {[product.stores].map((store, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{store?.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">AED {product.price}</p>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      Visit Store
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;