
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ProductCard from "./ProductCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface LocalProductsProps {
  products: any[] | undefined;
  isLoading: boolean;
  onContactRetailer: (retailerName: string) => void;
  onGetDirections: (lat: number, lng: number, storeName: string) => void;
}

export const LocalProducts = ({
  products,
  isLoading,
  onContactRetailer,
  onGetDirections
}: LocalProductsProps) => {
  const { data: storeProducts, isLoading: isLoadingStoreProducts } = useQuery({
    queryKey: ["store-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          stores:store_id (
            latitude,
            longitude,
            name
          ),
          retailers:retailer_id (
            name
          )
        `)
        .not('store_id', 'is', null); // Only get products that belong to stores

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      console.log('Fetched store products:', data);
      return data;
    },
  });

  if (isLoading || isLoadingStoreProducts) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    );
  }

  // Combine products from search results and store-specific products
  const allProducts = [...(products || []), ...(storeProducts || [])];

  if (!allProducts || allProducts.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No local results</AlertTitle>
        <AlertDescription>
          No products found in local stores matching your search.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {allProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={{
            ...product,
            store_latitude: product.stores?.latitude,
            store_longitude: product.stores?.longitude,
            retailer_name: product.retailers?.name || product.stores?.name
          }}
          onContactRetailer={onContactRetailer}
          onGetDirections={onGetDirections}
        />
      ))}
    </div>
  );
};

