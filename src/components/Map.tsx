
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
}

const MapComponent = (props: MapProps) => {
  return (
    <div className="h-full w-full bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <div className="text-center p-6">
        <MapPin className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Map functionality will be implemented later
        </p>
        {props.location && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Location: {props.location.lat.toFixed(4)}, {props.location.lng.toFixed(4)}
          </p>
        )}
        {props.markers && props.markers.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {props.markers.length} markers available
          </p>
        )}
      </div>
    </div>
  );
};

export default MapComponent;
