
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
    try {
      console.log('Fetching Mapbox token from edge function...');
      const { data, error } = await supabase.functions.invoke('map-service', {
        method: 'GET'
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Failed to fetch Mapbox token: ${error.message}`);
      }

      if (!data?.token) {
        console.error('No Mapbox token in response:', data);
        throw new Error('Mapbox token not found in response');
      }

      console.log('Successfully retrieved Mapbox token');
      mapboxgl.accessToken = data.token;

      console.log('Initializing Mapbox map...');
      const map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: theme === 'dark' 
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11',
        center: [location.lng, location.lat],
        zoom: 13
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      if (!readonly) {
        map.on('click', (e) => {
          onLocationChange?.({
            lat: e.lngLat.lat,
            lng: e.lngLat.lng
          });
        });
      }

      map.on('load', () => {
        console.log('Map loaded successfully');
        setIsLoading(false);
      });

      return map;
    } catch (error) {
      console.error('Detailed map initialization error:', {
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error initializing map",
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
      return null;
    }
  };

  return { isLoading, initializeMap };
};
