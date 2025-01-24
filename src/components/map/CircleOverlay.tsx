import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface CircleOverlayProps {
  map: mapboxgl.Map;
  center: [number, number];
  radiusInKm: number;
}

const CircleOverlay = ({ map, center, radiusInKm }: CircleOverlayProps) => {
  const sourceRef = useRef<mapboxgl.GeoJSONSource | null>(null);

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
    const circleData = createGeoJSONCircle(center, radiusInKm);

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

      sourceRef.current = map.getSource('radius') as mapboxgl.GeoJSONSource;
    } else if (sourceRef.current) {
      sourceRef.current.setData(circleData);
    }

    return () => {
      if (map.getSource('radius')) {
        map.removeLayer('radius');
        map.removeSource('radius');
      }
    };
  }, [map, center, radiusInKm]);

  return null;
};

export default CircleOverlay;