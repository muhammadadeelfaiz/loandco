import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapContext } from './MapContext';

const MapControls = () => {
  const { map } = useMapContext();
  const navigationControlRef = useRef<mapboxgl.NavigationControl | null>(null);

  useEffect(() => {
    if (!map) return;

    navigationControlRef.current = new mapboxgl.NavigationControl();
    map.addControl(navigationControlRef.current, 'top-right');

    return () => {
      if (navigationControlRef.current) {
        map.removeControl(navigationControlRef.current);
      }
    };
  }, [map]);

  return null;
};

export default MapControls;