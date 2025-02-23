
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation as useUserLocation } from "@/hooks/useLocation";
import ProductGallery from "@/components/products/ProductGallery";
import ProductInfo from "@/components/products/ProductInfo";
import ProductActions from "@/components/products/ProductActions";
import SimilarProducts from "@/components/products/SimilarProducts";

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
  const { userLocation } = useUserLocation();

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
        return SAMPLE_PRODUCT;
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
          <div className="space-y-4">
            <SimilarProducts products={similarProducts} />
          </div>

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

              <ProductGallery name={product.name} />
              
              <ProductInfo 
                name={product.name}
                category={product.category}
                price={product.price}
                userLocation={userLocation}
                store={product.store}
                description={product.description}
              />

              <ProductActions 
                storeWebsite={product.store?.website}
                productId={product.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
