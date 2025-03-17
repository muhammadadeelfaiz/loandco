
import MapboxMap from './MapboxMap';
import { useRef } from 'react';

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

const Map = (props: MapProps) => {
  const initComplete = useRef(false);
  
  console.log('Rendering Map component with props:', {
    hasLocation: !!props.location,
    isReadonly: props.readonly,
    markersCount: props.markers?.length
  });
  
  return <MapboxMap {...props} initComplete={initComplete} />;
};

export default Map;
