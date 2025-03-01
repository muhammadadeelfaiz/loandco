
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Fetching RAPIDAPI_KEY from secrets')
    const { data, error } = await supabase.rpc('get_secrets', {
      secret_names: ['RAPIDAPI_KEY']
    })

    if (error) {
      console.error('Error fetching secret:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch API key' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!data || !data.RAPIDAPI_KEY) {
      console.error('RAPIDAPI_KEY not found in secrets')
      return new Response(
        JSON.stringify({ error: 'RAPIDAPI_KEY not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    console.log('Successfully retrieved RAPIDAPI_KEY')
    return new Response(
      JSON.stringify({ rapidApiKey: data.RAPIDAPI_KEY }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
