
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
