
import { useState, useCallback, useEffect, useRef, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';

interface UseMapInitializationResult {
  isLoading: boolean;
  initializeMap: (
    center: { lat: number; lng: number },
    onLocationChange?: (location: { lat: number; lng: number }) => void,
    readonly?: boolean
  ) => Promise<mapboxgl.Map | null>;
  retryFetchToken: () => void;
  tokenError: string | null;
  tokenSource: string | null;
}

// Updated Mapbox public token
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

export const useMapInitialization = (
  mapContainerRef: MutableRefObject<HTMLDivElement | null>,
  theme: string
): UseMapInitializationResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSource, setTokenSource] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Retry fetch token
  const retryFetchToken = useCallback(() => {
    // Reset state
    setTokenError(null);
    setTokenSource(null);
    
    // Increment retry count to trigger a new initialization
    setRetryCount(prev => prev + 1);
  }, []);

  // Initialize the map
  const initializeMap = useCallback(async (
    center: { lat: number; lng: number },
    onLocationChange?: (location: { lat: number; lng: number }) => void,
    readonly: boolean = false
  ): Promise<mapboxgl.Map | null> => {
    if (!mapContainerRef.current) {
      console.error('Map container ref is null');
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // Always use the hardcoded token directly
      mapboxgl.accessToken = MAPBOX_TOKEN;
      setTokenSource('hardcoded');
      
      // Create the map
      const newMap = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
        center: [center.lng, center.lat],
        zoom: 12,
        attributionControl: false,
        preserveDrawingBuffer: true
      });
      
      // Add navigation controls if not readonly
      if (!readonly) {
        newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
      }
      
      // Add click handler if location changes are allowed
      if (!readonly && onLocationChange) {
        newMap.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          onLocationChange({ lat, lng });
        });
      }
      
      // Add attribution
      newMap.addControl(new mapboxgl.AttributionControl({
        compact: true
      }));
      
      setIsLoading(false);
      
      return newMap;
    } catch (error) {
      console.error('Error initializing map:', error);
      setTokenError(error instanceof Error ? error.message : 'Unknown error initializing map');
      setIsLoading(false);
      return null;
    }
  }, [mapContainerRef, theme, retryCount]);

  return {
    isLoading,
    initializeMap,
    retryFetchToken,
    tokenError,
    tokenSource
  };
};
