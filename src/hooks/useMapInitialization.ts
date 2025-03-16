
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

export const useMapInitialization = (
  mapContainerRef: MutableRefObject<HTMLDivElement | null>,
  theme: string
): UseMapInitializationResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSource, setTokenSource] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const tokenFetchPromiseRef = useRef<Promise<string | null> | null>(null);

  // Clear the fetch token promise reference
  const clearTokenFetchPromise = useCallback(() => {
    tokenFetchPromiseRef.current = null;
  }, []);

  // Retry fetch token
  const retryFetchToken = useCallback(() => {
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear localStorage
    localStorage.removeItem('mapbox_token');
    localStorage.removeItem('mapbox_token_timestamp');
    
    // Reset state
    setTokenError(null);
    setTokenSource(null);
    clearTokenFetchPromise();
    
    // Increment retry count to trigger a new fetch
    setRetryCount(prev => prev + 1);
  }, [clearTokenFetchPromise]);

  // Helper function to fetch directly with retry mechanism
  const fetchWithRetries = useCallback(async (url: string, options: RequestInit, maxRetries = 3): Promise<Response> => {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Fetch attempt ${attempt + 1}/${maxRetries} for ${url}`);
        const response = await fetch(url, options);
        
        // Check if the response is valid JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return response;
        }
        
        // If not JSON, log and throw error
        const text = await response.text();
        console.error(`Invalid response format (not JSON): ${text.substring(0, 100)}...`);
        throw new Error(`Server returned non-JSON response. Attempt ${attempt + 1}/${maxRetries}`);
      } catch (error) {
        lastError = error;
        
        // Don't retry if aborted
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }
        
        // Wait before retry with exponential backoff
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 500;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error(`Failed after ${maxRetries} attempts`);
  }, []);

  // Function to fetch a Mapbox token
  const fetchMapboxToken = useCallback(async (): Promise<string | null> => {
    // If there's already a fetch in progress, return that promise
    if (tokenFetchPromiseRef.current) {
      return tokenFetchPromiseRef.current;
    }
    
    // Check for a cached token in localStorage
    const cachedToken = localStorage.getItem('mapbox_token');
    const cachedTimestamp = localStorage.getItem('mapbox_token_timestamp');
    
    if (cachedToken && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp, 10);
      const currentTime = Date.now();
      
      // Use cached token if it's less than 1 hour old
      if (currentTime - timestamp < 60 * 60 * 1000) {
        console.log('Using cached Mapbox token');
        setTokenSource('cache');
        return cachedToken;
      }
    }
    
    // If no valid cached token, fetch a new one
    try {
      setIsLoading(true);
      
      // Create a new AbortController for this request
      abortControllerRef.current = new AbortController();
      
      // Create the fetch promise
      tokenFetchPromiseRef.current = (async () => {
        try {
          console.log('Fetching new Mapbox token');
          
          // Use the fetchWithRetries helper
          const response = await fetchWithRetries('/api/map-service', {
            signal: abortControllerRef.current?.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Accept': 'application/json'
            }
          });
          
          // Parse response
          const data = await response.json();
          
          if (data.token) {
            console.log(`Got Mapbox token from ${data.source || 'api'}`);
            
            // Cache the token
            localStorage.setItem('mapbox_token', data.token);
            localStorage.setItem('mapbox_token_timestamp', Date.now().toString());
            
            setTokenSource(data.source || 'api');
            return data.token;
          } else if (data.error) {
            throw new Error(data.error);
          } else {
            throw new Error('No token received from server');
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            // Request was aborted, which is expected in some cases
            return null;
          }
          
          // Fallback to hardcoded token in case of error
          const fallbackToken = 'pk.eyJ1IjoibG92YWJsZWFpIiwiYSI6ImNscDJsb2N0dDFmcHcya3BnYnZpNm9mbnEifQ.tHhXbyzm-GhoiZpFOSxG8A';
          console.warn('Using fallback token due to error:', error);
          localStorage.setItem('mapbox_token', fallbackToken);
          localStorage.setItem('mapbox_token_timestamp', Date.now().toString());
          
          setTokenSource('client-fallback');
          setTokenError(error instanceof Error ? error.message : 'Unknown error fetching token');
          return fallbackToken;
        } finally {
          setIsLoading(false);
          // Clear the promise reference to allow future fetches
          tokenFetchPromiseRef.current = null;
        }
      })();
      
      return await tokenFetchPromiseRef.current;
    } catch (error) {
      console.error('Error in fetchMapboxToken:', error);
      setTokenError(error instanceof Error ? error.message : 'Unknown error');
      setIsLoading(false);
      return null;
    }
  }, [retryCount, fetchWithRetries]); // Include retryCount to trigger a new fetch when retried

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
      const token = await fetchMapboxToken();
      
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
  }, [mapContainerRef, theme, fetchMapboxToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Abort any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    isLoading,
    initializeMap,
    retryFetchToken,
    tokenError,
    tokenSource
  };
};
