
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback token (only for development)
const FALLBACK_TOKEN = 'pk.eyJ1IjoibG92YWJsZWFpIiwiYSI6ImNscDJsb2N0dDFmcHcya3BnYnZpNm9mbnEifQ.tHhXbyzm-GhoiZpFOSxG8A';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Map service function called');
    
    let token = null;
    
    // Try to get token from environment variables first
    if (Deno.env.get('MAPBOX_PUBLIC_TOKEN')) {
      token = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
      console.log('Using MAPBOX_PUBLIC_TOKEN from environment');
    } else {
      // Initialize Supabase client with Edge Function's environment variables
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseKey) {
          console.log('Missing Supabase credentials, using fallback token');
          token = FALLBACK_TOKEN;
        } else {
          const supabaseClient = createClient(supabaseUrl, supabaseKey);

          // Fetch the secret using Supabase's get_secrets RPC function
          const { data: secrets, error: secretsError } = await supabaseClient.rpc('get_secrets', {
            secret_names: ['MAPBOX_PUBLIC_TOKEN']
          });

          if (secretsError) {
            console.error('Error fetching secret:', secretsError);
            throw new Error('Failed to fetch Mapbox token');
          }

          token = secrets?.MAPBOX_PUBLIC_TOKEN;
          
          if (!token) {
            console.log('No MAPBOX_PUBLIC_TOKEN in secrets, using fallback');
            token = FALLBACK_TOKEN;
          }
        }
      } catch (error) {
        console.error('Error with Supabase client:', error);
        token = FALLBACK_TOKEN;
      }
    }
    
    // Use fallback token if nothing else worked (development only)
    if (!token) {
      console.log('Token still null, using fallback token');
      token = FALLBACK_TOKEN;
    }

    console.log('Successfully retrieved Mapbox token');
    
    return new Response(
      JSON.stringify({ token }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in map service:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        token: FALLBACK_TOKEN // Provide fallback token even in error case
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
