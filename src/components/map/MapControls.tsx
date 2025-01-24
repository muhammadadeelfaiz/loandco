import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapControlsProps {
  map: mapboxgl.Map;
}

const MapControls = ({ map }: MapControlsProps) => {
  useEffect(() => {
    const navigationControl = new mapboxgl.NavigationControl();
    map.addControl(navigationControl, 'top-right');
    
    return () => {
      map.removeControl(navigationControl);
    };
  }, [map]);

  return null;
};

export default MapControls;