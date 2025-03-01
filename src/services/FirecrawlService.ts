
import { supabase } from '@/lib/supabase';

interface AmazonProduct {
  title: string;
  price: string;
  rating: string;
  reviews: string;
  image: string;
}

export class FirecrawlService {
  private static rapidApiKey: string | null = null;
  private static rapidApiHost: string = 'real-time-amazon-data.p.rapidapi.com';

  static async initialize() {
    try {
      const { data: credentials } = await supabase.rpc('get_secrets', {
        secret_names: ['RAPIDAPI_KEY']
      });
      
      if (credentials?.RAPIDAPI_KEY) {
        this.rapidApiKey = credentials.RAPIDAPI_KEY;
        console.log('RapidAPI service initialized successfully with key:', this.rapidApiKey.substring(0, 4) + '...');
        return true;
      }
      console.warn('RapidAPI key not found in Supabase secrets');
      return false;
    } catch (error) {
      console.error('Error initializing RapidAPI service:', error);
      return false;
    }
  }

  static async crawlAmazonProduct(searchTerm: string): Promise<{ success: boolean; error?: string; data?: AmazonProduct[] }> {
    if (!this.rapidApiKey) {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'RapidAPI credentials not initialized' };
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw RapidAPI response status:', data.status || 'Unknown');
      
      if (!data.data || !data.data.products) {
        return { 
          success: false, 
          error: 'Failed to fetch Amazon products' 
        };
      }

      // Parse the products from the response
      const products: AmazonProduct[] = data.data.products.map((item: any) => ({
        title: item.title || 'N/A',
        price: item.price?.current_price || item.price || 'N/A',
        rating: item.rating || 'N/A',
        reviews: item.reviews_count || '0',
        image: item.thumbnail || item.image || ''
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
