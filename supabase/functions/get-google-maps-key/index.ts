
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
    // Get the Mapapi_rapid key which will now be used for Go Map
    const goMapApiKey = Deno.env.get('Mapapi_rapid');
    
    // Log key information (without revealing the actual key)
    console.log(`Go Map API key found: ${goMapApiKey ? 'Yes' : 'No'}`);
    if (goMapApiKey) {
      console.log(`Go Map API key length: ${goMapApiKey.length}`);
    }
    
    // Create a response based on whether the key was found
    if (!goMapApiKey) {
      return new Response(
        JSON.stringify({ 
          keyFound: false, 
          error: 'Mapapi_rapid not found in environment variables. Please set it in the Supabase Edge Function Secrets.' 
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
        goMapApiKey: goMapApiKey
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error retrieving Go Map API key:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
