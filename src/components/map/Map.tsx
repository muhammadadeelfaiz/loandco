
import MapboxMap from './MapboxMap';
import { useRef, useEffect } from 'react';
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
  showRadius?: boolean;
}

const Map = (props: MapProps) => {
  const initComplete = useRef(false);
  
  console.log('Rendering Map component with props:', {
    hasLocation: !!props.location,
    isReadonly: props.readonly,
    markersCount: props.markers?.length,
    selectedLocation: props.selectedLocation,
    showRadius: props.showRadius
  });
  
  // Ensure markers are valid - this helps with non-authenticated states
  useEffect(() => {
    if (props.markers) {
      const invalidMarkers = props.markers.filter(
        marker => isNaN(marker.lat) || isNaN(marker.lng) || 
                  marker.lat < -90 || marker.lat > 90 || 
                  marker.lng < -180 || marker.lng > 180
      );
      
      if (invalidMarkers.length > 0) {
        console.warn('Invalid markers detected:', invalidMarkers);
        props.onError?.('Some map markers have invalid coordinates');
      }
    }
  }, [props.markers]);
  
  return (
    <div className="relative w-full h-full">
      <MapboxMap {...props} initComplete={initComplete} />
      
      {/* Visual indicator for map center when no location or selection yet */}
      {!props.readonly && !props.location && !props.selectedLocation && (
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
