
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
        <div className="grid grid-cols-1 gap-4">
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
      
      {/* Local Products Section */}
      {localProduct && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 bg-primary/10 p-2 rounded">Local Stores</h3>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-1 gap-4">
                <Card className="p-4 border border-primary">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="h-36 w-36 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded">
                      <span className="text-gray-500">Product Image</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{localProduct.name}</h3>
                      <p className="text-xl font-bold text-primary mb-2">
                        AED {localProduct.price.toFixed(2)}
                      </p>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {localProduct.store_name && (
                          <p>Retailer: {localProduct.store_name}</p>
                        )}
                        <p className="font-semibold text-primary">Local Store</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {localProduct.latitude && localProduct.longitude && (
                          <Button 
                            variant="outline"
                            onClick={() => onGetDirections && onGetDirections(
                              localProduct.latitude!,
                              localProduct.longitude!,
                              localProduct.store_name || "Store"
                            )}
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            View on Map
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline"
                          onClick={() => handleAddToWishlist(localProduct.id)}
                          disabled={!user || wishlistStates[localProduct.id]}
                        >
                          <Heart className={`w-4 h-4 mr-2 ${wishlistStates[localProduct.id] ? 'fill-current text-red-500' : ''}`} />
                          {wishlistStates[localProduct.id] ? 'Added to Wishlist' : 'Add to Wishlist'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Amazon Products Section */}
      {amazonProducts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 bg-amber-600/10 p-2 rounded">Amazon Products</h3>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-1 gap-4">
                {amazonProducts.slice(0, 3).map((product) => (
                  <Card key={product.id} className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="h-36 w-36 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded overflow-hidden">
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
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                        <p className="text-xl font-bold text-primary mb-2">
                          {formatPriceToAED(product.price)}
                        </p>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <p>Retailer: {product.retailer || 'Amazon.ae'}</p>
                          <p className="font-semibold text-amber-600">Online Store</p>
                        </div>
                        
                        {product.url && (
                          <Button 
                            variant="outline"
                            onClick={() => window.open(product.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on Amazon
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* eBay Products Section */}
      {ebayProducts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4 bg-red-600/10 p-2 rounded">eBay Products</h3>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-1 gap-4">
                {ebayProducts.slice(0, 3).map((product) => (
                  <Card key={product.id} className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="h-36 w-36 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded overflow-hidden">
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
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                        <p className="text-xl font-bold text-primary mb-2">
                          {formatPriceToAED(product.price)}
                        </p>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <p>Retailer: {product.retailer || 'eBay'}</p>
                          <p className="font-semibold text-red-600">Online Store</p>
                        </div>
                        
                        {product.url && (
                          <Button 
                            variant="outline"
                            onClick={() => window.open(product.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on eBay
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {amazonProducts.length === 0 && ebayProducts.length === 0 && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-center">
          <p>No comparison products found. Try refining your search.</p>
        </div>
      )}
    </div>
  );
};
