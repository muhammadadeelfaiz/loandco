
import React, { memo, useCallback } from 'react';
import MapboxMap from './map/MapboxMap';
import { useToast } from '@/hooks/use-toast';

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
  
  console.log('Rendering Map component with props:', {
    hasLocation: !!props.location,
    isReadonly: props.readonly,
    markersCount: props.markers?.length
  });
  
  const handleMapError = useCallback((errorMessage: string) => {
    console.error('Map error:', errorMessage);
    
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
  
  return <MapboxMap {...props} onError={handleMapError} />;
});

Map.displayName = 'Map';

export default Map;
