
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UseMapTokenResult {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<string | null>;
}

/**
 * Hook to fetch and manage Mapbox token
 */
export const useMapToken = (): UseMapTokenResult => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchToken = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check for a valid cached token first
      const cachedToken = localStorage.getItem('mapbox_token');
      const cachedTimestamp = localStorage.getItem('mapbox_token_timestamp');
      
      if (cachedToken && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();
        // Use cached token if it's less than 30 minutes old
        if (now - timestamp < 30 * 60 * 1000) {
          console.log('Using cached Mapbox token');
          setToken(cachedToken);
          setIsLoading(false);
          return cachedToken;
        }
      }
      
      // Fetch fresh token from Edge Function
      console.log('Fetching fresh Mapbox token');
      const { data, error } = await supabase.functions.invoke('map-token');
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      if (!data.token) {
        throw new Error('No token received from server');
      }
      
      // Cache the token
      localStorage.setItem('mapbox_token', data.token);
      localStorage.setItem('mapbox_token_timestamp', Date.now().toString());
      
      console.log('Successfully fetched Mapbox token');
      setToken(data.token);
      return data.token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Mapbox token';
      console.error('Error fetching Mapbox token:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Initial fetch on mount
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);
  
  const refreshToken = useCallback(async () => {
    // Clear cache
    localStorage.removeItem('mapbox_token');
    localStorage.removeItem('mapbox_token_timestamp');
    
    return fetchToken();
  }, [fetchToken]);
  
  return {
    token,
    isLoading,
    error,
    refreshToken
  };
};
