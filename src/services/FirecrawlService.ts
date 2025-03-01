
import FirecrawlAPI from '@mendable/firecrawl-js';
import { supabase } from '@/lib/supabase';

interface CrawlResponse {
  success: boolean;
  data?: any[];
  error?: string;
}

export class FirecrawlService {
  private static firecrawlClient: FirecrawlAPI | null = null;
  private static initializationInProgress = false;
  private static lastInitAttempt = 0;
  private static INIT_COOLDOWN = 5000; // 5 seconds cooldown between init attempts

  static async initialize(): Promise<boolean> {
    // If we already have a client, return true
    if (this.firecrawlClient) {
      return true;
    }

    // Don't try to initialize too frequently
    const now = Date.now();
    if (this.initializationInProgress || now - this.lastInitAttempt < this.INIT_COOLDOWN) {
      console.info("Initialization already in progress or attempted recently");
      return false;
    }

    this.initializationInProgress = true;
    this.lastInitAttempt = now;

    try {
      console.info("Initializing RapidAPI service, fetching key from Supabase secrets...");
      
      // Fetch the RapidAPI key from Supabase Edge Functions
      const { data, error } = await supabase.rpc('get_secrets', {
        secret_names: ['RAPIDAPI_KEY']
      });

      if (error) {
        console.error("Error fetching RapidAPI key from Supabase:", error);
        return false;
      }

      const rapidApiKey = data?.RAPIDAPI_KEY;

      if (!rapidApiKey) {
        console.error("RapidAPI key not found in Supabase secrets. Make sure the key is set with name \"RAPIDAPI_KEY\"");
        return false;
      }

      this.firecrawlClient = new FirecrawlAPI(rapidApiKey);
      return true;
    } catch (error) {
      console.error("Error initializing FirecrawlAPI:", error);
      return false;
    } finally {
      this.initializationInProgress = false;
    }
  }

  static async crawlAmazonProduct(query: string): Promise<CrawlResponse> {
    try {
      const isInitialized = await this.initialize();
      if (!isInitialized || !this.firecrawlClient) {
        return {
          success: false,
          error: "RapidAPI credentials not initialized. Please check that the RAPIDAPI_KEY secret is set in Supabase."
        };
      }

      // Use the searchAmazon method instead of crawlAmazonSearch
      const response = await this.firecrawlClient.searchAmazon(query, "US", 10);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error("Error crawling Amazon product:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}
