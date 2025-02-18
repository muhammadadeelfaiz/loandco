
import FirecrawlApp from '@mendable/firecrawl-js';
import { supabase } from '@/lib/supabase';

interface ErrorResponse {
  success: false;
  error: string;
}

interface CrawlStatusResponse {
  success: true;
  status: string;
  completed: number;
  total: number;
  creditsUsed: number;
  expiresAt: string;
  data: any[];
}

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

export class FirecrawlService {
  private static firecrawlApp: FirecrawlApp | null = null;

  static async initialize() {
    try {
      const { data: { secret } } = await supabase.rpc('get_secret', {
        secret_name: 'FIRECRAWL_API_KEY'
      });
      
      if (secret) {
        this.firecrawlApp = new FirecrawlApp({ apiKey: secret });
        console.log('FirecrawlService initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing FirecrawlService:', error);
    }
  }

  static async crawlAmazonProduct(searchTerm: string): Promise<{ success: boolean; error?: string; data?: any }> {
    if (!this.firecrawlApp) {
      await this.initialize();
      if (!this.firecrawlApp) {
        return { success: false, error: 'Firecrawl not initialized' };
      }
    }

    try {
      const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchTerm)}`;
      console.log('Making crawl request to Firecrawl API for:', amazonUrl);

      const crawlResponse = await this.firecrawlApp.crawlUrl(amazonUrl, {
        limit: 10,
        scrapeOptions: {
          selectors: {
            title: 'h2 a.a-link-normal.a-text-normal',
            price: 'span.a-price-whole',
            rating: 'span.a-icon-alt',
            reviews: 'span.a-size-base.s-underline-text',
            image: 'img.s-image',
          },
          formats: ['json']
        }
      }) as CrawlResponse;

      if (!crawlResponse.success) {
        console.error('Crawl failed:', (crawlResponse as ErrorResponse).error);
        return { 
          success: false, 
          error: (crawlResponse as ErrorResponse).error || 'Failed to crawl Amazon' 
        };
      }

      console.log('Crawl successful:', crawlResponse);
      return { 
        success: true,
        data: crawlResponse.data 
      };
    } catch (error) {
      console.error('Error during crawl:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' 
      };
    }
  }
}
