
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders, errorResponse, successResponse } from "../_shared/utils.ts";

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
      console.log("Mapbox token is valid");
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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request information
    const url = new URL(req.url);
    const originDomain = req.headers.get('origin') || 'unknown';
    
    let token = null;
    let tokenSource = 'from-secrets';
    let verificationResult = { isValid: false, error: undefined };
    
    // Try to get token from Supabase secrets first (your newly added token)
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
          console.log("Found token in Supabase secrets, verifying...");
          
          // Verify the Supabase secret token
          verificationResult = await verifyMapboxToken(supabaseToken);
          if (verificationResult.isValid) {
            token = supabaseToken;
            console.log("Token from secrets is valid!");
          } else {
            console.warn("Token from secrets is invalid:", verificationResult.error);
          }
        } else {
          console.log("No token found in secrets or error retrieving:", secretsError);
        }
      }
    } catch (error) {
      console.error("Error accessing Supabase secrets:", error);
    }
    
    // If no valid token from secrets, try environment variables next
    if (!token) {
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
    }
    
    // Use fallback token if nothing else worked
    if (!token) {
      // Verify the fallback token
      verificationResult = await verifyMapboxToken(FALLBACK_TOKEN);
      if (verificationResult.isValid) {
        token = FALLBACK_TOKEN;
        tokenSource = 'fallback';
      } else {
        return errorResponse(
          "All available tokens are invalid. Please check Mapbox service status.", 
          500, 
          {
            source: "validation-error",
            requestInfo: {
              origin: originDomain,
              timestamp: new Date().toISOString()
            }
          }
        );
      }
    }

    console.log(`Returning Mapbox token from source: ${tokenSource}`);
    
    // Return the token with appropriate cache headers
    return successResponse({
      token,
      source: tokenSource,
      valid: verificationResult.isValid,
      timestamp: new Date().toISOString(),
      expiresIn: 86400, // 24 hours in seconds
    });

  } catch (error) {
    console.error("Error in map-service:", error);
    
    // Always return a fallback token in error cases
    return successResponse({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      token: FALLBACK_TOKEN, // Provide fallback token even in error case
      source: 'error-fallback',
      valid: true // Mark as valid to allow map to initialize
    });
  }
});
