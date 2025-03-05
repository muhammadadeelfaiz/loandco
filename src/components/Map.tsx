
import { useState } from 'react';
import Map from './map/Map';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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
  
  const handleMapError = (message: string) => {
    console.error("Map error in MapComponent:", message);
    setError(message);
    if (props.onError) {
      props.onError(message);
    }
  };
  
  const handleRetry = () => {
    console.log('Retrying map render in MapComponent...');
    setError(null);
    // Clear localStorage cache when retrying
    localStorage.removeItem('mapbox_token');
    localStorage.removeItem('mapbox_token_timestamp');
    setForceRender(prev => prev + 1);
  };

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
    <Map 
      {...props} 
      key={`map-${forceRender}`} 
      onError={handleMapError} 
    />
  );
};

export default MapComponent;
