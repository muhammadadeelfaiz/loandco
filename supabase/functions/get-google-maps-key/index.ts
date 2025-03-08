
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // First try to get the key from the environment variable
    let googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    // If not found, try the Mapapi_rapid secret
    if (!googleMapsApiKey) {
      googleMapsApiKey = Deno.env.get('Mapapi_rapid');
    }
    
    // Log key information (without revealing the actual key)
    console.log(`Google Maps API key found: ${googleMapsApiKey ? 'Yes' : 'No'}`);
    if (googleMapsApiKey) {
      console.log(`Google Maps API key length: ${googleMapsApiKey.length}`);
    }
    
    // Create a response based on whether the key was found
    if (!googleMapsApiKey) {
      return new Response(
        JSON.stringify({ 
          keyFound: false, 
          error: 'Neither GOOGLE_MAPS_API_KEY nor Mapapi_rapid found in environment variables. Please set one of them in the Supabase Edge Function Secrets.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }
    
    // Return the API key if found
    return new Response(
      JSON.stringify({ 
        keyFound: true, 
        googleMapsApiKey
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error retrieving Google Maps API key:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
