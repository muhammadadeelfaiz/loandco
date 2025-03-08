
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
    // Get the Google Maps API key using the correct secret name
    // Changed to look for GOOGLE_MAPS_API_KEY first, then Gomap_api as fallback
    let googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!googleMapsApiKey) {
      // Try fallback key name
      googleMapsApiKey = Deno.env.get('Gomap_api');
    }
    
    // Log key information (without revealing the actual key)
    console.log(`Google Maps API key found: ${googleMapsApiKey ? 'Yes' : 'No'}`);
    if (googleMapsApiKey) {
      console.log(`Google Maps API key length: ${googleMapsApiKey.length}`);
    }
    
    // Create a response based on whether the key was found
    if (!googleMapsApiKey) {
      console.error('No Google Maps API key found in environment variables.');
      return new Response(
        JSON.stringify({ 
          keyFound: false, 
          error: 'Google Maps API key not found in environment variables. Please set GOOGLE_MAPS_API_KEY in the Supabase Edge Function Secrets.' 
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
        googleMapsApiKey: googleMapsApiKey
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error retrieving Google Maps API key:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
