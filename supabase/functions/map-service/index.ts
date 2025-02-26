
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
    // Get required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables');
      throw new Error('Server configuration error');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Attempting to fetch Mapbox token from secrets...');
    
    const { data: secrets, error: secretsError } = await supabase.rpc('get_secrets', {
      secret_names: ['MAPBOX_PUBLIC_TOKEN']
    });

    if (secretsError) {
      console.error('Failed to fetch secrets:', secretsError);
      throw new Error('Failed to fetch map configuration');
    }

    const token = secrets?.MAPBOX_PUBLIC_TOKEN;
    
    if (!token) {
      console.error('MAPBOX_PUBLIC_TOKEN not found in secrets');
      throw new Error('Map configuration is missing');
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
    console.error('Map service error:', error.message);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to initialize map service',
        details: error.message
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
