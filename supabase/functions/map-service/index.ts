
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Public Mapbox token that can be used as fallback (limited usage)
const FALLBACK_TOKEN = 'pk.eyJ1IjoibG92YWJsZWFpIiwiYSI6ImNscDJsb2N0dDFmcHcya3BnYnZpNm9mbnEifQ.tHhXbyzm-GhoiZpFOSxG8A';

// Verify token works by making a test request to Mapbox API
async function verifyMapboxToken(token: string): Promise<boolean> {
  try {
    console.log('Verifying Mapbox token validity...');
    const response = await fetch(`https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${token}`, {
      method: 'HEAD',
    });
    
    if (response.ok) {
      console.log('Mapbox token is valid');
      return true;
    } else {
      console.error(`Token verification failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('Error verifying Mapbox token:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Map service function called - retrieving Mapbox token');
    
    let token = null;
    let tokenSource = 'fallback';
    let isTokenValid = false;
    
    // Try to get token from environment variables first
    if (Deno.env.get('MAPBOX_PUBLIC_TOKEN')) {
      token = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
      console.log('Using MAPBOX_PUBLIC_TOKEN from environment variables');
      
      // Verify the environment variable token
      isTokenValid = await verifyMapboxToken(token);
      if (isTokenValid) {
        tokenSource = 'environment';
      } else {
        console.error('Environment token is invalid, will try fallback sources');
        token = null;
      }
    }
    
    // If no valid token yet, try Supabase secrets
    if (!token) {
      // Initialize Supabase client with Edge Function's environment variables
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseKey) {
          console.log('Missing Supabase credentials, will try fallback token');
        } else {
          const supabaseClient = createClient(supabaseUrl, supabaseKey);

          // Fetch the secret using Supabase's get_secrets RPC function
          const { data: secrets, error: secretsError } = await supabaseClient.rpc('get_secrets', {
            secret_names: ['MAPBOX_PUBLIC_TOKEN']
          });

          if (secretsError) {
            console.error('Error fetching secret:', secretsError);
          } else if (secrets?.MAPBOX_PUBLIC_TOKEN) {
            const supabaseToken = secrets.MAPBOX_PUBLIC_TOKEN;
            
            // Verify the Supabase secret token
            isTokenValid = await verifyMapboxToken(supabaseToken);
            if (isTokenValid) {
              token = supabaseToken;
              tokenSource = 'supabase-secrets';
              console.log('Using valid MAPBOX_PUBLIC_TOKEN from Supabase secrets');
            } else {
              console.error('Supabase secret token is invalid, will use fallback token');
            }
          }
        }
      } catch (error) {
        console.error('Error with Supabase client:', error);
      }
    }
    
    // Use fallback token if nothing else worked
    if (!token) {
      console.log('No valid token found in environment or Supabase secrets, using fallback token');
      
      // Verify the fallback token
      isTokenValid = await verifyMapboxToken(FALLBACK_TOKEN);
      if (isTokenValid) {
        token = FALLBACK_TOKEN;
        tokenSource = 'fallback';
        console.log('Using valid fallback Mapbox token');
      } else {
        console.error('Even fallback token is invalid! Returning it anyway as last resort');
        token = FALLBACK_TOKEN;
        tokenSource = 'invalid-fallback';
      }
    }

    console.log(`Successfully retrieved Mapbox token from ${tokenSource}`);
    
    return new Response(
      JSON.stringify({ 
        token,
        source: tokenSource,
        valid: isTokenValid
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in map service:', error);
    
    // Always return a fallback token in error cases
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        token: FALLBACK_TOKEN, // Provide fallback token even in error case
        source: 'error-fallback',
        valid: false
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
