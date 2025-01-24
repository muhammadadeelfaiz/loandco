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
  const sourceRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map) return;

    const sourceId = 'radius-source';
    const layerId = 'radius-layer';
    sourceRef.current = sourceId;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: createGeoJSONCircle(center, radiusInKm)
      });

      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#3B82F6',
          'fill-opacity': 0.1,
          'fill-outline-color': '#3B82F6'
        }
      });
    } else {
      const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
      source.setData(createGeoJSONCircle(center, radiusInKm));
    }

    return () => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [map, center, radiusInKm]);

  return null;
};

export default CircleOverlay;