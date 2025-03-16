
import { useEffect, useRef, useState, useCallback, memo, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2, AlertTriangle, RefreshCw, Globe } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { useSearchRadius } from '@/hooks/useSearchRadius';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface MapboxMapProps {
  location?: { lat: number; lng: number } | null;
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  readonly?: boolean;
  searchRadius?: number;
  onError?: (message: string) => void;
  onMarkerClick?: (markerId: string) => void;
  initComplete?: MutableRefObject<boolean>;
  fallbackToken?: string;
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

// Default fallback token if none provided
const DEFAULT_FALLBACK_TOKEN = 'pk.eyJ1IjoibG92YWJsZWFpIiwiYSI6ImNscDJsb2N0dDFmcHcya3BnYnZpNm9mbnEifQ.tHhXbyzm-GhoiZpFOSxG8A';

const MapboxMap = memo(({
  location,
  onLocationChange,
  readonly = false,
  searchRadius = 5,
  markers = [],
  onError,
  onMarkerClick,
  initComplete,
  fallbackToken
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersUpdatedRef = useRef<boolean>(false);
  const mapInitializedRef = useRef<boolean>(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { theme } = useTheme();
  
  const { updateMarkers } = useMapMarkers(onMarkerClick);
  const searchRadiusInstance = useSearchRadius();

  const defaultCenter = { lat: 25.2048, lng: 55.2708 }; // Dubai as default

  // Log marker data for debugging
  useEffect(() => {
    console.log('Markers data in MapboxMap:', markers?.length, markers);
  }, [markers]);

  const handleError = useCallback((errorMessage: string, details?: string) => {
    if (error) return; // Prevent duplicate error handling
    
    console.error('Map error:', errorMessage, details ? `Details: ${details}` : '');
    setError(errorMessage);
    setErrorDetails(details || null);
    if (onError) {
      onError(errorMessage);
    }
  }, [onError, error]);

  const handleRetry = useCallback(() => {
    setError(null);
    setErrorDetails(null);
    setIsMapInitialized(false);
    mapInitializedRef.current = false;
    markersUpdatedRef.current = false;
    if (initComplete) initComplete.current = false;
    setRetryCount(prev => prev + 1);
    
    // Clean up existing map if any
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    
    // Clear token cache
    localStorage.removeItem('mapbox_token');
    localStorage.removeItem('mapbox_token_timestamp');
  }, [initComplete]);

  // Get or load mapbox token
  const getMapboxToken = useCallback(async (): Promise<string> => {
    // Check for a cached token in localStorage
    const cachedToken = localStorage.getItem('mapbox_token');
    const cachedTimestamp = localStorage.getItem('mapbox_token_timestamp');
    
    if (cachedToken && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp, 10);
      const currentTime = Date.now();
      
      // Use cached token if it's less than 24 hours old
      if (currentTime - timestamp < 24 * 60 * 60 * 1000) {
        console.log('Using cached Mapbox token');
        return cachedToken;
      }
    }
    
    // Use the provided fallback token or the default one
    const token = fallbackToken || DEFAULT_FALLBACK_TOKEN;
    
    // Cache the token
    localStorage.setItem('mapbox_token', token);
    localStorage.setItem('mapbox_token_timestamp', Date.now().toString());
    
    return token;
  }, [fallbackToken]);

  // Initialize map
  const initializeMap = useCallback(async (center: { lat: number; lng: number }) => {
    if (!mapContainer.current || mapInitializedRef.current) return null;
    
    try {
      const token = await getMapboxToken();
      mapboxgl.accessToken = token;
      
      // Create the map
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
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
      
      return newMap;
    } catch (err) {
      console.error('Error initializing map:', err);
      handleError(
        'Failed to initialize map', 
        err instanceof Error ? err.message : 'Unknown error'
      );
      return null;
    }
  }, [mapContainer, theme, readonly, onLocationChange, getMapboxToken, handleError]);

  // Initialize map once
  useEffect(() => {
    // Skip initialization if already done in this render cycle
    if (!mapContainer.current || mapInitializedRef.current) return;
    
    // Skip if we're already showing an error
    if (error) return;
    
    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setErrorDetails(null);
        const initialCenter = location || defaultCenter;
        
        const newMap = await initializeMap(initialCenter);
        
        if (newMap) {
          map.current = newMap;
          
          // Add error handling for map load
          newMap.on('load', () => {
            console.log('Map loaded successfully');
            setIsMapInitialized(true);
            setIsLoading(false);
            mapInitializedRef.current = true;
            if (initComplete) initComplete.current = true;
            
            // After map is loaded, add markers and search radius
            if (location) {
              searchRadiusInstance.updateSearchRadius(newMap, location, searchRadius);
            }
            
            // Add markers immediately after map load
            if (markers && markers.length > 0) {
              console.log('Adding markers after map load:', markers.length);
              updateMarkers(newMap, markers);
              markersUpdatedRef.current = true;
            }
          });

          // Add specific error handling for authentication errors
          newMap.on('error', (e: mapboxgl.ErrorEvent) => {
            const mapError = e.error as MapboxError;
            
            if (e.error.message?.includes('access token')) {
              handleError(
                'Map access token issue', 
                'There is a problem with the Mapbox access token. Please try refreshing the page.'
              );
            } else if (mapError?.sourceError?.status === 403) {
              handleError(
                'Map resource access issue', 
                'Unable to access required map resources. This may be a temporary issue.'
              );
            } else if (mapError?.sourceError?.status === 401) {
              handleError(
                'Map authentication failed', 
                'Please try refreshing the page.'
              );
            } else if (mapError?.sourceError?.status === 404) {
              handleError(
                'Map resources not found', 
                'The requested map resources could not be found.'
              );
            } else if (mapError?.sourceError?.status === 429) {
              handleError(
                'Map API rate limit exceeded', 
                'Please try again later.'
              );
            } else {
              handleError(
                'There was an error loading the map', 
                e.error.message || 'Unknown error'
              );
            }
          });
        } else {
          handleError(
            'Failed to initialize map', 
            'Token might be invalid or there are network issues.'
          );
        }
      } catch (err) {
        console.error('Map initialization error:', err);
        handleError(
          'Failed to initialize map', 
          err instanceof Error ? err.message : 'Unknown error'
        );
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      // Only remove the map on unmount, not on every render
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [
    location, 
    readonly, 
    initializeMap, 
    handleError, 
    retryCount, 
    defaultCenter, 
    markers,
    searchRadius,
    updateMarkers,
    searchRadiusInstance,
    error,
    initComplete
  ]);

  // Update markers when they change
  useEffect(() => {
    if (map.current && isMapInitialized && markers && markers.length > 0) {
      console.log('Updating markers after marker prop change:', markers.length);
      updateMarkers(map.current, markers);
      markersUpdatedRef.current = true;
    }
  }, [markers, isMapInitialized, updateMarkers]);

  // Apply theme changes
  useEffect(() => {
    if (!map.current || !isMapInitialized) return;

    try {
      map.current.setStyle(
        theme === 'dark'
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11'
      );
    } catch (err) {
      console.error('Error setting map style:', err);
    }
  }, [theme, isMapInitialized]);

  // Fly to location when it changes
  useEffect(() => {
    if (!map.current || !isMapInitialized || !location) return;
    
    try {
      map.current.flyTo({
        center: [location.lng, location.lat],
        zoom: 13,
        essential: true
      });
    } catch (err) {
      console.error('Error flying to location:', err);
    }
  }, [location, isMapInitialized]);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Alert variant="destructive" className="mb-4 flex-shrink-0 max-w-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>{error}</AlertTitle>
          {errorDetails && <AlertDescription>{errorDetails}</AlertDescription>}
        </Alert>
        
        <Button 
          onClick={handleRetry} 
          variant="outline" 
          className="mt-4 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Loading Map
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700" 
      />
      {isLoading && !isMapInitialized && (
        <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
});

MapboxMap.displayName = 'MapboxMap';

export default MapboxMap;
