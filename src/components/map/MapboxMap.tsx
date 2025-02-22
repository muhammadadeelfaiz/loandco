import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

interface MapboxMapProps {
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

const MapboxMap = ({
  location,
  onLocationChange,
  readonly = false,
  searchRadius = 5,
  markers = []
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { theme } = useTheme();
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Default center coordinates (Dubai)
  const defaultCenter = { lat: 25.2048, lng: 55.2708 };

  useEffect(() => {
    if (!mapContainer.current) return;

    const initializeMap = async () => {
      try {
        console.log('Fetching Mapbox token from Supabase...');
        const { data: secrets, error: secretsError } = await supabase.rpc(
          'get_secrets',
          { secret_names: ['MAPBOX_PUBLIC_TOKEN'] }
        );

        console.log('Supabase response:', { secrets, error: secretsError });

        if (secretsError) {
          console.error('Supabase error:', secretsError);
          throw new Error(`Failed to fetch Mapbox token: ${secretsError.message}`);
        }

        if (!secrets || !secrets.MAPBOX_PUBLIC_TOKEN) {
          console.error('No Mapbox token found in secrets:', secrets);
          throw new Error('Mapbox token not found in secrets');
        }

        console.log('Successfully retrieved Mapbox token');
        mapboxgl.accessToken = secrets.MAPBOX_PUBLIC_TOKEN;

        const initialCenter = location || defaultCenter;
        
        console.log('Initializing Mapbox map...');
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: theme === 'dark' 
            ? 'mapbox://styles/mapbox/dark-v11'
            : 'mapbox://styles/mapbox/light-v11',
          center: [initialCenter.lng, initialCenter.lat],
          zoom: 13
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        if (!readonly) {
          map.current.on('click', (e) => {
            onLocationChange?.({
              lat: e.lngLat.lat,
              lng: e.lngLat.lng
            });
          });
        }

        map.current.on('load', () => {
          console.log('Map loaded successfully');
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Detailed map initialization error:', {
          error,
          stack: error instanceof Error ? error.stack : undefined
        });
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Error initializing map",
          description: error instanceof Error ? error.message : "An unexpected error occurred"
        });
      }
    };

    initializeMap();

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    map.current.setStyle(
      theme === 'dark'
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11'
    );
  }, [theme]);

  useEffect(() => {
    if (!map.current || !location) return;

    // Clear existing circle layer and source
    if (map.current.getLayer('search-radius')) {
      map.current.removeLayer('search-radius');
    }
    if (map.current.getSource('search-radius')) {
      map.current.removeSource('search-radius');
    }

    // Add circle for search radius
    if (map.current.loaded()) {
      map.current.addSource('search-radius', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          }
        }
      });

      map.current.addLayer({
        id: 'search-radius',
        type: 'circle',
        source: 'search-radius',
        paint: {
          'circle-radius': {
            stops: [
              [0, 0],
              [20, searchRadius * 1000]
            ],
            base: 2
          },
          'circle-color': 'rgba(59, 130, 246, 0.1)',
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(59, 130, 246, 0.8)'
        }
      });

      map.current.flyTo({
        center: [location.lng, location.lat],
        essential: true
      });
    }
  }, [location, searchRadius]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(marker => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<h3 class="font-bold">${marker.title}</h3>
         ${marker.description ? `<p>${marker.description}</p>` : ''}`
      );

      const mapMarker = new mapboxgl.Marker()
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(mapMarker);
    });
  }, [markers]);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div 
        ref={mapContainer} 
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

export default MapboxMap;
