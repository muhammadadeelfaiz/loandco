
import { supabase } from '@/lib/supabase';

interface CrawlResponse {
  success: boolean;
  data?: any[];
  error?: string;
}

export class FirecrawlService {
  private static rapidApiKey: string | null = null;
  private static initializationInProgress = false;
  private static lastInitAttempt = 0;
  private static INIT_COOLDOWN = 5000; // 5 seconds cooldown between init attempts

  static async initialize(): Promise<boolean> {
    // If we already have a key, return true
    if (this.rapidApiKey) {
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

      const rapidApiKey = data?.rapidApiKey;

      if (!rapidApiKey) {
        console.error("RapidAPI key not found in response. Response:", data);
        return false;
      }

      console.info("Successfully retrieved RapidAPI key");
      this.rapidApiKey = rapidApiKey;
      return true;
    } catch (error) {
      console.error("Error initializing RapidAPI:", error);
      return false;
    } finally {
      this.initializationInProgress = false;
    }
  }

  static async crawlAmazonProduct(query: string): Promise<CrawlResponse> {
    try {
      const isInitialized = await this.initialize();
      if (!isInitialized || !this.rapidApiKey) {
        return {
          success: false,
          error: "RapidAPI credentials not initialized. Please check that the RAPIDAPI_KEY secret is set in Supabase."
        };
      }

      console.log("Sending Amazon product search request with query:", query);

      // Make a direct API call to RapidAPI's Amazon Search endpoint
      const response = await fetch('https://amazon-web-scraper-api.p.rapidapi.com/products/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'amazon-web-scraper-api.p.rapidapi.com'
        },
        body: JSON.stringify({
          query: query,
          region: 'US',
          page: 1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`RapidAPI request failed with status: ${response.status}`, errorText);
        throw new Error(`RapidAPI request failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Amazon search results:", data);

      return {
        success: true,
        data: data.results || []
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
