
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=86400', // Cache for one day
};

// Public Mapbox token that can be used as fallback (limited usage)
const FALLBACK_TOKEN = 'pk.eyJ1IjoibG92YWJsZWFpIiwiYSI6ImNscDJsb2N0dDFmcHcya3BnYnZpNm9mbnEifQ.tHhXbyzm-GhoiZpFOSxG8A';

// Verify token works by making a test request to Mapbox API
async function verifyMapboxToken(token: string): Promise<{isValid: boolean; error?: string}> {
  try {
    // Use a more reliable endpoint for token validation
    const response = await fetch(`https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${token}`, {
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (response.ok) {
      return { isValid: true };
    } else {
      const status = response.status;
      let errorMessage = `Token verification failed with status: ${status}`;
      
      if (status === 401) {
        errorMessage = "Unauthorized: The token is invalid or has expired";
      } else if (status === 403) {
        errorMessage = "Forbidden: The token doesn't have sufficient permissions";
      }
      
      return { isValid: false, error: errorMessage };
    }
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : 'Unknown error during verification' };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request information
    const url = new URL(req.url);
    const originDomain = req.headers.get('origin') || 'unknown';
    
    let token = null;
    let tokenSource = 'fallback';
    let verificationResult = { isValid: false, error: undefined };
    
    // Try to get token from environment variables first
    if (Deno.env.get('MAPBOX_PUBLIC_TOKEN')) {
      token = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
      
      // Verify the environment variable token
      verificationResult = await verifyMapboxToken(token);
      if (verificationResult.isValid) {
        tokenSource = 'environment';
      } else {
        token = null;
      }
    }
    
    // If no valid token yet, try Supabase secrets
    if (!token) {
      // Initialize Supabase client with Edge Function's environment variables
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseKey) {
          const supabaseClient = createClient(supabaseUrl, supabaseKey);

          // Fetch the secret using Supabase's get_secrets RPC function
          const { data: secrets, error: secretsError } = await supabaseClient.rpc('get_secrets', {
            secret_names: ['MAPBOX_PUBLIC_TOKEN']
          });

          if (!secretsError && secrets?.MAPBOX_PUBLIC_TOKEN) {
            const supabaseToken = secrets.MAPBOX_PUBLIC_TOKEN;
            
            // Verify the Supabase secret token
            verificationResult = await verifyMapboxToken(supabaseToken);
            if (verificationResult.isValid) {
              token = supabaseToken;
              tokenSource = 'supabase-secrets';
            }
          }
        }
      } catch (error) {
        // Continue to fallback token
      }
    }
    
    // Use fallback token if nothing else worked
    if (!token) {
      // Verify the fallback token
      verificationResult = await verifyMapboxToken(FALLBACK_TOKEN);
      if (verificationResult.isValid) {
        token = FALLBACK_TOKEN;
        tokenSource = 'fallback';
      } else {
        return new Response(
          JSON.stringify({ 
            error: "All available tokens are invalid. Please check Mapbox service status.",
            source: "validation-error",
            requestInfo: {
              origin: originDomain,
              timestamp: new Date().toISOString()
            }
          }), 
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }
    }

    // Add strong caching headers to reduce requests
    const responseHeaders = {
      ...corsHeaders, 
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Expires': new Date(Date.now() + 86400000).toUTCString() // 24 hours in the future
    };
    
    return new Response(
      JSON.stringify({ 
        token,
        source: tokenSource,
        valid: verificationResult.isValid,
        timestamp: new Date().toISOString(),
        expiresIn: 86400, // 24 hours in seconds
      }), 
      { 
        headers: responseHeaders,
        status: 200
      }
    );

  } catch (error) {
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
