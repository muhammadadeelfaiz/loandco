
import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import MapboxMap from './map/MapboxMap';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
  onMarkerClick?: (markerId: string) => void;
}

// Updated Mapbox public token
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

const Map = memo((props: MapProps) => {
  const { toast } = useToast();
  const [isLoadingFallback, setIsLoadingFallback] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const initCompleteRef = useRef(false);
  
  // Log marker data for debugging
  useEffect(() => {
    console.log('Map component markers:', props.markers?.length, props.markers);
  }, [props.markers]);
  
  // Log search radius changes
  useEffect(() => {
    console.log('Map search radius updated:', props.searchRadius);
  }, [props.searchRadius]);
  
  const handleMapError = useCallback((errorMessage: string) => {
    console.error('Map error:', errorMessage);
    setMapError(errorMessage);
    
    // Call the onError prop if provided
    if (props.onError) {
      props.onError(errorMessage);
    }
    
    // Also show a toast notification for better visibility
    toast({
      variant: "destructive",
      title: "Map Error",
      description: errorMessage,
      duration: 5000,
    });
  }, [props.onError, toast]);
  
  const handleRetry = useCallback(() => {
    // Clear any cached data
    localStorage.removeItem('mapbox_token');
    localStorage.removeItem('mapbox_token_timestamp');
    setMapError(null);
    setIsLoadingFallback(true);
    initCompleteRef.current = false;
    setRetryCount(prev => prev + 1);
    
    // Wait a moment to ensure state updates
    setTimeout(() => {
      setIsLoadingFallback(false);
    }, 2000);
  }, []);
  
  if (mapError) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Map Loading Error</AlertTitle>
          <AlertDescription className="mt-2">
            {mapError}
            <p className="text-xs mt-1 opacity-75">Domain: {window.location.hostname}</p>
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={handleRetry} 
          className="mt-4 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Loading Map
        </Button>
      </div>
    );
  }
  
  if (isLoadingFallback) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Reinitializing map...</p>
      </div>
    );
  }

  return (
    <MapboxMap 
      key={`map-${retryCount}`}
      location={props.location}
      onLocationChange={props.onLocationChange}
      readonly={props.readonly}
      searchRadius={props.searchRadius || 30} // Default to 30km radius
      markers={props.markers} 
      onError={handleMapError}
      onMarkerClick={props.onMarkerClick}
      initComplete={initCompleteRef}
      fallbackToken={MAPBOX_TOKEN}
    />
  );
});

Map.displayName = 'Map';

export default Map;
