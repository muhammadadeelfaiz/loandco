
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
  private static MAX_RETRIES = 3;
  private static retryCount = 0;

  static async initialize(): Promise<boolean> {
    // If we already have a key, return true
    if (this.rapidApiKey) {
      return true;
    }

    // Don't try to initialize too frequently
    const now = Date.now();
    if (this.initializationInProgress || (now - this.lastInitAttempt < this.INIT_COOLDOWN && this.retryCount > 0)) {
      console.info("Initialization already in progress or attempted recently");
      return false;
    }

    this.initializationInProgress = true;
    this.lastInitAttempt = now;
    this.retryCount++;

    try {
      console.info(`Initializing RapidAPI service, fetching key from Supabase edge function... (Attempt ${this.retryCount}/${this.MAX_RETRIES})`);
      
      // Force-clear any previous key in case it was invalid
      this.rapidApiKey = null;
      
      // Fetch the RapidAPI key from Supabase Edge Functions
      const { data, error } = await supabase.functions.invoke('get-rapidapi-key', {
        method: 'GET',
      });

      if (error) {
        console.error("Error invoking get-rapidapi-key function:", error);
        if (this.retryCount < this.MAX_RETRIES) {
          console.info(`Will retry in ${this.INIT_COOLDOWN/1000} seconds...`);
          setTimeout(() => this.retryCount--, this.INIT_COOLDOWN); // Reset retry counter after cooldown
        }
        return false;
      }

      const rapidApiKey = data?.rapidApiKey;

      if (!rapidApiKey) {
        console.error("RapidAPI key not found in response. Response:", data);
        return false;
      }

      console.info("Successfully retrieved RapidAPI key with length:", rapidApiKey.length);
      this.rapidApiKey = rapidApiKey;
      this.retryCount = 0; // Reset retry counter on success
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
      // Force re-initialization every time to ensure we have the latest key
      this.rapidApiKey = null;
      const isInitialized = await this.initialize();
      
      if (!isInitialized || !this.rapidApiKey) {
        return {
          success: false,
          error: "RapidAPI credentials not initialized. Please check that the RAPIDAPI_KEY secret is set in Supabase Edge Function Secrets."
        };
      }

      console.log("Making request to Amazon API with key length:", this.rapidApiKey.length);
      console.log("Using host: real-time-amazon-data.p.rapidapi.com");
      
      // Make a direct API call to RapidAPI's Amazon Search endpoint with the correct endpoint
      const url = new URL('https://real-time-amazon-data.p.rapidapi.com/amazon-search');
      url.searchParams.append('query', query);
      url.searchParams.append('page', '1');
      url.searchParams.append('country', 'US');
      url.searchParams.append('category_id', 'aps');
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`RapidAPI request failed with status: ${response.status}`, errorText);
        
        // Check for common API errors
        if (response.status === 403) {
          console.warn("Received 403 Forbidden from RapidAPI. Full error:", errorText);
          
          if (errorText.includes("not subscribed")) {
            // Clear the key as it's not valid for this API
            this.rapidApiKey = null;
            return {
              success: false,
              error: "You need to subscribe to the Real Time Amazon Data API on RapidAPI. Please visit RapidAPI and subscribe to the service."
            };
          } else if (errorText.includes("exceeded the MONTHLY quota")) {
            return {
              success: false,
              error: "You have exceeded your monthly quota for the Real Time Amazon Data API on RapidAPI."
            };
          } else if (errorText.includes("exceeded the DAILY quota")) {
            return {
              success: false,
              error: "You have exceeded your daily quota for the Real Time Amazon Data API on RapidAPI."
            };
          } else if (errorText.includes("exceeded the rate limit")) {
            return {
              success: false,
              error: "You have exceeded the rate limit for the Real Time Amazon Data API on RapidAPI. Please try again later."
            };
          }
          
          // Generic access denied message
          return {
            success: false,
            error: "Access denied by RapidAPI. Please check your subscription status for the Real Time Amazon Data API."
          };
        }
        
        return {
          success: false,
          error: `RapidAPI request failed with status: ${response.status}`
        };
      }

      const data = await response.json();
      console.log("Amazon search results:", data);

      // Map the response structure to our expected format
      const formattedResults = Array.isArray(data.data?.results) 
        ? data.data.results.map((product: any) => ({
            title: product.title || product.name || 'Unknown Product',
            price: product.price?.current_price || product.price || 'N/A',
            rating: product.rating || 'N/A',
            reviews: product.reviews_count || '0',
            image: product.thumbnail || product.image || '',
            url: product.url || ''
          }))
        : [];

      return {
        success: true,
        data: formattedResults
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
