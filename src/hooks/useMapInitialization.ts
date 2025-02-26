
import { useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export const useMapInitialization = (mapContainer: React.RefObject<HTMLDivElement>, theme: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const initializeMap = async (
    location: { lat: number; lng: number },
    onLocationChange?: (location: { lat: number; lng: number }) => void,
    readonly = false
  ) => {
    if (!mapContainer.current) return null;

    try {
      const { data, error } = await supabase.functions.invoke('map-service', {
        method: 'GET'
      });

      if (error || !data?.token) {
        console.error('Failed to fetch Mapbox token:', error);
        toast({
          variant: "destructive",
          title: "Map Error",
          description: "Failed to initialize map. Please try again."
        });
        setIsLoading(false);
        return null;
      }

      mapboxgl.accessToken = data.token;

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: theme === 'dark' 
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11',
        center: [location.lng, location.lat],
        zoom: 13,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      if (!readonly) {
        const marker = new mapboxgl.Marker();
        
        map.on('click', (e) => {
          const newLocation = {
            lat: e.lngLat.lat,
            lng: e.lngLat.lng
          };
          
          marker.setLngLat([newLocation.lng, newLocation.lat]).addTo(map);
          onLocationChange?.(newLocation);
        });

        // Add initial marker if location is provided
        if (location) {
          marker.setLngLat([location.lng, location.lat]).addTo(map);
        }
      }

      map.on('load', () => {
        setIsLoading(false);
      });

      map.on('error', (e) => {
        console.error('Map error:', e);
        toast({
          variant: "destructive",
          title: "Map Error",
          description: "There was an error loading the map. Please try again."
        });
      });

      return map;

    } catch (error) {
      console.error('Map initialization error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initialize map. Please try again."
      });
      setIsLoading(false);
      return null;
    }
  };

  return { isLoading, initializeMap };
};
