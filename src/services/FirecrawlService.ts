
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
      
      // Fetch the RapidAPI key from Supabase Edge Functions with explicit timeout
      const { data, error } = await supabase.functions.invoke('get-rapidapi-key', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        console.error("Error invoking get-rapidapi-key function:", error);
        if (this.retryCount < this.MAX_RETRIES) {
          console.info(`Will retry in ${this.INIT_COOLDOWN/1000} seconds...`);
          setTimeout(() => this.retryCount--, this.INIT_COOLDOWN); // Reset retry counter after cooldown
        }
        return false;
      }

      // Check if we have data and it contains rapidApiKey
      if (!data || typeof data.rapidApiKey !== 'string') {
        console.error("Invalid response from edge function. Response:", data);
        return false;
      }

      const rapidApiKey = data.rapidApiKey;

      if (!rapidApiKey || rapidApiKey.length < 10) { // Basic validation - API keys are typically longer than 10 chars
        console.error("RapidAPI key appears to be invalid or missing. Length:", rapidApiKey ? rapidApiKey.length : 0);
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
      
      // Make a direct API call to RapidAPI's Amazon Search endpoint
      const url = new URL('https://real-time-amazon-data.p.rapidapi.com/search');
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
      // Updated to correctly handle the API response structure
      if (data.status === "OK" && data.data && data.data.products && Array.isArray(data.data.products)) {
        const formattedResults = data.data.products.map((product: any) => ({
          title: product.product_title || 'Unknown Product',
          price: product.product_price || product.product_original_price || 'N/A',
          rating: product.product_star_rating || 'N/A',
          reviews: product.product_num_ratings ? product.product_num_ratings.toString() : '0',
          image: product.product_photo || '',
          url: product.product_url ? 
                (product.product_url.startsWith('http') ? 
                  product.product_url : 
                  `https://www.amazon.com${product.product_url}`) : 
                undefined
        }));

        return {
          success: true,
          data: formattedResults
        };
      }

      // If we reached here, the API returned a successful response but with no products
      return {
        success: true,
        data: [] // Return empty array instead of error
      };
    } catch (error) {
      console.error("Error crawling Amazon product:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  // New method for searching Amazon products for homepage
  static async getAmazonProductsForHomepage(searchTerm: string): Promise<any[]> {
    try {
      console.log('Fetching Amazon products for homepage with term:', searchTerm);
      const result = await this.crawlAmazonProduct(searchTerm);
      
      if (!result.success || !result.data) {
        console.warn('Failed to fetch Amazon products for homepage:', result.error);
        return [];
      }
      
      return result.data.slice(0, 4); // Limit to 4 products for homepage
    } catch (error) {
      console.error('Error fetching Amazon products for homepage:', error);
      return [];
    }
  }
}
