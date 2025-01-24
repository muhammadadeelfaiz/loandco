import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MapProps {
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

const Map = ({ 
  location, 
  onLocationChange, 
  readonly = false,
  searchRadius = 5,
  markers = []
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Create GeoJSON circle utility function
  const createGeoJSONCircle = (center: [number, number], radiusInKm: number) => {
    const points = 64;
    const coords: number[][] = [];
    const distanceX = radiusInKm / (111.320 * Math.cos((center[1] * Math.PI) / 180));
    const distanceY = radiusInKm / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      coords.push([center[0] + x, center[1] + y]);
    }
    coords.push(coords[0]);

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coords]
      },
      properties: {}
    };
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      mapboxgl.accessToken = process.env.MAPBOX_PUBLIC_TOKEN || 'pk.eyJ1IjoibGFzdG1hbjFvMW8xIiwiYSI6ImNtNjhhY3JrZjBkYnIycnM4czBxdHJ0ODYifQ._X04qSsIXJCSzmvgFmyFQw';
      
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: location ? [location.lng, location.lat] : [0, 0],
        zoom: 13
      });

      map.on('load', () => {
        setIsLoading(false);
        
        if (location) {
          const circleData = createGeoJSONCircle([location.lng, location.lat], searchRadius);
          
          if (!map.getSource('radius')) {
            map.addSource('radius', {
              type: 'geojson',
              data: circleData
            });
            
            map.addLayer({
              id: 'radius',
              type: 'fill',
              source: 'radius',
              paint: {
                'fill-color': '#3B82F6',
                'fill-opacity': 0.1,
                'fill-outline-color': '#3B82F6'
              }
            });
          } else {
            const source = map.getSource('radius') as mapboxgl.GeoJSONSource;
            source.setData(circleData);
          }
        }
      });

      // Add navigation controls
      const navigationControl = new mapboxgl.NavigationControl();
      map.addControl(navigationControl, 'top-right');

      if (!readonly) {
        map.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          
          if (userMarker.current) {
            userMarker.current.setLngLat([lng, lat]);
          } else {
            userMarker.current = new mapboxgl.Marker({ color: '#3B82F6' })
              .setLngLat([lng, lat])
              .addTo(map);
          }

          const source = map.getSource('radius') as mapboxgl.GeoJSONSource;
          if (source) {
            source.setData(createGeoJSONCircle([lng, lat], searchRadius));
          }

          onLocationChange?.({ lng, lat });
        });
      }

      mapInstance.current = map;

      // Cleanup function
      return () => {
        if (userMarker.current) {
          userMarker.current.remove();
        }
        Object.values(markersRef.current).forEach(marker => marker.remove());
        map.remove();
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
  }, [location?.lat, location?.lng, onLocationChange, readonly, searchRadius, toast]);

  // Handle markers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Remove old markers
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!markers.find(m => m.id === id)) {
        marker.remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    markers.forEach(marker => {
      if (markersRef.current[marker.id]) {
        markersRef.current[marker.id].setLngLat([marker.lng, marker.lat]);
      } else {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <h3 class="font-semibold">${marker.title}</h3>
            ${marker.description ? `<p>${marker.description}</p>` : ''}
          `);

        const el = document.createElement('div');
        el.className = 'marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.backgroundImage = 'url(https://img.icons8.com/material-outlined/24/000000/marker.png)';

        markersRef.current[marker.id] = new mapboxgl.Marker(el)
          .setLngLat([marker.lng, marker.lat])
          .setPopup(popup)
          .addTo(map);
      }
    });

    return () => {
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
    };
  }, [markers]);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
      <style>{`
        .marker {
          background-size: cover;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Map;