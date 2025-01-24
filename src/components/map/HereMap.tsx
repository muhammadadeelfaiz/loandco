import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';

declare global {
  interface Window {
    H: any;
  }
}

interface HereMapProps {
  location?: { lat: number; lng: number };
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  readonly?: boolean;
  searchRadius?: number;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    description?: string;
  }>;
}

const HereMap = ({ 
  location, 
  onLocationChange, 
  readonly = false,
  searchRadius = 5,
  markers = []
}: HereMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [platform, setPlatform] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { theme } = useTheme();
  const markersGroup = useRef<any>(null);
  const circle = useRef<any>(null);

  // Default center coordinates (Dubai)
  const defaultCenter = { lat: 25.2048, lng: 55.2708 };

  useEffect(() => {
    if (!mapRef.current) return;

    try {
      const H = window.H;
      const platform = new H.service.Platform({
        apikey: process.env.HERE_MAPS_API_KEY || ''
      });

      setPlatform(platform);

      const defaultLayers = platform.createDefaultLayers();
      const initialCenter = location || defaultCenter;

      const map = new H.Map(
        mapRef.current,
        defaultLayers.vector.normal[theme === 'dark' ? 'dark' : 'map'],
        {
          center: { lat: initialCenter.lat, lng: initialCenter.lng },
          zoom: 13,
          pixelRatio: window.devicePixelRatio || 1
        }
      );

      // Add map controls
      const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
      const ui = H.ui.UI.createDefault(map, defaultLayers);

      // Create a marker group
      markersGroup.current = new H.map.Group();
      map.addObject(markersGroup.current);

      if (!readonly) {
        map.addEventListener('tap', (evt: any) => {
          const coord = map.screenToGeo(
            evt.currentPointer.viewportX,
            evt.currentPointer.viewportY
          );
          
          onLocationChange?.({ lat: coord.lat, lng: coord.lng });
        });
      }

      setMap(map);
      setIsLoading(false);

      return () => {
        if (map) {
          map.dispose();
        }
      };
    } catch (error) {
      console.error('Map initialization error:', error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error initializing map",
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    }
  }, []);

  // Update map style when theme changes
  useEffect(() => {
    if (!map || !platform) return;

    const defaultLayers = platform.createDefaultLayers();
    map.setBaseLayer(defaultLayers.vector.normal[theme === 'dark' ? 'dark' : 'map']);
  }, [theme, map, platform]);

  // Handle location changes
  useEffect(() => {
    if (!map || !location) return;

    // Clear existing circle
    if (circle.current) {
      map.removeObject(circle.current);
    }

    // Add marker for selected location
    markersGroup.current.removeAll();
    
    const locationMarker = new window.H.map.Marker(
      { lat: location.lat, lng: location.lng },
      { volatility: true }
    );
    markersGroup.current.addObject(locationMarker);

    // Draw circle for search radius
    const circleStyle = {
      strokeColor: 'rgba(59, 130, 246, 0.8)',
      fillColor: 'rgba(59, 130, 246, 0.1)',
      lineWidth: 2
    };

    circle.current = new window.H.map.Circle(
      { lat: location.lat, lng: location.lng },
      searchRadius * 1000,
      { style: circleStyle }
    );
    
    map.addObject(circle.current);
    map.setCenter({ lat: location.lat, lng: location.lng });
  }, [location, searchRadius, map]);

  // Handle markers
  useEffect(() => {
    if (!map || !markersGroup.current) return;

    markersGroup.current.removeAll();

    // Add location marker if exists
    if (location) {
      const locationMarker = new window.H.map.Marker(
        { lat: location.lat, lng: location.lng },
        { volatility: true }
      );
      markersGroup.current.addObject(locationMarker);
    }

    // Add other markers
    markers.forEach(marker => {
      const markerElement = new window.H.map.Marker(
        { lat: marker.lat, lng: marker.lng },
        {
          data: {
            title: marker.title,
            description: marker.description
          }
        }
      );

      markersGroup.current.addObject(markerElement);
    });
  }, [markers, location, map]);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div 
        ref={mapRef} 
        className="absolute inset-0 w-full h-full" 
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
    </div>
  );
};

export default HereMap;