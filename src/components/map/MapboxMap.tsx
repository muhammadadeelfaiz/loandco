
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { useSearchRadius } from '@/hooks/useSearchRadius';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface MapboxMapProps {
  location?: { lat: number; lng: number };
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

// Define a type for Mapbox error events
interface MapboxError extends Error {
  sourceError?: {
    status?: number;
  };
}

const MapboxMap = ({
  location,
  onLocationChange,
  readonly = false,
  searchRadius = 5,
  markers = [],
  onError
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const { isLoading, initializeMap } = useMapInitialization(mapContainer, theme);
  
  const markersInstance = useMapMarkers();
  const searchRadiusInstance = useSearchRadius();

  const defaultCenter = { lat: 25.2048, lng: 55.2708 }; // Dubai as default

  const handleError = (errorMessage: string) => {
    console.error('Map error:', errorMessage);
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    
    const initialize = async () => {
      try {
        setError(null);
        const initialCenter = location || defaultCenter;
        console.log('Initializing map with location:', initialCenter);
        
        const newMap = await initializeMap(initialCenter, onLocationChange, readonly);
        
        if (newMap) {
          map.current = newMap;
          
          // Add error handling for map load
          newMap.on('load', () => {
            console.log('Map initialized successfully');
            setIsMapInitialized(true);
          });

          // Add specific error handling for authentication errors
          newMap.on('error', (e: mapboxgl.ErrorEvent) => {
            console.error('Map error event:', e);
            const mapError = e.error as MapboxError;
            if (mapError?.sourceError?.status === 403) {
              handleError('Map authentication failed. Please check your Mapbox token.');
            } else {
              handleError('There was an error loading the map. Please check your internet connection.');
            }
          });
        } else {
          handleError('Failed to initialize map. Token might be invalid or network issues.');
        }
      } catch (err) {
        console.error('Map initialization error:', err);
        handleError('Failed to initialize map. Please try refreshing the page.');
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
  }, [location, onLocationChange, readonly, initializeMap, onError]);

  useEffect(() => {
    if (!map.current || !isMapInitialized) return;

    map.current.setStyle(
      theme === 'dark'
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11'
    );
  }, [theme, isMapInitialized]);

  useEffect(() => {
    if (!map.current || !isMapInitialized) return;
    markersInstance.updateMarkers(map.current, markers);
  }, [markers, isMapInitialized, markersInstance]);

  useEffect(() => {
    if (!map.current || !isMapInitialized || !location) return;
    searchRadiusInstance.updateSearchRadius(map.current, location, searchRadius);
  }, [location, searchRadius, isMapInitialized, searchRadiusInstance]);

  if (error) {
    return (
      <Alert variant="destructive" className="h-full flex items-center justify-center">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Map Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700" 
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
    </div>
  );
};

export default MapboxMap;
