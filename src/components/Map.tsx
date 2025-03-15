
import React from 'react';
import MapboxMap from './map/MapboxMap';

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

// Using React.memo to prevent unnecessary re-renders
const Map = React.memo((props: MapProps) => {
  console.log('Rendering Map component with props:', {
    hasLocation: !!props.location,
    isReadonly: props.readonly,
    markersCount: props.markers?.length
  });
  
  return <MapboxMap {...props} />;
});

Map.displayName = 'Map';

export default Map;
