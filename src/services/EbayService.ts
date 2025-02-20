
import { supabase } from '@/lib/supabase';

interface EbayCredentials {
  EBAY_CLIENT_ID: string;
  EBAY_CLIENT_SECRET: string;
}

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

export class EbayService {
  private static accessToken: string | null = null;
  private static tokenExpiration: number = 0;

  private static async getCredentials(): Promise<EbayCredentials | null> {
    try {
      console.log('Fetching eBay credentials from Supabase...');
      const { data, error } = await supabase.rpc('get_secrets', {
        secret_names: ['EBAY_CLIENT_ID', 'EBAY_CLIENT_SECRET']
      });
      
      if (error) {
        console.error('Error fetching eBay credentials:', error);
        return null;
      }

      // Log the raw data for debugging
      console.log('Raw credentials data:', data);

      // Verify both credentials exist and are non-empty strings
      if (!data?.EBAY_CLIENT_ID || !data?.EBAY_CLIENT_SECRET || 
          typeof data.EBAY_CLIENT_ID !== 'string' || typeof data.EBAY_CLIENT_SECRET !== 'string') {
        console.error('eBay credentials are incomplete or invalid:', {
          hasClientId: !!data?.EBAY_CLIENT_ID,
          hasClientSecret: !!data?.EBAY_CLIENT_SECRET,
          clientIdType: typeof data?.EBAY_CLIENT_ID,
          clientSecretType: typeof data?.EBAY_CLIENT_SECRET
        });
        return null;
      }

      console.log('eBay credentials retrieved successfully');
      return {
        EBAY_CLIENT_ID: data.EBAY_CLIENT_ID,
        EBAY_CLIENT_SECRET: data.EBAY_CLIENT_SECRET
      };
    } catch (error) {
      console.error('Error getting eBay credentials:', error);
      return null;
    }
  }

  private static async getAccessToken(): Promise<string | null> {
    try {
      // Check if we have a valid token
      if (this.accessToken && Date.now() < this.tokenExpiration) {
        console.log('Using existing eBay access token');
        return this.accessToken;
      }

      console.log('Getting new eBay access token...');
      const credentials = await this.getCredentials();
      if (!credentials) {
        throw new Error('eBay credentials not found or incomplete');
      }

      const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${credentials.EBAY_CLIENT_ID}:${credentials.EBAY_CLIENT_SECRET}`)
        },
        body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
      });

      const data = await response.json();
      console.log('eBay token response:', data); // Debug log

      if (!response.ok) {
        console.error('Failed to get eBay access token. Response:', data);
        throw new Error(data.error_description || 'Failed to get eBay access token');
      }

      this.accessToken = data.access_token;
      this.tokenExpiration = Date.now() + (data.expires_in * 1000);
      console.log('New eBay access token obtained successfully');
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting eBay access token:', error);
      return null;
    }
  }

  static async searchProducts(query: string): Promise<{ success: boolean; error?: string; data?: EbayProduct[] }> {
    try {
      console.log('Starting eBay product search for query:', query);
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return { 
          success: false, 
          error: 'Unable to authenticate with eBay. Please check your API credentials.' 
        };
      }

      const response = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
          'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country=US',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('eBay API error:', data);
        throw new Error(data.errors?.[0]?.message || 'Failed to fetch eBay products');
      }

      console.log('eBay API response:', data);

      const products = data.itemSummaries?.map((item: any) => ({
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

      console.log('Processed eBay products:', products);

      return {
        success: true,
        data: products
      };
    } catch (error) {
      console.error('Error searching eBay products:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search eBay products'
      };
    }
  }
}
