
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    console.log('Attempting to retrieve Mapbox token...');
    
    if (!token) {
      console.error('MAPBOX_PUBLIC_TOKEN not found in environment variables');
      throw new Error('Map configuration is missing');
    }

    console.log('Successfully retrieved Mapbox token');
    
    return new Response(
      JSON.stringify({ token }), 
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Map service error:', error.message);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to initialize map service',
        details: error.message
      }), 
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});
