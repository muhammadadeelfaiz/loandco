
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface MapboxMapProps {
  location?: { lat: number; lng: number } | null;
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
  accessToken: string;
}

const MapboxMap = ({
  location,
  onLocationChange,
  readonly = false,
  searchRadius = 5,
  markers = [],
  accessToken
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { theme } = useTheme();

  // Default center (Dubai)
  const defaultCenter = { lat: 25.2048, lng: 55.2708 };
  const initialLocation = location || defaultCenter;

  useEffect(() => {
    if (!mapContainer.current || !accessToken) return;

    mapboxgl.accessToken = accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      center: [initialLocation.lng, initialLocation.lat],
      zoom: 13
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    if (!readonly) {
      marker.current = new mapboxgl.Marker({
        draggable: !readonly
      })
        .setLngLat([initialLocation.lng, initialLocation.lat])
        .addTo(map.current);

      if (marker.current && onLocationChange) {
        marker.current.on('dragend', () => {
          const lngLat = marker.current!.getLngLat();
          onLocationChange({ lat: lngLat.lat, lng: lngLat.lng });
        });
      }

      map.current.on('click', (e) => {
        if (marker.current && onLocationChange) {
          marker.current.setLngLat(e.lngLat);
          onLocationChange({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        }
      });
    }

    return () => {
      map.current?.remove();
    };
  }, [accessToken]);

  useEffect(() => {
    if (map.current) {
      map.current.setStyle(
        theme === 'dark'
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11'
      );
    }
  }, [theme]);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default MapboxMap;
