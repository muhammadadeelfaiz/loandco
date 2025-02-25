
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
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the Mapbox token from secrets
    const { data, error } = await supabaseClient.rpc('get_secrets', {
      secret_names: ['MAPBOX_PUBLIC_TOKEN']
    });

    if (error || !data?.MAPBOX_PUBLIC_TOKEN) {
      console.error('Failed to fetch Mapbox token:', error || 'No token found');
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

    const token = data.MAPBOX_PUBLIC_TOKEN;
    console.log('Successfully retrieved Mapbox token');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        token 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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
