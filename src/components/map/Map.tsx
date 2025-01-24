import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MapContext } from './MapContext';
import MapControls from './MapControls';
import CircleOverlay from './CircleOverlay';
import MapMarkers from './MapMarkers';

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
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    try {
      mapboxgl.accessToken = process.env.MAPBOX_PUBLIC_TOKEN || 'pk.eyJ1IjoibGFzdG1hbjFvMW8xIiwiYSI6ImNtNjhhY3JrZjBkYnIycnM4czBxdHJ0ODYifQ._X04qSsIXJCSzmvgFmyFQw';
      
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: location ? [location.lng, location.lat] : [0, 0],
        zoom: 13
      });

      map.on('load', () => {
        setIsLoading(false);
      });

      mapInstance.current = map;

      return () => {
        if (markerRef.current) {
          markerRef.current.remove();
        }
        map.remove();
        mapInstance.current = null;
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
  }, [location?.lat, location?.lng, toast]);

  useEffect(() => {
    const map = mapInstance.current;
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
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      <MapContext.Provider value={{ map: mapInstance.current }}>
        <div ref={mapContainer} className="absolute inset-0" />
        {location && mapInstance.current && (
          <CircleOverlay
            center={[location.lng, location.lat]}
            radiusInKm={searchRadius}
          />
        )}
        <MapControls />
        <MapMarkers markers={markers} />
      </MapContext.Provider>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
    </div>
  );
};

export default Map;