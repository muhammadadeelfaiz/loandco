
import { useState, useEffect, useCallback, RefObject, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// Temporary token - you should replace this with your own from Mapbox
const TEMP_MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZWFpIiwiYSI6ImNscDJsb2N0dDFmcHcya3BnYnZpNm9mbnEifQ.tHhXbyzm-GhoiZpFOSxG8A';

export const useMapInitialization = (mapContainer: RefObject<HTMLDivElement>, theme: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [tokenAttempts, setTokenAttempts] = useState(0);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const isInitialMount = useRef(true);

  // Function to validate a Mapbox token by making a test request
  const validateToken = useCallback(async (testToken: string): Promise<boolean> => {
    try {
      console.log('Validating Mapbox token...');
      // Make a simple request to Mapbox API to verify token works
      const response = await fetch(`https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${testToken}`, {
        method: 'HEAD',
      });
      
      const isValid = response.ok;
      console.log(`Token validation result: ${isValid ? 'valid' : 'invalid'}`);
      return isValid;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isInitialMount.current) {
      return;
    }
    
    const fetchToken = async () => {
      try {
        console.log('Fetching Mapbox token... Attempt:', tokenAttempts + 1);
        setIsLoading(true);
        setTokenError(null);
        
        // First try to get token from localStorage cache if it exists and is recent
        const cachedToken = localStorage.getItem('mapbox_token');
        const cachedTimestamp = localStorage.getItem('mapbox_token_timestamp');
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        if (cachedToken && cachedTimestamp && parseInt(cachedTimestamp) > twentyFourHoursAgo) {
          // Validate cached token before using it
          const isValidToken = await validateToken(cachedToken);
          if (isValidToken) {
            console.log('Using valid cached Mapbox token from localStorage');
            setToken(cachedToken);
            setIsLoading(false);
            isInitialMount.current = false;
            return;
          } else {
            console.log('Cached token is invalid, clearing cache');
            localStorage.removeItem('mapbox_token');
            localStorage.removeItem('mapbox_token_timestamp');
          }
        }
        
        // Try to get token from Supabase Function
        try {
          console.log('Calling Supabase map-service function...');
          const { data, error } = await supabase.functions.invoke('map-service', {
            method: 'GET',
          });
          
          if (error) {
            console.error('Supabase function error:', error);
            throw error;
          }
          
          if (data?.token) {
            const isValidToken = await validateToken(data.token);
            if (isValidToken) {
              console.log('Successfully received valid Mapbox token from Supabase:', data.source);
              
              // Cache the token in localStorage with timestamp
              localStorage.setItem('mapbox_token', data.token);
              localStorage.setItem('mapbox_token_timestamp', Date.now().toString());
              
              setToken(data.token);
              setIsLoading(false);
              isInitialMount.current = false;
              return;
            } else {
              console.warn('Token from Supabase is invalid');
            }
          } else {
            console.warn('No token in response from map-service function');
          }
        } catch (supabaseError) {
          console.error('Supabase token fetch failed:', supabaseError);
        }
        
        // Use temporary token as last resort for development
        console.log('Using temporary Mapbox token for development');
        
        // Validate temporary token before using it
        const isValidTemp = await validateToken(TEMP_MAPBOX_TOKEN);
        if (isValidTemp) {
          localStorage.setItem('mapbox_token', TEMP_MAPBOX_TOKEN);
          localStorage.setItem('mapbox_token_timestamp', Date.now().toString());
          setToken(TEMP_MAPBOX_TOKEN);
        } else {
          console.error('Temporary token is invalid!');
          setTokenError('Unable to obtain a valid Mapbox token. Please try again later.');
          toast({
            variant: "destructive",
            title: "Map Error",
            description: "Failed to initialize map with valid token. Please check your network settings.",
            duration: 5000,
          });
        }
        
        setIsLoading(false);
        isInitialMount.current = false;
      } catch (error) {
        console.error('Token fetch error:', error);
        setTokenError(error instanceof Error ? error.message : 'Unknown error fetching map token');
        setToken(null);
        setIsLoading(false);
        isInitialMount.current = false;
        
        toast({
          variant: "destructive",
          title: "Map Error",
          description: error instanceof Error ? error.message : "Failed to fetch map configuration",
          duration: 5000,
        });
      }
    };

    // Only fetch if we don't have a token
    if (isInitialMount.current) {
      fetchToken();
    }
  }, [toast, tokenAttempts, validateToken]);

  const initializeMap = useCallback(async (
    location: { lat: number; lng: number },
    onLocationChange?: (location: { lat: number; lng: number }) => void,
    readonly = false
  ) => {
    if (!mapContainer.current) {
      console.error('Map container not found');
      return null;
    }

    // If we already have a map instance, return it
    if (mapRef.current) {
      return mapRef.current;
    }

    if (!token) {
      console.error('No Mapbox token available');
      // Try to use temporary token as last resort
      mapboxgl.accessToken = TEMP_MAPBOX_TOKEN;
      console.log('Using temporary token as fallback');
    } else {
      console.log('Using Mapbox token:', token.substring(0, 10) + '...');
      mapboxgl.accessToken = token;
    }

    try {
      const defaultLocation = location || { lat: 25.2048, lng: 55.2708 }; // Dubai as default

      console.log('Creating map instance with center:', defaultLocation);
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: theme === 'dark' 
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11',
        center: [defaultLocation.lng, defaultLocation.lat],
        zoom: 13,
        attributionControl: false,
      });
      
      // Save the map instance
      mapRef.current = map;
      
      // Add attribution in the bottom-right
      map.addControl(new mapboxgl.AttributionControl(), 'bottom-right');

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Setup marker if not in readonly mode
      if (!readonly) {
        const marker = new mapboxgl.Marker({
          draggable: !readonly,
          color: '#3886ce'
        });
        
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

      return map;

    } catch (error) {
      console.error('Map initialization failed:', error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Map Error",
        description: error instanceof Error ? error.message : "Failed to initialize map",
        duration: 5000,
      });
      return null;
    }
  }, [mapContainer, token, theme, toast]);

  // Function to retry fetching the token
  const retryFetchToken = useCallback(() => {
    // Clear any cached tokens first
    localStorage.removeItem('mapbox_token');
    localStorage.removeItem('mapbox_token_timestamp');
    isInitialMount.current = true;
    setTokenAttempts(prev => prev + 1);
  }, []);

  // Clean up the map instance on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return { isLoading, initializeMap, retryFetchToken, tokenError };
};
