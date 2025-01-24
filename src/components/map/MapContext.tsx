import { createContext, useContext } from 'react';
import mapboxgl from 'mapbox-gl';

interface MapContextType {
  map: mapboxgl.Map | null;
}

export const MapContext = createContext<MapContextType>({ map: null });

export const useMapContext = () => useContext(MapContext);