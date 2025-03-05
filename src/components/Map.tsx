
import { useEffect, useRef } from 'react';
import Map from './map/Map';

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
  if (!props.location && !props.markers?.length) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">Waiting for location data...</p>
      </div>
    );
  }

  return <Map {...props} />;
};

export default MapComponent;
