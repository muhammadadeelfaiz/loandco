
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
      const { data, error } = await supabase.functions.invoke('get-rapidapi-key', {
        method: 'GET',
      });

      if (error) {
        console.error("Error invoking get-rapidapi-key function:", error);
        return false;
      }

      console.log("API key response:", data); // This will help debug the response format

      const rapidApiKey = data?.rapidApiKey;

      if (!rapidApiKey) {
        console.error("RapidAPI key not found in response. Response:", data);
        return false;
      }

      console.info("Successfully retrieved RapidAPI key");
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

      // Using the correct method from FirecrawlAPI
      const response = await this.firecrawlClient.amazon.search(query, "US", 10);
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
