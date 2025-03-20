
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ProductCard from "./ProductCard";

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
    <div className="space-y-4">
      {products.map((product) => {
        // Safely parse JSON strings if they come as strings
        const stores = typeof product.stores === 'string' 
          ? JSON.parse(product.stores)
          : product.stores;
        
        const retailers = typeof product.retailers === 'string'
          ? JSON.parse(product.retailers)
          : product.retailers;
        
        return (
          <ProductCard
            key={product.id}
            product={{
              ...product,
              store_latitude: stores?.latitude,
              store_longitude: stores?.longitude,
              retailer_name: retailers?.name || stores?.name,
              // Ensure image_url is properly passed to the ProductCard
              image_url: product.image_url || null
            }}
            onContactRetailer={onContactRetailer}
            onGetDirections={onGetDirections}
          />
        );
      })}
    </div>
  );
};
