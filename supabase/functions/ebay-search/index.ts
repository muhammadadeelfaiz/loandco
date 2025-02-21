
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EbayProduct {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  image: string;
  condition: string;
  location: string;
  url: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    console.log('Edge Function received search query:', query);

    if (!query) {
      console.error('No search query provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Search query is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Attempting to fetch eBay credentials from Supabase secrets...');

    // Get eBay credentials from Supabase secrets
    const { data: secrets, error: secretsError } = await supabaseClient.rpc('get_secrets', {
      secret_names: ['EBAY_CLIENT_ID', 'EBAY_CLIENT_SECRET']
    });

    console.log('get_secrets response:', {
      hasData: !!secrets,
      hasError: !!secretsError,
      secretsKeys: secrets ? Object.keys(secrets) : [],
      errorMessage: secretsError?.message
    });

    if (secretsError || !secrets?.EBAY_CLIENT_ID || !secrets?.EBAY_CLIENT_SECRET) {
      console.error('Error getting eBay credentials:', secretsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to retrieve eBay credentials',
          details: secretsError?.message || 'Missing required credentials'
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Successfully retrieved eBay credentials, requesting access token...');

    // Get eBay access token
    const tokenResponse = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${secrets.EBAY_CLIENT_ID}:${secrets.EBAY_CLIENT_SECRET}`)}`
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });

    const tokenData = await tokenResponse.json();

    console.log('Token response status:', tokenResponse.status);
    console.log('Token response type:', {
      hasAccessToken: !!tokenData.access_token,
      errorDescription: tokenData.error_description
    });

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to get eBay access token:', tokenData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to authenticate with eBay',
          details: tokenData.error_description || tokenResponse.statusText
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Successfully obtained eBay access token, making search request...');

    // Search eBay products
    const searchUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=10`;
    console.log('Making eBay API request to:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country=US',
        'Content-Type': 'application/json'
      }
    });

    const searchData = await searchResponse.json();

    console.log('Search response status:', searchResponse.status);
    console.log('Search response type:', {
      hasItems: !!searchData.itemSummaries,
      itemCount: searchData.itemSummaries?.length || 0,
      errorMessage: searchData.errors?.[0]?.message
    });

    if (!searchResponse.ok) {
      console.error('eBay API error:', searchData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch eBay products',
          details: searchData.errors?.[0]?.message || searchResponse.statusText
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Successfully received eBay search results');

    const products: EbayProduct[] = searchData.itemSummaries?.map((item: any) => ({
      itemId: item.itemId,
      title: item.title,
      price: {
        value: item.price.value,
        currency: item.price.currency
      },
      image: item.image?.imageUrl || '',
      condition: item.condition,
      location: item.itemLocation?.country || 'Unknown',
      url: item.itemWebUrl
    })) || [];

    console.log(`Found ${products.length} products from eBay`);

    return new Response(
      JSON.stringify({ success: true, data: products }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in eBay search function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
