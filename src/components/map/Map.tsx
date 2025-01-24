import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MapContext } from './MapContext';
import MapControls from './MapControls';
import CircleOverlay from './CircleOverlay';
import MapMarkers from './MapMarkers';
import { useTheme } from '@/hooks/useTheme';

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
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { theme } = useTheme();

  // Default center coordinates (Dubai)
  const defaultCenter = { lng: 55.2708, lat: 25.2048 };
  const defaultZoom = 11;

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    try {
      mapboxgl.accessToken = process.env.MAPBOX_PUBLIC_TOKEN || 'pk.eyJ1IjoibGFzdG1hbjFvMW8xIiwiYSI6ImNtNjhhY3JrZjBkYnIycnM4czBxdHJ0ODYifQ._X04qSsIXJCSzmvgFmyFQw';
      
      const initialCenter = location || defaultCenter;
      
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: theme === 'dark' 
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/streets-v11',
        center: [initialCenter.lng, initialCenter.lat],
        zoom: defaultZoom,
        minZoom: 2
      });

      map.on('load', () => {
        console.log('Map loaded successfully');
        setIsLoading(false);
        if (location) {
          map.flyTo({
            center: [location.lng, location.lat],
            zoom: defaultZoom,
            essential: true
          });
        }
      });

      map.on('error', (e) => {
        console.error('Map error:', e);
        toast({
          variant: "destructive",
          title: "Map Error",
          description: "There was an error loading the map. Please try again."
        });
        setIsLoading(false);
      });

      if (location) {
        markerRef.current = new mapboxgl.Marker({ color: '#3B82F6' })
          .setLngLat([location.lng, location.lat])
          .addTo(map);
      }

      mapRef.current = map;

      return () => {
        if (markerRef.current) {
          markerRef.current.remove();
        }
        map.remove();
        mapRef.current = null;
      };
    } catch (error) {
      console.error('Map initialization error:', error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error initializing map",
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    }
  }, [location?.lat, location?.lng, toast, theme]);

  // Update map style when theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setStyle(
      theme === 'dark'
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/streets-v11'
    );
  }, [theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || readonly) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new mapboxgl.Marker({ color: '#3B82F6' })
          .setLngLat([lng, lat])
          .addTo(map);
      }

      onLocationChange?.({ lng, lat });
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [readonly, onLocationChange]);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <MapContext.Provider value={{ mapRef }}>
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        {location && mapRef.current && (
          <CircleOverlay
            center={[location.lng, location.lat]}
            radiusInKm={searchRadius}
          />
        )}
        <MapControls />
        <MapMarkers markers={markers} />
      </MapContext.Provider>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
    </div>
  );
};

export default Map;