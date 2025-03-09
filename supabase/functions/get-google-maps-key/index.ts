
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    console.log('Starting get-google-maps-key edge function');
    
    // Getting environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment variables check:', { 
      hasSupabaseUrl: !!supabaseUrl, 
      hasSupabaseKey: !!supabaseKey 
    });
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      throw new Error('Missing Supabase credentials');
    }
    
    console.log('Creating Supabase admin client');
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Attempt to get the secret directly first (newer Supabase version)
    console.log('Directly accessing Google Maps API key from secrets');
    let googleMapApiKey = Deno.env.get('GOOGLEMAP_API_KEY');
    
    if (googleMapApiKey) {
      console.log('Found Google Maps API key in direct environment variables');
    } else {
      // Fallback to RPC method
      console.log('Falling back to RPC get_secrets method');
      const { data, error } = await supabaseAdmin.rpc('get_secrets', {
        secret_names: ['GOOGLEMAP_API_KEY']
      });
      
      if (error) {
        console.error('Error fetching Google Maps API key from secrets:', error);
        throw new Error(`Failed to retrieve Google Maps API key: ${error.message}`);
      }
      
      console.log('Secret data received:', JSON.stringify({
        receivedKeys: data ? Object.keys(data) : [],
        hasGoogleMapKey: data && data.GOOGLEMAP_API_KEY ? true : false
      }));
      
      if (data && data.GOOGLEMAP_API_KEY) {
        googleMapApiKey = data.GOOGLEMAP_API_KEY;
      }
    }
    
    if (!googleMapApiKey) {
      console.error('Google Maps API key not found in secrets');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Google Maps API key not configured in Supabase secrets. Please add the GOOGLEMAP_API_KEY secret.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }
    
    // Return the API key
    console.log('Returning Google Maps API key successfully (key length: ' + googleMapApiKey.length + ')');
    return new Response(
      JSON.stringify({ 
        success: true,
        googleMapsApiKey: googleMapApiKey
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in Google Maps edge function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
