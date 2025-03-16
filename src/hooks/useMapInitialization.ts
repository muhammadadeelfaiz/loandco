
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

// Default fallback token if all else fails
const DEFAULT_FALLBACK_TOKEN = 'pk.eyJ1IjoibG92YWJsZWFpIiwiYSI6ImNscDJsb2N0dDFmcHcya3BnYnZpNm9mbnEifQ.tHhXbyzm-GhoiZpFOSxG8A';

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
    // Clear localStorage
    localStorage.removeItem('mapbox_token');
    localStorage.removeItem('mapbox_token_timestamp');
    
    // Reset state
    setTokenError(null);
    setTokenSource(null);
    
    // Increment retry count to trigger a new fetch
    setRetryCount(prev => prev + 1);
  }, []);

  // Function to get the Mapbox token (from localStorage or fallback)
  const getMapboxToken = useCallback(async (): Promise<string> => {
    try {
      // Check for a cached token in localStorage
      const cachedToken = localStorage.getItem('mapbox_token');
      const cachedTimestamp = localStorage.getItem('mapbox_token_timestamp');
      
      if (cachedToken && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const currentTime = Date.now();
        
        // Use cached token if it's less than 24 hours old
        if (currentTime - timestamp < 24 * 60 * 60 * 1000) {
          console.log('Using cached Mapbox token');
          setTokenSource('cache');
          return cachedToken;
        }
      }
      
      // Use fallback token if no cached token
      console.log('Using fallback Mapbox token');
      setTokenSource('client-fallback');
      
      // Cache the token
      localStorage.setItem('mapbox_token', DEFAULT_FALLBACK_TOKEN);
      localStorage.setItem('mapbox_token_timestamp', Date.now().toString());
      
      return DEFAULT_FALLBACK_TOKEN;
    } catch (error) {
      console.error('Error in getMapboxToken:', error);
      setTokenError(error instanceof Error ? error.message : 'Unknown error getting token');
      return DEFAULT_FALLBACK_TOKEN;
    }
  }, [retryCount]); // Include retryCount to trigger a new fetch when retried

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
      const token = await getMapboxToken();
      
      if (!token) {
        setTokenError('Failed to obtain Mapbox token');
        setIsLoading(false);
        return null;
      }
      
      mapboxgl.accessToken = token;
      
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
  }, [mapContainerRef, theme, getMapboxToken]);

  return {
    isLoading,
    initializeMap,
    retryFetchToken,
    tokenError,
    tokenSource
  };
};
