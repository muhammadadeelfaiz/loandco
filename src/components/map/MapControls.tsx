import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapContext } from './MapContext';

const MapControls = () => {
  const { map } = useMapContext();
  const controlRef = useRef<mapboxgl.NavigationControl | null>(null);

  useEffect(() => {
    if (!map || controlRef.current) return;

    controlRef.current = new mapboxgl.NavigationControl();
    map.addControl(controlRef.current, 'top-right');

    return () => {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
  }, [map]);

  return null;
};

export default MapControls;