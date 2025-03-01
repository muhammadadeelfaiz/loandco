
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Fetching RAPIDAPI_KEY from environment variables')
    
    // Retrieve the RAPIDAPI_KEY directly from environment variables
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')
    
    if (!rapidApiKey) {
      console.error('RAPIDAPI_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ 
          error: 'RAPIDAPI_KEY not found', 
          message: 'Please add the RAPIDAPI_KEY in Supabase Edge Function Secrets'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 404 
        }
      )
    }

    console.log('Successfully retrieved RAPIDAPI_KEY with length:', rapidApiKey.length)
    
    return new Response(
      JSON.stringify({ rapidApiKey: rapidApiKey }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error occurred', 
        message: err instanceof Error ? err.message : String(err)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
