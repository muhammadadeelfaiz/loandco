
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Edge function invoked: get-rapidapi-key");
    
    // Get the RapidAPI key from Supabase secrets
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    console.log("Retrieved RapidAPI key from environment, length:", rapidApiKey ? rapidApiKey.length : 0);

    if (!rapidApiKey) {
      console.error("RAPIDAPI_KEY not found in Supabase Edge Function Secrets");
      return new Response(
        JSON.stringify({ 
          error: "RAPIDAPI_KEY not found in Supabase Edge Function Secrets",
          keyFound: false 
        }),
        { 
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Return the API key and its length for debugging
    return new Response(
      JSON.stringify({ 
        rapidApiKey,
        keyLength: rapidApiKey.length,
        keyFound: true,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error("Error in get-rapidapi-key function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        keyFound: false 
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
})
