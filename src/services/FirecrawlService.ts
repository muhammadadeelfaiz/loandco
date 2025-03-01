
import { supabase } from '@/lib/supabase';

interface AmazonProduct {
  title: string;
  price: string;
  rating: string;
  reviews: string;
  image: string;
  url?: string; // Adding URL to the product model
}

export class FirecrawlService {
  private static rapidApiKey: string | null = null;
  private static rapidApiHost: string = 'real-time-amazon-data.p.rapidapi.com';
  private static isInitializing: boolean = false;
  private static lastInitAttempt: number = 0;

  static async initialize() {
    try {
      // Don't attempt to initialize more than once every 5 seconds
      const now = Date.now();
      if (this.isInitializing || (now - this.lastInitAttempt < 5000 && this.lastInitAttempt > 0)) {
        console.log('Initialization already in progress or attempted recently');
        return !!this.rapidApiKey;
      }

      this.isInitializing = true;
      this.lastInitAttempt = now;
      
      console.log('Initializing RapidAPI service, fetching key from Supabase secrets...');
      
      const { data: credentials, error } = await supabase.rpc('get_secrets', {
        secret_names: ['RAPIDAPI_KEY']
      });
      
      if (error) {
        console.error('Error retrieving RapidAPI key from Supabase:', error);
        this.isInitializing = false;
        return false;
      }
      
      if (!credentials || !credentials.RAPIDAPI_KEY) {
        console.error('RapidAPI key not found in Supabase secrets. Make sure the key is set with name "RAPIDAPI_KEY"');
        this.isInitializing = false;
        return false;
      }
      
      this.rapidApiKey = credentials.RAPIDAPI_KEY;
      console.log('RapidAPI service initialized successfully with key:', this.rapidApiKey.substring(0, 4) + '...');
      this.isInitializing = false;
      return true;
    } catch (error) {
      console.error('Error initializing RapidAPI service:', error);
      this.isInitializing = false;
      return false;
    }
  }

  static async crawlAmazonProduct(searchTerm: string): Promise<{ success: boolean; error?: string; data?: AmazonProduct[] }> {
    if (!this.rapidApiKey) {
      console.log('No API key found, attempting to initialize...');
      const initialized = await this.initialize();
      if (!initialized) {
        return { 
          success: false, 
          error: 'RapidAPI credentials not initialized. Please check that the RAPIDAPI_KEY secret is set in Supabase.' 
        };
      }
    }

    try {
      // Format the search term for the URL
      const formattedSearchTerm = encodeURIComponent(searchTerm);
      
      // Use search endpoint instead of product details
      const url = `https://${this.rapidApiHost}/search?query=${formattedSearchTerm}&country=US`;
      
      console.log('Making request to RapidAPI:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey!,
          'X-RapidAPI-Host': this.rapidApiHost
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, body:`, errorText);
        return { 
          success: false, 
          error: `API Error (${response.status}): ${errorText || 'Unknown error'}` 
        };
      }

      const data = await response.json();
      console.log('Raw RapidAPI response:', data);
      
      if (!data.data || !data.data.products) {
        console.error('Invalid response format:', data);
        return { 
          success: false, 
          error: 'Invalid response format from Amazon API' 
        };
      }

      // Parse the products from the response with more detailed info
      const products: AmazonProduct[] = data.data.products.map((item: any) => ({
        title: item.title || 'N/A',
        price: item.price?.current_price || item.price || 'N/A',
        rating: item.rating || 'N/A',
        reviews: item.reviews_count || '0',
        image: item.thumbnail || item.image || '',
        url: item.url || `https://www.amazon.com/dp/${item.asin}`
      }));

      console.log('Parsed Amazon products:', products.length);
      return { 
        success: true,
        data: products 
      };
    } catch (error) {
      console.error('Error during Amazon search:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to RapidAPI' 
      };
    }
  }
}
