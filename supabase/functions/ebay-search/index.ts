
import { serve } from "https://deno.fresh.run/std@0.177.0/http/server.ts";
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('q');

    if (!searchQuery) {
      return new Response(JSON.stringify({ error: 'Search query is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get eBay credentials from Supabase
    const { data: secrets, error: secretsError } = await supabaseClient.rpc('get_secrets', {
      secret_names: ['EBAY_CLIENT_ID', 'EBAY_CLIENT_SECRET']
    });

    if (secretsError || !secrets?.EBAY_CLIENT_ID || !secrets?.EBAY_CLIENT_SECRET) {
      console.error('Error getting eBay credentials:', secretsError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve eBay credentials' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

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

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to get eBay access token:', tokenData);
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with eBay' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Search eBay products
    const searchUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(searchQuery)}&limit=10`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country=US',
        'Content-Type': 'application/json'
      }
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error('eBay API error:', searchData);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch eBay products' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const products: EbayProduct[] = searchData.itemSummaries?.map((item: any) => ({
      itemId: item.itemId,
      title: item.title,
      price: {
        value: item.price.value,
        currency: item.price.currency
      },
      image: item.image?.imageUrl || '',
      condition: item.condition,
      location: item.itemLocation?.country,
      url: item.itemWebUrl
    })) || [];

    return new Response(
      JSON.stringify({ success: true, data: products }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in eBay search function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
