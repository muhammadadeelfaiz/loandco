
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=3600', // Cache for one hour
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting map-token edge function');
    const originDomain = req.headers.get('origin') || 'unknown';
    console.log(`Request from origin: ${originDomain}`);
    
    // For quick fix in development, we can also use a hardcoded token as fallback
    // This is Mapbox's default public token which is rate-limited but works for demos
    const fallbackToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';
    
    // Initialize Supabase client to access secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('Missing Supabase credentials, using fallback token');
      return new Response(
        JSON.stringify({ 
          token: fallbackToken,
          source: 'fallback',
          timestamp: new Date().toISOString(),
          expiresIn: 3600,
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    console.log('Creating Supabase admin client');
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Get the Mapbox token from secrets
    let mapboxToken;
    
    // First try to get the token directly from environment
    mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    
    if (!mapboxToken) {
      console.log('Token not found in environment, trying secrets');
      const { data, error } = await supabaseAdmin.rpc('get_secrets', {
        secret_names: ['MAPBOX_PUBLIC_TOKEN']
      });
      
      if (error) {
        console.error('Error fetching token from secrets:', error.message);
        // Use fallback token
        mapboxToken = fallbackToken;
        console.log('Using fallback token due to secret fetch error');
      } else if (data && data.MAPBOX_PUBLIC_TOKEN) {
        mapboxToken = data.MAPBOX_PUBLIC_TOKEN;
        console.log('Retrieved token from secrets');
      } else {
        console.log('Mapbox token not found in secrets, using fallback');
        mapboxToken = fallbackToken;
      }
    } else {
      console.log('Retrieved token from environment');
    }
    
    // Validate the token with a simple check
    if (!mapboxToken || typeof mapboxToken !== 'string' || !mapboxToken.startsWith('pk.')) {
      console.log('Invalid token format, using fallback');
      mapboxToken = fallbackToken;
    }
    
    console.log(`Successfully retrieved Mapbox token (length: ${mapboxToken.length})`);
    
    return new Response(
      JSON.stringify({ 
        token: mapboxToken,
        source: mapboxToken === fallbackToken ? 'fallback' : 'edge-function',
        timestamp: new Date().toISOString(),
        expiresIn: 3600, // 1 hour in seconds
      }), 
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in map-token edge function:', error);
    
    // Return a working fallback token even in case of errors
    const fallbackToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';
    
    return new Response(
      JSON.stringify({ 
        token: fallbackToken,
        source: 'fallback-error',
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        timestamp: new Date().toISOString(),
        expiresIn: 3600,
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 even on error with the fallback token
      }
    );
  }
});
