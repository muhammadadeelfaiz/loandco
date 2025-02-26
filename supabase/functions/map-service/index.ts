
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Map service function called');
    
    // Initialize Supabase client directly with environment variables
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching Mapbox token...');
    const { data: secrets, error: secretsError } = await supabase.rpc('get_secrets', {
      secret_names: ['MAPBOX_PUBLIC_TOKEN']
    });

    if (secretsError) {
      console.error('Error fetching secrets:', secretsError);
      throw new Error('Failed to fetch secrets');
    }

    const token = secrets?.MAPBOX_PUBLIC_TOKEN;
    
    if (!token) {
      console.error('MAPBOX_PUBLIC_TOKEN not found in secrets');
      throw new Error('Mapbox token not found');
    }

    console.log('Successfully retrieved Mapbox token');
    
    return new Response(
      JSON.stringify({ token }), 
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Map service error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }), 
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});
