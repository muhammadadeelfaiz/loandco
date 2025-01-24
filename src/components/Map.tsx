import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapProps {
  location?: { lat: number; lng: number };
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  readonly?: boolean;
  searchRadius?: number; // in kilometers
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
  searchRadius = 5, // default 5km radius
  markers = []
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const radiusCircle = useRef<mapboxgl.GeoJSONSource | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  // Create circle geometry for search radius
  const createGeoJSONCircle = (center: [number, number], radiusInKm: number) => {
    const points = 64;
    const coords = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[]]
      },
      properties: {}
    };

    const km = radiusInKm;
    const distanceX = km / (111.320 * Math.cos((center[1] * Math.PI) / 180));
    const distanceY = km / 110.574;

    let theta, x, y;
    for (let i = 0; i < points; i++) {
      theta = (i / points) * (2 * Math.PI);
      x = distanceX * Math.cos(theta);
      y = distanceY * Math.sin(theta);
      (coords.geometry.coordinates[0] as any).push([
        center[0] + x,
        center[1] + y
      ]);
    }
    (coords.geometry.coordinates[0] as any).push(coords.geometry.coordinates[0][0]);

    return coords;
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken = 'pk.eyJ1IjoibGFzdG1hbjFvMW8xIiwiYSI6ImNtNjhhY3JrZjBkYnIycnM4czBxdHJ0ODYifQ._X04qSsIXJCSzmvgFmyFQw';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: location ? [location.lng, location.lat] : [0, 0],
      zoom: 13
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add radius layer
    map.current.on('load', () => {
      if (!map.current || !location) return;

      map.current.addSource('radius', {
        type: 'geojson',
        data: createGeoJSONCircle([location.lng, location.lat], searchRadius)
      });

      map.current.addLayer({
        id: 'radius',
        type: 'fill',
        source: 'radius',
        paint: {
          'fill-color': '#3B82F6',
          'fill-opacity': 0.1,
          'fill-outline-color': '#3B82F6'
        }
      });

      radiusCircle.current = map.current.getSource('radius') as mapboxgl.GeoJSONSource;
    });

    if (!readonly) {
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        if (userMarker.current) {
          userMarker.current.setLngLat([lng, lat]);
        } else {
          userMarker.current = new mapboxgl.Marker({ color: '#3B82F6' })
            .setLngLat([lng, lat])
            .addTo(map.current!);
        }

        // Update radius circle
        if (radiusCircle.current) {
          radiusCircle.current.setData(createGeoJSONCircle([lng, lat], searchRadius));
        }

        onLocationChange?.({ lng, lat });
      });
    }

    return () => {
      map.current?.remove();
    };
  }, [location, onLocationChange, readonly, searchRadius]);

  // Handle markers updates
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers that are not in the new markers array
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!markers.find(m => m.id === id)) {
        marker.remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    markers.forEach(marker => {
      if (markersRef.current[marker.id]) {
        // Update existing marker position
        markersRef.current[marker.id].setLngLat([marker.lng, marker.lat]);
      } else {
        // Create new marker
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
          .addTo(map.current!);
      }
    });
  }, [markers]);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      <style jsx>{`
        .marker {
          background-size: cover;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Map;