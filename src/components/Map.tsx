import { useEffect, useRef } from 'react';
import Map from './map/Map';

interface MapProps {
  location?: { lat: number; lng: number };
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  readonly?: boolean;
  searchRadius?: number;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    description?: string;
  }>;
}

const MapComponent = (props: MapProps) => {
  return <Map {...props} />;
};

export default MapComponent;