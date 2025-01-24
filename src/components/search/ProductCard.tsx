import { Button } from "@/components/ui/button";
import { Mail, MapPin, Navigation, Map } from 'lucide-react';

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
  const handleLocationClick = () => {
    if (product.store_latitude && product.store_longitude) {
      window.open(
        `https://www.google.com/maps?q=${product.store_latitude},${product.store_longitude}`,
        '_blank'
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200 border border-gray-100">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900 leading-tight">{product.name}</h3>
        
        <div className="flex items-center justify-between">
          <p className="text-primary font-semibold text-lg">
            {product.price.toFixed(2)} AED
          </p>
          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
            {product.category}
          </span>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          {product.distance && product.distance !== Infinity && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="text-xs">{product.distance.toFixed(1)} km</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600">
          {product.retailer_name}
        </p>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        <Button 
          variant="outline"
          size="sm"
          className="flex-1 min-w-[80px]"
          onClick={() => onContactRetailer(product.retailer_name)}
        >
          <Mail className="w-3 h-3 mr-1" />
          Contact
        </Button>
        
        {product.store_latitude && product.store_longitude && (
          <>
            <Button 
              variant="default"
              size="sm"
              className="flex-1 min-w-[80px]"
              onClick={handleLocationClick}
            >
              <Map className="w-3 h-3 mr-1" />
              Location
            </Button>
            
            <Button 
              variant="outline"
              size="sm"
              className="flex-1 min-w-[80px]"
              onClick={() => onGetDirections(
                product.store_latitude,
                product.store_longitude,
                product.retailer_name
              )}
            >
              <Navigation className="w-3 h-3 mr-1" />
              Directions
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductCard;