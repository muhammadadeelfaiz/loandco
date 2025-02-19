
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ProductCard from "./ProductCard";
import { Database } from "@/integrations/supabase/types";

type ProductWithRetailer = Database['public']['Tables']['products']['Row'] & {
  retailer_name?: string;
  distance?: number;
};

interface LocalProductsProps {
  products: ProductWithRetailer[] | undefined;
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
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
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
    <>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={{
            ...product,
            store_latitude: null,
            store_longitude: null
          }}
          onContactRetailer={onContactRetailer}
          onGetDirections={onGetDirections}
        />
      ))}
    </>
  );
};
