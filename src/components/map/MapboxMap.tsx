
import { useEffect, useRef, useState, useCallback, memo, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
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

// Updated Mapbox public token - this is Mapbox's default public demo token
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

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
  }, [initComplete]);

  // Initialize map
  const initializeMap = useCallback(async (center: { lat: number; lng: number }) => {
    if (!mapContainer.current || mapInitializedRef.current) return null;
    
    try {
      // Always use the working Mapbox token
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      console.log('Initializing map with center:', center);
      
      // Create the map
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
        center: [center.lng, center.lat],
        zoom: 12,
        attributionControl: false
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
  }, [mapContainer, theme, readonly, onLocationChange, handleError]);

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
            const errorMsg = e.error.message || 'Unknown map error';
            console.error('Mapbox error:', errorMsg);
            
            if (errorMsg.includes('access token')) {
              handleError(
                'Map access token issue', 
                'There is a problem with the Mapbox access token. Please try refreshing the page.'
              );
            } else {
              handleError('Map loading error', errorMsg);
            }
          });
        } else {
          handleError('Failed to initialize map', 'Could not create map instance');
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
