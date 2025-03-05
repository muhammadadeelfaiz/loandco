
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
    // Check if this is a POST request to update the API key
    if (req.method === 'POST') {
      try {
        const requestData = await req.json();
        const newApiKey = requestData.apiKey;
        
        if (!newApiKey) {
          console.error("No API key provided in request body");
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'No API key provided in request body' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }
        
        // Validate that it looks like a RapidAPI key (basic check)
        if (newApiKey.length < 20) {
          console.error("API key appears to be too short:", newApiKey.length);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'API key appears to be invalid (too short)' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }
        
        // Save the API key to the Supabase Edge Function Secrets
        // This is the recommended way to store secrets for Supabase Edge Functions
        console.log(`Setting RAPIDAPI_KEY secret with length: ${newApiKey.length}`);
        
        // For testing and demo purposes, we'll log a small part of the key to verify it's set correctly
        // without revealing the entire key
        const maskedKey = `${newApiKey.substring(0, 5)}...${newApiKey.substring(newApiKey.length - 5)}`;
        console.log(`API key snippet (first/last 5 chars): ${maskedKey}`);
        
        // In a real deployment, this would set the secret, but during local development,
        // we'd set the environment variable
        Deno.env.set('RAPIDAPI_KEY', newApiKey);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'API key updated successfully',
            keyLength: newApiKey.length
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      } catch (error) {
        console.error('Error parsing request body:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid request format' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }
    }
    
    // GET request to retrieve the API key
    // Get the API key from environment variables (stored in Supabase Edge Function Secrets)
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    
    // Log key information (without revealing the actual key)
    console.log(`RapidAPI key found: ${rapidApiKey ? 'Yes' : 'No'}`);
    if (rapidApiKey) {
      console.log(`RapidAPI key length: ${rapidApiKey.length}`);
      const maskedKey = `${rapidApiKey.substring(0, 3)}...${rapidApiKey.substring(rapidApiKey.length - 3)}`;
      console.log(`Key snippet (first/last 3 chars): ${maskedKey}`);
    }
    
    // Create a response based on whether the key was found
    if (!rapidApiKey) {
      console.error('RAPIDAPI_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          keyFound: false, 
          error: 'RAPIDAPI_KEY not found in environment variables. Please set it in the Supabase Edge Function Secrets.' 
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
        rapidApiKey,
        keyLength: rapidApiKey.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error retrieving RapidAPI key:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
