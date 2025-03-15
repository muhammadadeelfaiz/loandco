
import { useEffect, useRef, useState, useCallback, memo, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2, AlertTriangle, RefreshCw, Globe } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useMapInitialization } from '@/hooks/useMapInitialization';
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

const MapboxMap = memo(({
  location,
  onLocationChange,
  readonly = false,
  searchRadius = 5,
  markers = [],
  onError,
  onMarkerClick,
  initComplete
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersUpdatedRef = useRef<boolean>(false);
  const mapInitializedRef = useRef<boolean>(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { theme } = useTheme();
  const { isLoading, initializeMap, retryFetchToken, tokenError, tokenSource } = useMapInitialization(mapContainer, theme);
  
  const { updateMarkers } = useMapMarkers(onMarkerClick);
  const searchRadiusInstance = useSearchRadius();

  const defaultCenter = { lat: 25.2048, lng: 55.2708 }; // Dubai as default

  // Log marker data for debugging
  useEffect(() => {
    console.log('Markers data:', markers);
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
    
    // Retry token fetch
    retryFetchToken();
  }, [retryFetchToken, initComplete]);

  // Initialize map once
  useEffect(() => {
    // Skip initialization if already done in this render cycle
    if (!mapContainer.current || mapInitializedRef.current) return;
    
    // Skip if we're already showing an error
    if (error || tokenError) {
      if (tokenError) {
        handleError(
          "Map token could not be retrieved", 
          "Please check your connection and try again."
        );
      }
      return;
    }
    
    const initialize = async () => {
      try {
        setError(null);
        setErrorDetails(null);
        const initialCenter = location || defaultCenter;
        
        const newMap = await initializeMap(initialCenter, onLocationChange, readonly);
        
        if (newMap) {
          map.current = newMap;
          
          // Add error handling for map load
          newMap.on('load', () => {
            console.log('Map loaded successfully');
            setIsMapInitialized(true);
            mapInitializedRef.current = true;
            if (initComplete) initComplete.current = true;
            
            // After map is loaded, add markers and search radius
            if (location) {
              searchRadiusInstance.updateSearchRadius(newMap, location, searchRadius);
            }
            
            if (markers.length > 0) {
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
    onLocationChange, 
    readonly, 
    initializeMap, 
    handleError, 
    tokenError, 
    retryCount, 
    defaultCenter, 
    markers,
    searchRadius,
    updateMarkers,
    searchRadiusInstance
  ]);

  // Update markers when they change
  useEffect(() => {
    if (map.current && isMapInitialized && markers.length > 0) {
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
        
        {tokenSource && (
          <p className="text-xs text-gray-500 mt-4">
            Token source: {tokenSource}
          </p>
        )}
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
