
import React, { memo, useCallback, useState } from 'react';
import MapboxMap from './map/MapboxMap';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
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
}

const Map = memo((props: MapProps) => {
  const { toast } = useToast();
  const [isLoadingFallback, setIsLoadingFallback] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Removed console.log that was causing frequent re-renders
  
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
    // Clear localStorage cache
    localStorage.removeItem('mapbox_token');
    localStorage.removeItem('mapbox_token_timestamp');
    setMapError(null);
    setIsLoadingFallback(true);
    
    // Wait a brief moment to ensure state updates
    setTimeout(() => {
      setIsLoadingFallback(false);
    }, 500);
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
          className="mt-4"
        >
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
  
  return <MapboxMap {...props} onError={handleMapError} />;
});

Map.displayName = 'Map';

export default Map;
