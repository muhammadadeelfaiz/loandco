
import { useState, useEffect, useCallback, RefObject } from 'react';
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
  const [tokenSource, setTokenSource] = useState<string | null>(null);
  const [isTokenFetching, setIsTokenFetching] = useState(false);

  // Get the current domain for debugging
  const getCurrentDomain = useCallback(() => {
    try {
      return window.location.hostname;
    } catch (e) {
      return 'unknown';
    }
  }, []);

  // Function to validate a Mapbox token by making a test request
  const validateToken = useCallback(async (testToken: string): Promise<{isValid: boolean; error?: string}> => {
    try {
      console.log('Validating Mapbox token...');
      // Make a simple request to Mapbox API to verify token works
      const response = await fetch(`https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${testToken}`, {
        method: 'HEAD',
      });
      
      if (response.ok) {
        console.log('Token validation result: valid');
        return { isValid: true };
      } else {
        const status = response.status;
        let errorMsg = `Token invalid (HTTP ${status})`;
        
        if (status === 401) {
          errorMsg = "Token unauthorized or invalid";
        } 
        // Don't automatically assume 403 is a domain restriction, could be other permissions
        
        console.log(`Token validation result: invalid - ${errorMsg}`);
        return { isValid: false, error: errorMsg };
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return { isValid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  useEffect(() => {
    // Skip if we're already fetching a token or if we already have a valid token
    if (isTokenFetching || (token && !tokenError)) return;

    const fetchToken = async () => {
      try {
        console.log('Fetching Mapbox token... Attempt:', tokenAttempts + 1);
        setIsTokenFetching(true);
        setIsLoading(true);
        setTokenError(null);
        
        const currentDomain = getCurrentDomain();
        console.log(`Current domain: ${currentDomain}`);
        
        // First try to get token from localStorage cache if it exists and is recent
        const cachedToken = localStorage.getItem('mapbox_token');
        const cachedTimestamp = localStorage.getItem('mapbox_token_timestamp');
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        if (cachedToken && cachedTimestamp && parseInt(cachedTimestamp) > twentyFourHoursAgo) {
          // Validate cached token before using it
          const validationResult = await validateToken(cachedToken);
          if (validationResult.isValid) {
            console.log('Using valid cached Mapbox token from localStorage');
            setToken(cachedToken);
            setTokenSource('localStorage');
            setIsLoading(false);
            setIsTokenFetching(false);
            return;
          } else {
            console.log(`Cached token is invalid: ${validationResult.error}, clearing cache`);
            localStorage.removeItem('mapbox_token');
            localStorage.removeItem('mapbox_token_timestamp');
          }
        }
        
        // Try to get token directly from environment first
        const envToken = process.env.MAPBOX_PUBLIC_TOKEN;
        if (envToken) {
          const validationResult = await validateToken(envToken);
          if (validationResult.isValid) {
            console.log('Using valid Mapbox token from environment');
            localStorage.setItem('mapbox_token', envToken);
            localStorage.setItem('mapbox_token_timestamp', Date.now().toString());
            setToken(envToken);
            setTokenSource('environment');
            setIsLoading(false);
            setIsTokenFetching(false);
            return;
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
            // Always try to use the token from Supabase regardless of the 'valid' flag
            // We'll do our own validation
            console.log(`Received Mapbox token from Supabase: ${data.source}`);
            
            const validationResult = await validateToken(data.token);
            if (validationResult.isValid) {
              console.log('Supabase token is valid, storing in cache');
              localStorage.setItem('mapbox_token', data.token);
              localStorage.setItem('mapbox_token_timestamp', Date.now().toString());
              setToken(data.token);
              setTokenSource(data.source);
              setIsLoading(false);
              setIsTokenFetching(false);
              return;
            } else {
              console.warn(`Token from Supabase is invalid: ${validationResult.error}`);
              // Continue to fallback token
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
        const tempValidationResult = await validateToken(TEMP_MAPBOX_TOKEN);
        if (tempValidationResult.isValid) {
          localStorage.setItem('mapbox_token', TEMP_MAPBOX_TOKEN);
          localStorage.setItem('mapbox_token_timestamp', Date.now().toString());
          setToken(TEMP_MAPBOX_TOKEN);
          setTokenSource('fallback');
          setIsLoading(false);
          setIsTokenFetching(false);
        } else {
          console.error(`Temporary token is invalid: ${tempValidationResult.error}`);
          setTokenError(tempValidationResult.error || 'Unable to obtain a valid Mapbox token');
          setIsLoading(false);
          setIsTokenFetching(false);
          toast({
            variant: "destructive",
            title: "Map Error",
            description: "Failed to initialize map with valid token. Please try refreshing the page.",
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Token fetch error:', error);
        setTokenError(error instanceof Error ? error.message : 'Unknown error fetching map token');
        setToken(null);
        setIsLoading(false);
        setIsTokenFetching(false);
        
        toast({
          variant: "destructive",
          title: "Map Error",
          description: error instanceof Error ? error.message : "Failed to fetch map configuration",
          duration: 5000,
        });
      }
    };

    // Only fetch if we don't have a token or if there was an error and we're retrying
    if (!token || tokenError) {
      fetchToken();
    }
  }, [toast, tokenAttempts, validateToken, getCurrentDomain, token, tokenError, isTokenFetching]);

  const initializeMap = async (
    location: { lat: number; lng: number },
    onLocationChange?: (location: { lat: number; lng: number }) => void,
    readonly = false
  ) => {
    if (!mapContainer.current) {
      console.error('Map container not found');
      return null;
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
        preserveDrawingBuffer: true, // Fix for some Safari rendering issues
      });
      
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
  };

  // Function to retry fetching the token
  const retryFetchToken = () => {
    // Clear any cached tokens first
    localStorage.removeItem('mapbox_token');
    localStorage.removeItem('mapbox_token_timestamp');
    setTokenAttempts(prev => prev + 1);
    setIsTokenFetching(false); // Reset fetching state to allow a new attempt
  };

  return { isLoading, initializeMap, retryFetchToken, tokenError, tokenSource };
};
