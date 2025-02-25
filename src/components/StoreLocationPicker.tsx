
import { useState } from 'react';
import { Label } from './ui/label';
import Map from './Map';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface StoreLocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number };
}

const StoreLocationPicker = ({ onLocationSelect, initialLocation }: StoreLocationPickerProps) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(initialLocation || null);
  const [error, setError] = useState<string | null>(null);

  const handleLocationChange = (newLocation: { lat: number; lng: number }) => {
    setError(null);
    setLocation(newLocation);
    onLocationSelect(newLocation);
  };

  const handleMapError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Store Location</Label>
        <p className="text-sm text-gray-600">
          Click on the map to set your store's location
        </p>
      </div>
      
      {error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Map Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="h-[300px] rounded-lg overflow-hidden border-2 border-gray-200">
          <Map
            location={location}
            onLocationChange={handleLocationChange}
            readonly={false}
          />
        </div>
      )}
      
      {location && (
        <div className="text-sm text-gray-600">
          Selected location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default StoreLocationPicker;
