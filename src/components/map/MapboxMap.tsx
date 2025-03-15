
import { useEffect, useRef, useState } from 'react';
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
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { theme } = useTheme();
  const { isLoading, initializeMap, retryFetchToken, tokenError, tokenSource } = useMapInitialization(mapContainer, theme);
  
  const markersInstance = useMapMarkers();
  const searchRadiusInstance = useSearchRadius();

  const defaultCenter = { lat: 25.2048, lng: 55.2708 }; // Dubai as default

  const handleError = (errorMessage: string, details?: string) => {
    console.error('Map error:', errorMessage, details ? `Details: ${details}` : '');
    setError(errorMessage);
    setErrorDetails(details || null);
    if (onError) {
      onError(errorMessage);
    }
  };

  const handleRetry = () => {
    console.log('Retrying map initialization...');
    setError(null);
    setErrorDetails(null);
    setIsMapInitialized(false);
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
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Clear any existing error when we try to initialize
    if (tokenError) {
      if (tokenError.includes('domain restrictions')) {
        handleError(
          "Map access restricted", 
          "The Mapbox token has domain restrictions. Please ensure your Mapbox token allows access from this domain."
        );
      } else {
        handleError("Map token could not be retrieved", "Please check your connection and try again.");
      }
      return;
    }
    
    const initialize = async () => {
      try {
        setError(null);
        setErrorDetails(null);
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
              handleError(
                'Map access restricted', 
                'The Mapbox token is restricted to specific domains. Please check your Mapbox token configuration.'
              );
            } else if (mapError?.sourceError?.status === 401) {
              handleError(
                'Map authentication failed', 
                'Please check your Mapbox token or try refreshing the page.'
              );
            } else if (mapError?.sourceError?.status === 404) {
              handleError(
                'Map resources not found', 
                'Please check your map style configuration.'
              );
            } else if (mapError?.sourceError?.status === 429) {
              handleError(
                'Map API rate limit exceeded', 
                'Please try again later.'
              );
            } else {
              handleError(
                'There was an error loading the map', 
                'Please check your internet connection.'
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
      if (map.current) {
        map.current.remove();
        map.current = null;
        setIsMapInitialized(false);
      }
    };
  }, [location, onLocationChange, readonly, initializeMap, onError, tokenError, retryCount]);

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

  useEffect(() => {
    if (!map.current || !isMapInitialized) return;
    try {
      markersInstance.updateMarkers(map.current, markers);
    } catch (err) {
      console.error('Error updating markers:', err);
    }
  }, [markers, isMapInitialized, markersInstance]);

  useEffect(() => {
    if (!map.current || !isMapInitialized || !location) return;
    try {
      searchRadiusInstance.updateSearchRadius(map.current, location, searchRadius);
    } catch (err) {
      console.error('Error updating search radius:', err);
    }
  }, [location, searchRadius, isMapInitialized, searchRadiusInstance]);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Alert variant="destructive" className="mb-4 flex-shrink-0 max-w-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>{error}</AlertTitle>
          {errorDetails && <AlertDescription>{errorDetails}</AlertDescription>}
        </Alert>
        
        {error.includes('restricted') && (
          <Alert className="mb-4 flex-shrink-0 max-w-md">
            <Globe className="h-5 w-5" />
            <AlertTitle>Domain Restriction Issue</AlertTitle>
            <AlertDescription>
              Please ensure your Mapbox token allows access from this domain. 
              Check token restrictions in your Mapbox account settings.
            </AlertDescription>
          </Alert>
        )}
        
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
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxMap;
