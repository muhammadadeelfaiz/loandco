import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapContext } from './MapContext';

const MapControls = () => {
  const { mapRef } = useMapContext();
  const controlRef = useRef<mapboxgl.NavigationControl | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || controlRef.current) return;

    controlRef.current = new mapboxgl.NavigationControl();
    map.addControl(controlRef.current, 'top-right');

    return () => {
      if (controlRef.current && map) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
  }, [mapRef]);

  return null;
};

export default MapControls;