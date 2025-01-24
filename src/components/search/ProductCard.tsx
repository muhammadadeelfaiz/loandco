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
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
      <p className="text-gray-600 mb-2">Category: {product.category}</p>
      <p className="text-primary font-bold mb-2">{product.price.toFixed(2)} AED</p>
      
      <div className="flex items-center mb-4">
        {product.distance && product.distance !== Infinity && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>{product.distance.toFixed(1)} km away</span>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Seller: {product.retailer_name}
      </p>
      
      <div className="flex gap-2">
        <Button 
          variant="outline"
          onClick={() => onContactRetailer(product.retailer_name)}
        >
          <Mail className="w-4 h-4 mr-2" />
          Contact
        </Button>
        {product.store_latitude && product.store_longitude && (
          <Button 
            variant="default"
            onClick={handleLocationClick}
          >
            <Map className="w-4 h-4 mr-2" />
            Location
          </Button>
        )}
        {product.store_latitude && product.store_longitude && (
          <Button 
            variant="outline"
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