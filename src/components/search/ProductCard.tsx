import { Button } from "@/components/ui/button";
import { Mail, MapPin } from 'lucide-react';

interface ProductCardProps {
  product: {
    name: string;
    price: number;
    category: string;
    retailer_name: string;
    distance?: number;
    store_latitude?: number;
    store_longitude?: number;
  };
  onContactRetailer: (retailerName: string) => void;
  onGetDirections: (lat: number, lng: number, storeName: string) => void;
}

const ProductCard = ({ product, onContactRetailer }: ProductCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 hover:shadow-lg transition-shadow">
      <div className="flex gap-6">
        <div className="w-40 h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          {/* Placeholder for product image */}
          <div className="text-gray-400">Product Image</div>
        </div>
        
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{product.name}</h3>
            <p className="text-lg font-bold text-primary mt-1">
              AED {product.price.toFixed(2)}
            </p>
            
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="w-4 h-4" />
              <span>
                Retailer located {product.distance?.toFixed(1)}km from your current location!
              </span>
            </div>
            
            <div className="mt-2">
              <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                Sold by {product.retailer_name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;