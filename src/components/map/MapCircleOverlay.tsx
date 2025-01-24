import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { createGeoJSONCircle } from '@/utils/mapUtils';

interface MapCircleOverlayProps {
  map: mapboxgl.Map;
  center: [number, number];
  radiusInKm: number;
}

const MapCircleOverlay = ({ map, center, radiusInKm }: MapCircleOverlayProps) => {
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
    } else {
      const source = map.getSource('radius') as mapboxgl.GeoJSONSource;
      source.setData(circleData);
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

export default MapCircleOverlay;