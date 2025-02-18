
import { supabase } from '@/lib/supabase';

interface OxylabsResponse {
  results: Array<{
    content: string;
    status_code: number;
    url: string;
  }>;
  status: string;
}

export class FirecrawlService {
  private static username: string | null = null;
  private static password: string | null = null;

  static async initialize() {
    try {
      const { data: credentials } = await supabase.rpc('get_secrets', {
        secret_names: ['OXYLABS_USERNAME', 'OXYLABS_API_KEY']
      });
      
      if (credentials?.OXYLABS_USERNAME && credentials?.OXYLABS_API_KEY) {
        this.username = credentials.OXYLABS_USERNAME;
        this.password = credentials.OXYLABS_API_KEY;
        console.log('Oxylabs service initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing Oxylabs service:', error);
    }
  }

  static async crawlAmazonProduct(searchTerm: string): Promise<{ success: boolean; error?: string; data?: any }> {
    if (!this.username || !this.password) {
      await this.initialize();
      if (!this.username || !this.password) {
        return { success: false, error: 'Oxylabs credentials not initialized' };
      }
    }

    try {
      const body = {
        source: 'amazon_search',
        query: searchTerm,
        parse: true,
        context: [
          { key: "domain", value: "com" }
        ],
        start_page: 1,
        pages: 1
      };

      console.log('Making request to Oxylabs with body:', body);

      const response = await fetch('https://realtime.oxylabs.io/v1/queries', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`)
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as OxylabsResponse;
      console.log('Raw Oxylabs response:', data);
      
      if (data.status === 'error') {
        return { 
          success: false, 
          error: 'Failed to crawl Amazon' 
        };
      }

      // Parse the content from the response
      const products = data.results.map(result => {
        try {
          const content = JSON.parse(result.content);
          return content.results.map((item: any) => ({
            title: item.title || 'N/A',
            price: item.price?.current_price || 'N/A',
            rating: item.rating || 'N/A',
            reviews: item.reviews_count || '0',
            image: item.image || ''
          }));
        } catch (error) {
          console.error('Error parsing product data:', error);
          return [];
        }
      }).flat();

      console.log('Parsed products:', products);
      return { 
        success: true,
        data: products 
      };
    } catch (error) {
      console.error('Error during crawl:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Oxylabs API' 
      };
    }
  }
}
