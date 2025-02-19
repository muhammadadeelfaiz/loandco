
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
      const { data: credentials } = await supabase.rpc('get_secrets', {
        secret_names: ['EBAY_CLIENT_ID', 'EBAY_CLIENT_SECRET']
      });
      
      if (credentials?.EBAY_CLIENT_ID && credentials?.EBAY_CLIENT_SECRET) {
        console.log('eBay credentials retrieved successfully');
        return credentials as EbayCredentials;
      }
      console.error('eBay credentials not found in Supabase');
      return null;
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
        throw new Error('eBay credentials not found');
      }

      const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${credentials.EBAY_CLIENT_ID}:${credentials.EBAY_CLIENT_SECRET}`)
        },
        body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get eBay access token:', errorText);
        throw new Error('Failed to get eBay access token');
      }

      const data = await response.json();
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
          error: 'Failed to authenticate with eBay' 
        };
      }

      const response = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
          'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country=US',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('eBay API error:', errorText);
        throw new Error('Failed to fetch eBay products');
      }

      const data = await response.json();
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
