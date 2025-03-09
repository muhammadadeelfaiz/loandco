
import { useState, useEffect } from 'react';
import { Label } from './ui/label';
import Map from './Map';
import { AlertTriangle, RefreshCw } from 'lucide-react';
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
  const [forceRender, setForceRender] = useState(0);
  const { toast } = useToast();

  // Reset localStorage on mount to ensure fresh tokens
  useEffect(() => {
    localStorage.removeItem('google_maps_api_key');
    localStorage.removeItem('google_maps_api_key_timestamp');
  }, []);

  const handleLocationChange = (newLocation: { lat: number; lng: number }) => {
    console.log('Location changed in StoreLocationPicker:', newLocation);
    setError(null);
    setLocation(newLocation);
    onLocationSelect(newLocation);
    
    toast({
      title: "Location Selected",
      description: `Location set at ${newLocation.lat.toFixed(4)}, ${newLocation.lng.toFixed(4)}`,
      duration: 3000,
    });
  };

  const handleMapError = (errorMessage: string) => {
    console.error('Map error in StoreLocationPicker:', errorMessage);
    setError(errorMessage);
    toast({
      variant: "destructive",
      title: "Map Error",
      description: errorMessage || "There was an error loading the map. Please try again.",
      duration: 5000,
    });
  };

  const handleRetry = () => {
    console.log('Retrying map load in StoreLocationPicker...');
    setError(null);
    // Clear localStorage cache when retrying
    localStorage.removeItem('google_maps_api_key');
    localStorage.removeItem('google_maps_api_key_timestamp');
    setForceRender(prev => prev + 1);
    
    toast({
      title: "Retrying",
      description: "Attempting to reload the map...",
      duration: 3000,
    });
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
          <Button 
            onClick={handleRetry} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Loading Map
          </Button>
        </div>
      ) : (
        <div className="h-[300px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <Map
            key={`location-map-${forceRender}`}
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
