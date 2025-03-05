
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

// Guaranteed working public token
const MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZWFpIiwiYSI6ImNscDJsb2N0dDFmcHcya3BnYnZpNm9mbnEifQ.tHhXbyzm-GhoiZpFOSxG8A';

interface FallbackMapProps {
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

const FallbackMap = ({
  location,
  onLocationChange,
  readonly = false,
  markers = [],
  onError
}: FallbackMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<{ [id: string]: mapboxgl.Marker }>({});
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  const defaultCenter = { lat: 25.2048, lng: 55.2708 }; // Dubai as default

  useEffect(() => {
    // Clean up function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    try {
      // Set the access token
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      const initialCenter = location || defaultCenter;
      console.log('Initializing map with location:', initialCenter);
      
      // Create a new map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: theme === 'dark' 
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11',
        center: [initialCenter.lng, initialCenter.lat],
        zoom: 12,
        attributionControl: false,
      });
      
      // Add attribution in the bottom-right
      map.current.addControl(new mapboxgl.AttributionControl(), 'bottom-right');

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Set up location marker if provided
      if (location) {
        userMarker.current = new mapboxgl.Marker({ color: '#3886ce', draggable: !readonly })
          .setLngLat([location.lng, location.lat])
          .addTo(map.current);
          
        if (!readonly && userMarker.current) {
          userMarker.current.on('dragend', () => {
            const lngLat = userMarker.current!.getLngLat();
            onLocationChange?.({ lat: lngLat.lat, lng: lngLat.lng });
          });
        }
      }
      
      // Handle map click for location selection
      if (!readonly) {
        map.current.on('click', (e) => {
          const newLocation = {
            lat: e.lngLat.lat,
            lng: e.lngLat.lng
          };
          
          if (userMarker.current) {
            userMarker.current.setLngLat([newLocation.lng, newLocation.lat]);
          } else {
            userMarker.current = new mapboxgl.Marker({ color: '#3886ce', draggable: !readonly })
              .setLngLat([newLocation.lng, newLocation.lat])
              .addTo(map.current!);
              
            userMarker.current.on('dragend', () => {
              const lngLat = userMarker.current!.getLngLat();
              onLocationChange?.({ lat: lngLat.lat, lng: lngLat.lng });
            });
          }
          
          onLocationChange?.(newLocation);
        });
      }
      
      // Event handlers
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setIsLoading(false);
      });
      
      map.current.on('error', (e) => {
        console.error('Map error:', e);
        if (onError) {
          onError('There was an error loading the map. Please check your internet connection.');
        }
      });
      
    } catch (err) {
      console.error('Error initializing map:', err);
      if (onError) {
        onError('Failed to initialize map. Please try refreshing the page.');
      }
    }
  }, [location, onLocationChange, readonly, theme]);
  
  // Add markers whenever they change
  useEffect(() => {
    if (!map.current || !markers.length) return;
    
    try {
      // First clear existing markers
      Object.values(markerRefs.current).forEach(marker => marker.remove());
      markerRefs.current = {};
      
      // Add all markers
      markers.forEach(marker => {
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<strong>${marker.title}</strong>${marker.description ? `<p>${marker.description}</p>` : ''}`
        );
        
        const markerElement = new mapboxgl.Marker({ color: '#FF0000' })
          .setLngLat([marker.lng, marker.lat])
          .setPopup(popup)
          .addTo(map.current!);
          
        markerRefs.current[marker.id] = markerElement;
      });
    } catch (err) {
      console.error('Error adding markers:', err);
    }
  }, [markers]);

  // Update map style when theme changes
  useEffect(() => {
    if (!map.current) return;
    
    try {
      map.current.setStyle(
        theme === 'dark'
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11'
      );
    } catch (error) {
      console.error('Error setting map style:', error);
    }
  }, [theme]);

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
    </div>
  );
};

export default FallbackMap;
