
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
  private static readonly TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
  private static readonly API_URL = 'https://api.ebay.com/buy/browse/v1';

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

      // Add more detailed logging
      console.log('Credentials retrieved:', {
        hasData: !!data,
        rawData: data,
        credentialsKeys: data ? Object.keys(data) : [],
        clientIdExists: 'EBAY_CLIENT_ID' in (data || {}),
        clientSecretExists: 'EBAY_CLIENT_SECRET' in (data || {})
      });

      if (!data || typeof data !== 'object') {
        console.error('Invalid data format received from get_secrets');
        return null;
      }

      if (!data.EBAY_CLIENT_ID || !data.EBAY_CLIENT_SECRET || 
          typeof data.EBAY_CLIENT_ID !== 'string' || typeof data.EBAY_CLIENT_SECRET !== 'string') {
        console.error('eBay credentials are incomplete or invalid');
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
      if (this.accessToken && Date.now() < this.tokenExpiration) {
        console.log('Using existing eBay access token');
        return this.accessToken;
      }

      console.log('Getting new eBay access token...');
      const credentials = await this.getCredentials();
      if (!credentials) {
        throw new Error('eBay credentials not found or incomplete');
      }

      const authString = btoa(`${credentials.EBAY_CLIENT_ID}:${credentials.EBAY_CLIENT_SECRET}`);
      console.log('Making eBay token request to:', this.TOKEN_URL);
      console.log('Auth string length:', authString.length);

      const response = await fetch(this.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authString}`
        },
        body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
      });

      const data = await response.json();
      console.log('eBay token response:', {
        status: response.status,
        statusText: response.statusText,
        hasAccessToken: !!data.access_token,
        expiresIn: data.expires_in,
        error: data.error,
        errorDescription: data.error_description
      });

      if (!response.ok) {
        console.error('Failed to get eBay access token. Full response:', data);
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

      const searchUrl = `${this.API_URL}/item_summary/search?q=${encodeURIComponent(query)}&limit=10`;
      console.log('Making eBay search request to:', searchUrl);

      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
          'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country=US',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('eBay search response:', {
        status: response.status,
        statusText: response.statusText,
        hasError: !!data.errors,
        errorMessage: data.errors?.[0]?.message,
        totalResults: data.total,
        itemCount: data.itemSummaries?.length || 0
      });

      if (!response.ok) {
        console.error('eBay API error:', data);
        throw new Error(data.errors?.[0]?.message || 'Failed to fetch eBay products');
      }

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
