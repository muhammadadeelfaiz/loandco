import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapControlsProps {
  map: mapboxgl.Map;
}

const MapControls = ({ map }: MapControlsProps) => {
  useEffect(() => {
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    return () => {
      const controls = map.getControls();
      controls.forEach(control => {
        if (control instanceof mapboxgl.NavigationControl) {
          map.removeControl(control);
        }
      });
    };
  }, [map]);

  return null;
};

export default MapControls;