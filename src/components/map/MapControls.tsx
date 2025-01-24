import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapControlsProps {
  map: mapboxgl.Map;
}

const MapControls = ({ map }: MapControlsProps) => {
  const navigationControlRef = useRef<mapboxgl.NavigationControl | null>(null);

  useEffect(() => {
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