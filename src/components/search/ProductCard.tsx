import { Button } from "@/components/ui/button";
import { Mail, MapPin, Star } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    retailer_id?: string;
    retailer_name?: string;
    distance?: number;
    store_latitude?: number;
    store_longitude?: number;
  };
  onContactRetailer: (retailerName: string) => void;
  onGetDirections: (lat: number, lng: number, storeName: string) => void;
}

const ProductCard = ({ product, onContactRetailer, onGetDirections }: ProductCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        <div className="flex gap-4">
          <div className="w-48 h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <div className="text-gray-400 dark:text-gray-500">Product Image</div>
          </div>
          
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {product.category}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 dark:text-gray-300">4.5</span>
              </div>
            </div>
            
            <p className="text-2xl font-bold text-primary mb-4">
              AED {product.price.toFixed(2)}
            </p>
            
            {product.retailer_name && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                <span>Sold by {product.retailer_name}</span>
              </div>
            )}
            
            {product.distance && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{product.distance.toFixed(1)}km away</span>
              </div>
            )}
            
            <div className="flex gap-2 mt-auto">
              {product.retailer_name && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => onContactRetailer(product.retailer_name!)}
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Contact Seller
                </Button>
              )}
              
              {product.store_latitude && product.store_longitude && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGetDirections(
                    product.store_latitude!,
                    product.store_longitude!,
                    product.retailer_name || "Store"
                  )}
                  className="flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Get Directions
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;