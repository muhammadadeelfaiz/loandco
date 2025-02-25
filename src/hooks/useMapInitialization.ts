
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
    if (!mapContainer.current) {
      console.error('Map container not found');
      setIsLoading(false);
      return null;
    }

    try {
      console.log('Fetching Mapbox token from edge function...');
      const { data, error } = await supabase.functions.invoke('map-service', {
        method: 'GET'
      });

      if (error || !data?.token) {
        console.error('Failed to fetch Mapbox token:', error || 'No token returned');
        toast({
          variant: "destructive",
          title: "Map Configuration Error",
          description: "Failed to initialize map. Please check your configuration."
        });
        setIsLoading(false);
        return null;
      }

      console.log('Successfully retrieved Mapbox token');
      mapboxgl.accessToken = data.token;

      const defaultLocation = location || { lat: 25.2048, lng: 55.2708 }; // Dubai as default

      console.log('Initializing Mapbox map...');
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: theme === 'dark' 
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11',
        center: [defaultLocation.lng, defaultLocation.lat],
        zoom: 13,
      });

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add click handler if not readonly
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

        if (location) {
          marker.setLngLat([location.lng, location.lat]).addTo(map);
        }
      }

      map.on('load', () => {
        console.log('Map loaded successfully');
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
