import { createContext, useContext, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapContextType {
  mapRef: MutableRefObject<mapboxgl.Map | null>;
}

export const MapContext = createContext<MapContextType | null>(null);

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};