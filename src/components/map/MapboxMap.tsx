
import React, { useEffect, useRef, useState, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useMapToken } from '@/hooks/useMapToken';

// Hide Mapbox attribution in development
if (import.meta.env.DEV) {
  mapboxgl.setRTLTextPlugin(
    'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
    null,
    true
  );
}

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
  onMarkerClick?: (markerId: string) => void;
  initComplete: MutableRefObject<boolean>;
}

// Using more specific GeoJSON types
interface FeatureGeoJSON {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: Record<string, any>;
}

const MapboxMap: React.FC<MapboxMapProps> = ({
  location,
  onLocationChange,
  readonly = false,
  searchRadius = 10,
  onError,
  markers = [],
  onMarkerClick,
  initComplete,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const radiusCircle = useRef<mapboxgl.GeoJSONSource | null>(null);
  const markerRefs = useRef<{ [id: string]: mapboxgl.Marker }>({});
  const [isMapReady, setIsMapReady] = useState(false);
  const { theme } = useTheme();
  const { token, isLoading: isTokenLoading, error: tokenError, refreshToken } = useMapToken();

  // Handle token errors
  useEffect(() => {
    if (tokenError && onError) {
      onError(`Failed to load Mapbox token: ${tokenError}`);
    }
  }, [tokenError, onError]);

  // Initialize map when token is available
  useEffect(() => {
    if (!token || !mapContainer.current || map.current) return;

    try {
      console.log('Initializing Mapbox with token');
      mapboxgl.accessToken = token;

      const initialLocation = location || { lat: 25.276987, lng: 55.296249 }; // Dubai as default
      
      const mapOptions: mapboxgl.MapboxOptions = {
        container: mapContainer.current,
        style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12',
        center: [initialLocation.lng, initialLocation.lat],
        zoom: 11,
        attributionControl: false,
      };

      // Create map instance
      map.current = new mapboxgl.Map(mapOptions);

      // Add attribution
      map.current.addControl(new mapboxgl.AttributionControl({
        compact: true
      }));

      // Add navigation controls if not readonly
      if (!readonly) {
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      }
      
      // Wait for map to load
      map.current.on('load', () => {
        if (!map.current) return;
        
        // Add radius circle source
        map.current.addSource('radius-circle', {
          type: 'geojson',
          data: createGeoJSONCircle([initialLocation.lng, initialLocation.lat], searchRadius)
        });
        
        // Store reference to the source
        radiusCircle.current = map.current.getSource('radius-circle') as mapboxgl.GeoJSONSource;
        
        // Add radius circle layer
        map.current.addLayer({
          id: 'radius-circle-fill',
          type: 'fill',
          source: 'radius-circle',
          paint: {
            'fill-color': theme === 'dark' ? '#3b82f6' : '#60a5fa',
            'fill-opacity': 0.1,
          }
        });
        
        map.current.addLayer({
          id: 'radius-circle-border',
          type: 'line',
          source: 'radius-circle',
          paint: {
            'line-color': theme === 'dark' ? '#3b82f6' : '#3b82f6',
            'line-width': 2,
            'line-opacity': 0.6,
          }
        });
        
        // Add user marker if location is provided
        if (location) {
          addOrUpdateUserMarker(location);
        }
        
        // Add other markers
        addMarkers();
        
        setIsMapReady(true);
        initComplete.current = true;
      });
      
      // Add click handler for setting location
      if (!readonly && onLocationChange) {
        map.current.on('click', (e) => {
          const newLocation = {
            lng: e.lngLat.lng,
            lat: e.lngLat.lat
          };
          
          // Update marker and circle
          addOrUpdateUserMarker(newLocation);
          updateRadiusCircle(newLocation);
          
          // Call the callback
          onLocationChange(newLocation);
        });
      }
      
      // Handle load errors
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        if (onError) {
          onError(`Map error: ${e.error.message || 'Unknown error'}`);
        }
      });
      
    } catch (error) {
      console.error('Error initializing map:', error);
      if (onError) {
        onError(`Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [token, location, theme, readonly, searchRadius, onLocationChange, onError]);
  
  // Update markers when the markers prop changes
  useEffect(() => {
    if (isMapReady && map.current) {
      addMarkers();
    }
  }, [markers, isMapReady]);
  
  // Update circle when searchRadius changes
  useEffect(() => {
    if (isMapReady && map.current && location) {
      updateRadiusCircle(location);
    }
  }, [searchRadius, location, isMapReady]);
  
  // Update map style when theme changes
  useEffect(() => {
    if (map.current && isMapReady) {
      map.current.setStyle(theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12');
    }
  }, [theme, isMapReady]);
  
  // Helper function to add or update user marker
  const addOrUpdateUserMarker = (location: { lat: number; lng: number }) => {
    if (!map.current) return;
    
    const el = document.createElement('div');
    el.className = 'flex items-center justify-center';
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#3b82f6';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1)';
    
    if (userMarker.current) {
      userMarker.current.setLngLat([location.lng, location.lat]);
    } else {
      userMarker.current = new mapboxgl.Marker({
        element: el,
        draggable: !readonly
      })
      .setLngLat([location.lng, location.lat])
      .addTo(map.current);
      
      // Add drag end handler
      if (!readonly && onLocationChange) {
        userMarker.current.on('dragend', () => {
          const lngLat = userMarker.current?.getLngLat();
          if (lngLat) {
            const newLocation = { lng: lngLat.lng, lat: lngLat.lat };
            updateRadiusCircle(newLocation);
            onLocationChange(newLocation);
          }
        });
      }
    }
  };
  
  // Helper function to update radius circle
  const updateRadiusCircle = (center: { lat: number; lng: number }) => {
    if (!radiusCircle.current) return;
    
    radiusCircle.current.setData(
      createGeoJSONCircle([center.lng, center.lat], searchRadius)
    );
  };
  
  // Helper function to add markers
  const addMarkers = () => {
    if (!map.current) return;
    
    // Clear existing markers
    Object.values(markerRefs.current).forEach(marker => marker.remove());
    markerRefs.current = {};
    
    // Add new markers
    markers.forEach(marker => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<strong>${marker.title}</strong>${marker.description ? `<p>${marker.description}</p>` : ''}`
      );
      
      const el = document.createElement('div');
      el.className = 'flex items-center justify-center';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#ef4444';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1)';
      el.style.cursor = 'pointer';
      
      const mapMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(map.current);
      
      if (onMarkerClick) {
        el.addEventListener('click', () => {
          onMarkerClick(marker.id);
        });
      }
      
      markerRefs.current[marker.id] = mapMarker;
    });
  };
  
  // Create GeoJSON circle with proper typing
  const createGeoJSONCircle = (center: [number, number], radiusInKm: number): FeatureGeoJSON => {
    const points = 64;
    const coords = {
      latitude: center[1],
      longitude: center[0]
    };
    
    const km = radiusInKm;
    const ret = [];
    const distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
    const distanceY = km / 110.574;
    
    let theta, x, y;
    for (let i = 0; i < points; i++) {
      theta = (i / points) * (2 * Math.PI);
      x = distanceX * Math.cos(theta);
      y = distanceY * Math.sin(theta);
      
      ret.push([
        coords.longitude + x,
        coords.latitude + y
      ]);
    }
    ret.push(ret[0]); // Close the loop
    
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [ret]
      },
      properties: {}
    };
  };
  
  if (isTokenLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="h-full w-full relative rounded-lg overflow-hidden">
      <div ref={mapContainer} className="h-full w-full" />
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

export default MapboxMap;
