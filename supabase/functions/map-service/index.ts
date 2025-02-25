
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    console.log('Retrieved token from env:', !!token); // Log if token exists
    
    if (!token) {
      console.error('Mapbox token not found in environment');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing Mapbox configuration', 
          token: null 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        token 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in map-service function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message, 
        token: null 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
