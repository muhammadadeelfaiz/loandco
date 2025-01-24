import { Button } from "@/components/ui/button";
import { Mail, MapPin, Navigation } from 'lucide-react';

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

const ProductCard = ({ product, onContactRetailer, onGetDirections }: ProductCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
      <p className="text-gray-600 mb-2">Category: {product.category}</p>
      <p className="text-primary font-bold">{product.price.toFixed(2)} AED</p>
      {product.distance && product.distance !== Infinity && (
        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
          <MapPin className="w-4 h-4" />
          <span>{product.distance.toFixed(1)} km away</span>
        </div>
      )}
      <p className="text-sm text-gray-500 mt-2">
        Seller: {product.retailer_name}
      </p>
      <div className="mt-4 flex gap-2">
        <Button 
          variant="outline"
          className="flex-1"
          onClick={() => onContactRetailer(product.retailer_name)}
        >
          <Mail className="w-4 h-4 mr-2" />
          Contact
        </Button>
        {product.store_latitude && product.store_longitude && (
          <Button 
            variant="outline"
            className="flex-1"
            onClick={() => onGetDirections(
              product.store_latitude,
              product.store_longitude,
              product.retailer_name
            )}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Directions
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;