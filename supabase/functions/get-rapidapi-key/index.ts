
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
        
        // In a real environment, you would save this to a secure location
        // Here we're saving it to an environment variable, but this will only persist for the current instance
        Deno.env.set('RAPIDAPI_KEY', newApiKey);
        
        console.log(`New RapidAPI key set with length: ${newApiKey.length}`);
        
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
    }
    
    // Create a response based on whether the key was found
    if (!rapidApiKey) {
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
