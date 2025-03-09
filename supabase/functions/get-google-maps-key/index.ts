
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Get the Google Maps API key from Supabase Secrets
    const { data, error } = await supabaseAdmin.rpc('get_secrets', {
      secret_names: ['GOOGLEMAP_API_KEY']
    });
    
    if (error) {
      console.error('Error fetching Google Maps API key from secrets:', error);
      throw new Error('Failed to retrieve Google Maps API key');
    }
    
    if (!data || !data.GOOGLEMAP_API_KEY) {
      console.error('Google Maps API key not found in secrets');
      throw new Error('Google Maps API key not configured');
    }
    
    // Return the API key
    return new Response(
      JSON.stringify({ 
        success: true,
        googleMapsApiKey: data.GOOGLEMAP_API_KEY
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
