import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MapControls from './MapControls';
import MapMarkerList from './MapMarkerList';
import MapCircleOverlay from './MapCircleOverlay';

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

const Map = ({ 
  location, 
  onLocationChange, 
  readonly = false,
  searchRadius = 5,
  markers = []
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapContainer.current) return;

    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        mapboxgl.accessToken = 'pk.eyJ1IjoibGFzdG1hbjFvMW8xIiwiYSI6ImNtNjhhY3JrZjBkYnIycnM4czBxdHJ0ODYifQ._X04qSsIXJCSzmvgFmyFQw';
        
        const newMap = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: location ? [location.lng, location.lat] : [0, 0],
          zoom: 13
        });

        newMap.on('load', () => {
          setIsLoading(false);
        });

        newMap.on('error', (e) => {
          console.error('Mapbox error:', e);
          setError('Failed to load map. Please try again later.');
          toast({
            variant: "destructive",
            title: "Error loading map",
            description: "Please check your internet connection and try again."
          });
        });

        if (!readonly) {
          newMap.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            
            if (userMarker.current) {
              userMarker.current.setLngLat([lng, lat]);
            } else {
              userMarker.current = new mapboxgl.Marker({ color: '#3B82F6' })
                .setLngLat([lng, lat])
                .addTo(newMap);
            }

            onLocationChange?.({ lng, lat });
          });
        }

        mapInstance.current = newMap;
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Failed to initialize map. Please try again later.');
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Error initializing map",
          description: err instanceof Error ? err.message : "An unexpected error occurred"
        });
      }
    };

    initializeMap();

    return () => {
      if (userMarker.current) {
        userMarker.current.remove();
      }
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, [location?.lat, location?.lng, onLocationChange, readonly, toast]);

  if (error) {
    return (
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-500 hover:text-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
      {mapInstance.current && (
        <>
          <MapControls map={mapInstance.current} />
          <MapMarkerList map={mapInstance.current} markers={markers} />
          {location && (
            <MapCircleOverlay
              map={mapInstance.current}
              center={[location.lng, location.lat]}
              radiusInKm={searchRadius}
            />
          )}
        </>
      )}
      <style>{`
        .marker {
          background-size: cover;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Map;