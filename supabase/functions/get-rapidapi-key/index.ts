
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Retrieving RAPIDAPI_KEY from Supabase secrets...')
    
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase URL or Service Role Key')
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error - missing Supabase credentials' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get the API key from Supabase secrets
    const { data, error } = await supabase.functions.secret.get('RAPIDAPI_KEY')
    
    if (error) {
      console.error('Error retrieving RAPIDAPI_KEY:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to retrieve RAPIDAPI_KEY from secrets',
          details: error.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }
    
    if (!data || !data.value) {
      console.error('RAPIDAPI_KEY not found in secrets or is empty')
      return new Response(
        JSON.stringify({ 
          error: 'RAPIDAPI_KEY not found in Supabase secrets or is empty' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }
    
    console.log('RAPIDAPI_KEY retrieved successfully with length:', data.value.length)
    
    // Return the API key
    return new Response(
      JSON.stringify({ 
        rapidApiKey: data.value,
        keyLength: data.value.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (err) {
    console.error('Unexpected error in get-rapidapi-key function:', err)
    return new Response(
      JSON.stringify({ 
        error: 'Server error',
        details: err.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
