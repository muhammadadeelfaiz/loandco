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
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        {product.store_latitude && product.store_longitude && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLocationClick}
            className="flex items-center gap-1 text-primary hover:text-primary-foreground hover:bg-primary"
          >
            <Map className="w-4 h-4" />
            <span>View Store</span>
          </Button>
        )}
      </div>
      <p className="text-gray-600 mb-2">Category: {product.category}</p>
      <p className="text-primary font-bold mb-2">{product.price.toFixed(2)} AED</p>
      {product.distance && product.distance !== Infinity && (
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          <MapPin className="w-4 h-4" />
          <span>{product.distance.toFixed(1)} km away</span>
        </div>
      )}
      <p className="text-sm text-gray-500 mb-4">
        Seller: {product.retailer_name}
      </p>
      <div className="flex gap-2">
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