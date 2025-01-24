import { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import Map from './Map';

interface StoreLocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number };
}

const StoreLocationPicker = ({ onLocationSelect, initialLocation }: StoreLocationPickerProps) => {
  const [location, setLocation] = useState(initialLocation);

  const handleLocationChange = (newLocation: { lat: number; lng: number }) => {
    setLocation(newLocation);
    onLocationSelect(newLocation);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Store Location</Label>
        <p className="text-sm text-gray-600">
          Click on the map to set your store's location
        </p>
      </div>
      <Map
        location={location}
        onLocationChange={handleLocationChange}
      />
      {location && (
        <div className="text-sm text-gray-600">
          Selected location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default StoreLocationPicker;