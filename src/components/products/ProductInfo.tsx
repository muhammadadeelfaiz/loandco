
import React from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface Store {
  latitude: number;
  longitude: number;
}

interface ProductInfoProps {
  name: string;
  category: string;
  price: number;
  userLocation?: { lat: number; lng: number };
  store?: Store;
  description?: string;
}

const ProductInfo = ({ 
  name, 
  category, 
  price, 
  userLocation, 
  store, 
  description 
}: ProductInfoProps) => {
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div>
          <p className="text-3xl font-bold text-primary">AED {price}</p>
          <Badge variant="secondary" className="mt-1">Available</Badge>
        </div>
        {userLocation && store && (
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            <span>
              {calculateDistance(
                userLocation.lat,
                userLocation.lng,
                store.latitude,
                store.longitude
              ).toFixed(1)}km away
            </span>
          </div>
        )}
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <h3>Product Description</h3>
        <p className="text-gray-600 dark:text-gray-400">
          {description || `Experience the latest ${name} with its stunning display, powerful processor, and advanced features. Available now at our store.`}
        </p>
      </div>
    </div>
  );
};

export default ProductInfo;
