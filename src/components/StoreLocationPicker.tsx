
import { useState } from 'react';
import { Label } from './ui/label';
import Map from './Map';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface StoreLocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number };
}

const StoreLocationPicker = ({ onLocationSelect, initialLocation }: StoreLocationPickerProps) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(initialLocation || null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLocationChange = (newLocation: { lat: number; lng: number }) => {
    setError(null);
    setLocation(newLocation);
    onLocationSelect(newLocation);
  };

  const handleMapError = (errorMessage: string) => {
    console.error('Map error received:', errorMessage);
    setError(errorMessage);
    toast({
      variant: "destructive",
      title: "Map Error",
      description: errorMessage || "There was an error loading the map. Please try again.",
    });
  };

  const handleRetry = () => {
    setError(null);
    // Force a re-render by updating state
    setLocation(location => location ? {...location} : null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Store Location</Label>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click on the map to set your store's location
        </p>
      </div>
      
      {error ? (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Map Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRetry} variant="outline">
            Retry Loading Map
          </Button>
        </div>
      ) : (
        <div className="h-[300px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <Map
            location={location}
            onLocationChange={handleLocationChange}
            readonly={false}
            onError={handleMapError}
          />
        </div>
      )}
      
      {location && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Selected location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default StoreLocationPicker;
