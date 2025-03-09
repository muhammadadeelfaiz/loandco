
import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import GoMap from './map/GoMap';

interface MapProps {
  location?: { lat: number; lng: number } | null;
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  readonly?: boolean;
  searchRadius?: number;
  onError?: (message: string) => void;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    description?: string;
  }>;
}

const MapComponent = (props: MapProps) => {
  const [error, setError] = useState<string | null>(null);
  const [forceRender, setForceRender] = useState(0);
  const { toast } = useToast();
  
  const handleMapError = (message: string) => {
    console.error("Map error in MapComponent:", message);
    setError(message);
    if (props.onError) {
      props.onError(message);
    }
    
    toast({
      variant: "destructive",
      title: "Map Error",
      description: message || "Failed to load the map. Please check your internet connection.",
      duration: 5000,
    });
  };
  
  const handleRetry = () => {
    console.log('Retrying map render in MapComponent...');
    setError(null);
    // Clear any cached data
    localStorage.removeItem('google_maps_api_key');
    localStorage.removeItem('google_maps_api_key_timestamp');
    // Force a complete re-initialization of the map
    setForceRender(prev => prev + 1);
    
    toast({
      title: "Retrying Map",
      description: "Attempting to reload the map...",
      duration: 3000,
    });
  };

  // Clear any local storage on mount to ensure fresh tokens
  useEffect(() => {
    localStorage.removeItem('google_maps_api_key');
    localStorage.removeItem('google_maps_api_key_timestamp');
    setError(null);
  }, []);

  if (error) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Map Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={handleRetry} 
          variant="outline" 
          className="mt-4 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Loading Map
        </Button>
      </div>
    );
  }

  if (!props.location && !props.markers?.length) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Waiting for location data...</p>
      </div>
    );
  }

  return (
    <GoMap 
      {...props} 
      key={`map-${forceRender}`} 
      onError={handleMapError} 
    />
  );
};

export default MapComponent;
