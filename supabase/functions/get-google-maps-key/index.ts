
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
    // Get the Go Map API key using the correct secret name
    const goMapApiKey = Deno.env.get('Gomap_api');
    
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
          error: 'Gomap_api not found in environment variables. Please set it in the Supabase Edge Function Secrets.' 
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
