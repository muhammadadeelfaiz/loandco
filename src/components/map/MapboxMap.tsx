
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { useSearchRadius } from '@/hooks/useSearchRadius';

interface MapboxMapProps {
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

const MapboxMap = ({
  location,
  onLocationChange,
  readonly = false,
  searchRadius = 5,
  markers = []
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const { theme } = useTheme();
  const { isLoading, initializeMap } = useMapInitialization(mapContainer, theme);
  
  // Create refs for markers and search radius management
  const markersInstance = useMapMarkers();
  const searchRadiusInstance = useSearchRadius();

  // Default center coordinates (Dubai)
  const defaultCenter = { lat: 25.2048, lng: 55.2708 };

  useEffect(() => {
    if (!mapContainer.current) return;
    
    const initialize = async () => {
      const initialCenter = location || defaultCenter;
      const newMap = await initializeMap(initialCenter, onLocationChange, readonly);
      if (newMap) {
        map.current = newMap;
        newMap.on('load', () => {
          console.log('Map initialized successfully');
          setIsMapInitialized(true);
        });
      }
    };

    initialize();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setIsMapInitialized(false);
      }
    };
  }, [location, onLocationChange, readonly]);

  // Update map style when theme changes
  useEffect(() => {
    if (!map.current || !isMapInitialized) return;

    map.current.setStyle(
      theme === 'dark'
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11'
    );
  }, [theme, isMapInitialized]);

  // Update markers when they change
  useEffect(() => {
    if (!map.current || !isMapInitialized) return;
    markersInstance.updateMarkers(map.current, markers);
  }, [markers, isMapInitialized]);

  // Update search radius when location or radius changes
  useEffect(() => {
    if (!map.current || !isMapInitialized) return;
    searchRadiusInstance.updateSearchRadius(map.current, location, searchRadius);
  }, [location, searchRadius, isMapInitialized]);

  return (
    <div className="w-full h-full">
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700" 
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
    </div>
  );
};

export default MapboxMap;
