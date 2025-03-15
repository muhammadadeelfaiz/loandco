
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";

interface ProductComparisonProps {
  localProduct?: {
    id: string;
    name: string;
    price: number;
    store_name?: string;
    latitude?: number;
    longitude?: number;
  };
  amazonProducts: Array<{
    id: string;
    name: string;
    price: string | number;
    imageUrl?: string;
    url?: string;
    retailer?: string;
  }>;
  ebayProducts: Array<{
    id: string;
    name: string;
    price: string | number;
    imageUrl?: string;
    url?: string;
    retailer?: string;
  }>;
  isLoading: boolean;
  onGetDirections?: (lat: number, lng: number, storeName: string) => void;
  onAddToWishlist?: (productId: string) => void;
  user?: User | null;
}

export const ProductComparisonTable = ({
  localProduct,
  amazonProducts,
  ebayProducts,
  isLoading,
  onGetDirections,
  onAddToWishlist,
  user
}: ProductComparisonProps) => {
  const [wishlistStates, setWishlistStates] = useState<Record<string, boolean>>({});

  // Function to convert price to AED if it's not already
  const formatPriceToAED = (price: string | number): string => {
    if (typeof price === 'number') {
      return `AED ${price.toFixed(2)}`;
    }
    
    // If price is a string and already has AED, return it
    if (typeof price === 'string' && price.includes('AED')) {
      return price;
    }
    
    // If price is a string with USD, convert to AED
    if (typeof price === 'string' && price.includes('USD')) {
      const numericValue = parseFloat(price.replace(/[^0-9.]/g, ''));
      if (!isNaN(numericValue)) {
        const aedValue = numericValue * 3.67; // USD to AED conversion
        return `AED ${aedValue.toFixed(2)} (converted)`;
      }
    }
    
    // For other currencies, just return the price as is
    return typeof price === 'string' ? price : `AED ${price}`;
  };

  const handleAddToWishlist = (productId: string) => {
    if (onAddToWishlist) {
      onAddToWishlist(productId);
      setWishlistStates(prev => ({
        ...prev,
        [productId]: true
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Comparing Prices</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-48 w-full mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Compare Prices</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Local product card */}
        {localProduct && (
          <Card className="p-4 border border-primary">
            <div className="h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 rounded">
              <span className="text-gray-500">Product Image</span>
            </div>
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{localProduct.name}</h3>
            <p className="text-xl font-bold text-primary mb-2">
              AED {localProduct.price.toFixed(2)}
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {localProduct.store_name && (
                <p>Retailer: {localProduct.store_name}</p>
              )}
              <p className="font-semibold text-primary">Local Store</p>
            </div>
            
            <div className="flex flex-col gap-2">
              {localProduct.latitude && localProduct.longitude && (
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => onGetDirections && onGetDirections(
                    localProduct.latitude!,
                    localProduct.longitude!,
                    localProduct.store_name || "Store"
                  )}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
              )}
              
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => handleAddToWishlist(localProduct.id)}
                disabled={!user || wishlistStates[localProduct.id]}
              >
                <Heart className={`w-4 h-4 mr-2 ${wishlistStates[localProduct.id] ? 'fill-current text-red-500' : ''}`} />
                {wishlistStates[localProduct.id] ? 'Added to Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>
          </Card>
        )}
        
        {/* Amazon products */}
        {amazonProducts.slice(0, 3).map((product) => (
          <Card key={product.id} className="p-4">
            <div className="h-48 flex items-center justify-center mb-4 bg-gray-50 dark:bg-gray-800 rounded overflow-hidden">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              ) : (
                <span className="text-gray-500">No Image</span>
              )}
            </div>
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
            <p className="text-xl font-bold text-primary mb-2">
              {formatPriceToAED(product.price)}
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              <p>Retailer: {product.retailer || 'Amazon.ae'}</p>
              <p className="font-semibold text-amber-600">Online Store</p>
            </div>
            
            {product.url && (
              <Button 
                className="w-full mt-2"
                variant="outline"
                onClick={() => window.open(product.url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Amazon
              </Button>
            )}
          </Card>
        ))}
        
        {/* eBay products */}
        {ebayProducts.slice(0, 3).map((product) => (
          <Card key={product.id} className="p-4">
            <div className="h-48 flex items-center justify-center mb-4 bg-gray-50 dark:bg-gray-800 rounded overflow-hidden">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              ) : (
                <span className="text-gray-500">No Image</span>
              )}
            </div>
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
            <p className="text-xl font-bold text-primary mb-2">
              {formatPriceToAED(product.price)}
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              <p>Retailer: {product.retailer || 'eBay'}</p>
              <p className="font-semibold text-red-600">Online Store</p>
            </div>
            
            {product.url && (
              <Button 
                className="w-full mt-2"
                variant="outline"
                onClick={() => window.open(product.url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on eBay
              </Button>
            )}
          </Card>
        ))}
      </div>
      
      {amazonProducts.length === 0 && ebayProducts.length === 0 && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-center">
          <p>No comparison products found. Try refining your search.</p>
        </div>
      )}
    </div>
  );
};
