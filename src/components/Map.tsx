import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const radiusSourceRef = useRef<mapboxgl.GeoJSONSource | null>(null);

  const createGeoJSONCircle = (center: [number, number], radiusInKm: number) => {
    const points = 64;
    const coords: number[][] = [];
    const km = radiusInKm;
    const distanceX = km / (111.320 * Math.cos((center[1] * Math.PI) / 180));
    const distanceY = km / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      coords.push([
        center[0] + x,
        center[1] + y
      ]);
    }
    coords.push(coords[0]); // Close the polygon

    return {
      type: "Feature" as const,
      geometry: {
        type: "Polygon" as const,
        coordinates: [coords]
      },
      properties: {}
    };
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoibGFzdG1hbjFvMW8xIiwiYSI6ImNtNjhhY3JrZjBkYnIycnM4czBxdHJ0ODYifQ._X04qSsIXJCSzmvgFmyFQw';
    
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: location ? [location.lng, location.lat] : [0, 0],
      zoom: 13
    });

    map.current = mapInstance;

    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

    if (location) {
      mapInstance.on('load', () => {
        const circleData = createGeoJSONCircle([location.lng, location.lat], searchRadius);
        
        if (!mapInstance.getSource('radius')) {
          mapInstance.addSource('radius', {
            type: 'geojson',
            data: circleData
          });
          
          mapInstance.addLayer({
            id: 'radius',
            type: 'fill',
            source: 'radius',
            paint: {
              'fill-color': '#3B82F6',
              'fill-opacity': 0.1,
              'fill-outline-color': '#3B82F6'
            }
          });
          
          radiusSourceRef.current = mapInstance.getSource('radius') as mapboxgl.GeoJSONSource;
        } else if (radiusSourceRef.current) {
          radiusSourceRef.current.setData(circleData);
        }
      });
    }

    if (!readonly) {
      mapInstance.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        
        if (userMarker.current) {
          userMarker.current.setLngLat([lng, lat]);
        } else {
          userMarker.current = new mapboxgl.Marker({ color: '#3B82F6' })
            .setLngLat([lng, lat])
            .addTo(mapInstance);
        }

        if (radiusSourceRef.current) {
          radiusSourceRef.current.setData(createGeoJSONCircle([lng, lat], searchRadius));
        }

        onLocationChange?.({ lng, lat });
      });
    }

    return () => {
      Object.values(markersRef.current).forEach(marker => marker.remove());
      if (userMarker.current) {
        userMarker.current.remove();
      }
      mapInstance.remove();
    };
  }, [location, onLocationChange, readonly, searchRadius]);

  useEffect(() => {
    if (!map.current) return;

    // Clean up removed markers
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!markers.find(m => m.id === id)) {
        marker.remove();
        delete markersRef.current[id];
      }
    });

    // Update or add markers
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
          .addTo(map.current);
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