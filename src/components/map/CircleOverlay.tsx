import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapContext } from './MapContext';
import { createGeoJSONCircle } from '@/utils/mapUtils';

interface CircleOverlayProps {
  center: [number, number];
  radiusInKm: number;
}

const CircleOverlay = ({ center, radiusInKm }: CircleOverlayProps) => {
  const { map } = useMapContext();
  const sourceRef = useRef<mapboxgl.GeoJSONSource | null>(null);

  useEffect(() => {
    if (!map) return;

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