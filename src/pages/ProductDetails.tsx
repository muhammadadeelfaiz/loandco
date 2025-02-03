import { useParams, useNavigate } from "react-router-dom";
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
  latitude: number;
  longitude: number;
  website?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  retailer_id: string;
  retailer?: {
    id: string;
    name: string;
  };
  store?: Store;
}

const SAMPLE_PRODUCT: Product = {
  id: "sample-iphone",
  name: "iPhone 15 Pro Max",
  price: 5099,
  category: "Mobiles",
  description: "Experience the latest iPhone 15 Pro Max with its stunning display, powerful A17 Pro chip, and revolutionary camera system. Available in Natural Titanium, Blue Titanium, White Titanium, and Black Titanium.",
  retailer_id: "sample-retailer",
  retailer: {
    id: "sample-retailer",
    name: "Apple Store Dubai Mall"
  },
  store: {
    id: "sample-store",
    name: "Apple Store Dubai Mall",
    latitude: 25.1972,
    longitude: 55.2744,
    website: "https://www.apple.com/ae/retail/dubaimall/"
  }
};

const ProductDetails = () => {
  const { id } = useParams();
  const userLocation = useUserLocation();
  const navigate = useNavigate(); // Add this line

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      console.log("Fetching product with ID:", id);
      
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(`
          *,
          retailer:users!products_retailer_id_fkey (
            id,
            name
          )
        `)
        .eq("id", id)
        .maybeSingle();
      
      if (productError) {
        console.error("Error fetching product:", productError);
        throw productError;
      }
      
      if (!productData) {
        console.log("No product found with ID:", id);
        return SAMPLE_PRODUCT; // Return sample product when no product is found
      }

      console.log("Product data:", productData);

      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", productData.retailer_id)
        .maybeSingle();

      if (storeError) {
        console.error("Error fetching store:", storeError);
      }

      return {
        ...productData,
        store: storeData
      } as Product;
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

  if (isLoading) {
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

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation user={null} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Product not found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              The product you're looking for doesn't exist or has been removed.
            </p>
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
            {[1, 2, 3].map((index) => (
              <Card key={index} className="p-4 hover:shadow-lg transition-shadow">
                <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-md mb-2 overflow-hidden">
                  <img 
                    src={`https://images.unsplash.com/photo-148859052850${index}-98d2b5aba04b`}
                    alt={`iPhone ${index}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">iPhone 15 Pro</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">AED 4599</p>
              </Card>
            ))}
          </div>

          {/* Main Product Display */}
          <div className="md:col-span-3 space-y-8">
            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
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
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9"
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "photo-1592899677977-9c10ca588bbd",
                    "photo-1607936854279-55e8a4c64888",
                    "photo-1591337676887-a217a6970a8a",
                    "photo-1556656793-08538906a9f8"
                  ].map((photoId, index) => (
                    <div key={index} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                      <img 
                        src={`https://images.unsplash.com/${photoId}`}
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div>
                  <p className="text-3xl font-bold text-primary">AED {product.price}</p>
                  <Badge variant="secondary" className="mt-1">Available</Badge>
                </div>
                {userLocation && product.store && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        product.store.latitude,
                        product.store.longitude
                      ).toFixed(1)}km away
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mb-8">
                {product.store?.website ? (
                  <Button className="flex-1" asChild>
                    <a href={product.store.website} target="_blank" rel="noopener noreferrer">
                      <Store className="w-4 h-4 mr-2" />
                      Visit Store
                    </a>
                  </Button>
                ) : (
                  <Button className="flex-1" disabled>
                    <Store className="w-4 h-4 mr-2" />
                    Store Unavailable
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate(`/compare/${product.id}`)}
                >
                  Compare Prices
                </Button>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <h3>Product Description</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {product.description || `Experience the latest ${product.name} with its stunning display, powerful processor, and advanced features. Available now at our store.`}
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
