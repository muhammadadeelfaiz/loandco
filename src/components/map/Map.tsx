
import MapboxMap from './MapboxMap';
import { useRef } from 'react';
import { MapPin } from 'lucide-react';

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
  selectedLocation?: { lat: number; lng: number } | null;
}

const Map = (props: MapProps) => {
  const initComplete = useRef(false);
  
  console.log('Rendering Map component with props:', {
    hasLocation: !!props.location,
    isReadonly: props.readonly,
    markersCount: props.markers?.length,
    selectedLocation: props.selectedLocation
  });
  
  return (
    <div className="relative w-full h-full">
      <MapboxMap {...props} initComplete={initComplete} />
      
      {/* Visual indicator for map center when selecting a location */}
      {!props.readonly && !props.location && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center">
          <MapPin className="h-8 w-8 text-primary animate-bounce" strokeWidth={2} />
          <div className="bg-white dark:bg-gray-800 text-sm mt-1 px-2 py-1 rounded-md shadow-md">
            Click to set location
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
