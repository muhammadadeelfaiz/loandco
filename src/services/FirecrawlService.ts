
import { supabase } from '@/lib/supabase';
import { toast } from "@/components/ui/use-toast";

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
  private static quotaExceeded = false;

  static async resetApiKeyCache(): Promise<void> {
    console.log("Resetting RapidAPI key cache");
    this.rapidApiKey = null;
    this.retryCount = 0;
    this.quotaExceeded = false;
  }

  static async saveApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log("Saving new RapidAPI key");
      
      // Call the Supabase Edge Function to update the API key
      const response = await supabase.functions.invoke('get-rapidapi-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { apiKey: "1f98c121c7mshd020b5c989dcde0p19e810jsn206cf8a3609d" },
      });
      
      if (response.error) {
        console.error("Error saving RapidAPI key:", response.error);
        toast({
          title: "Error",
          description: `Failed to save RapidAPI key: ${response.error.message}`,
          variant: "destructive"
        });
        return false;
      }
      
      // Reset our cache and use the new key
      await this.resetApiKeyCache();
      this.rapidApiKey = apiKey;
      
      toast({
        title: "Success",
        description: "API key saved successfully."
      });
      return true;
    } catch (error) {
      console.error("Error saving RapidAPI key:", error);
      toast({
        title: "Error",
        description: "Failed to save RapidAPI key",
        variant: "destructive"
      });
      return false;
    }
  }

  static async initialize(): Promise<boolean> {
    // If we already have a key, return true
    if (this.rapidApiKey) {
      console.log("Using cached RapidAPI key with length:", this.rapidApiKey.length);
      return true;
    }

    // If we've already determined we've exceeded quota, don't try again
    if (this.quotaExceeded) {
      console.log("API quota already marked as exceeded, returning false");
      return false;
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
      console.log("Calling get-rapidapi-key edge function...");
      const response = await supabase.functions.invoke('get-rapidapi-key', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("Edge function response received:", response);

      // Check for errors in the response
      if (response.error) {
        console.error("Error invoking get-rapidapi-key function:", response.error);
        toast({
          title: "API Key Error",
          description: `Failed to retrieve RapidAPI key: ${response.error.message}`,
          variant: "destructive"
        });
        
        if (this.retryCount < this.MAX_RETRIES) {
          console.info(`Will retry in ${this.INIT_COOLDOWN/1000} seconds...`);
          setTimeout(() => this.retryCount--, this.INIT_COOLDOWN); // Reset retry counter after cooldown
        }
        return false;
      }

      const data = response.data;
      console.log("Edge function data:", data);

      // Enhanced error checking for the response
      if (!data) {
        console.error("Null or undefined response from edge function");
        toast({
          title: "API Key Error",
          description: "Empty response from RapidAPI key endpoint.",
          variant: "destructive"
        });
        return false;
      }

      if (data.error) {
        console.error("Error in edge function response:", data.error);
        toast({
          title: "API Key Error",
          description: data.error,
          variant: "destructive"
        });
        return false;
      }

      // Explicitly check if keyFound is false
      if (data.keyFound === false) {
        console.error("Edge function reported key not found");
        toast({
          title: "API Key Missing",
          description: "RAPIDAPI_KEY is not set in Supabase Edge Function Secrets",
          variant: "destructive"
        });
        return false;
      }

      // Check if we have data and it contains rapidApiKey
      if (typeof data.rapidApiKey !== 'string') {
        console.error("Invalid response from edge function. Response:", data);
        toast({
          title: "API Key Error",
          description: "Invalid response format from RapidAPI key endpoint.",
          variant: "destructive"
        });
        return false;
      }

      const rapidApiKey = data.rapidApiKey;
      console.log("Key length from edge function:", data.keyLength || 'unknown');

      if (!rapidApiKey || rapidApiKey.length < 10) { // Basic validation - API keys are typically longer than 10 chars
        console.error("RapidAPI key appears to be invalid or missing. Length:", rapidApiKey ? rapidApiKey.length : 0);
        toast({
          title: "API Key Error",
          description: "RapidAPI key appears to be invalid or missing. Please check Supabase Edge Function Secrets.",
          variant: "destructive"
        });
        return false;
      }

      console.info("Successfully retrieved RapidAPI key with length:", rapidApiKey.length);
      this.rapidApiKey = rapidApiKey;
      this.retryCount = 0; // Reset retry counter on success
      return true;
    } catch (error) {
      console.error("Error initializing RapidAPI:", error);
      toast({
        title: "API Key Error",
        description: "Error connecting to API key service.",
        variant: "destructive"
      });
      return false;
    } finally {
      this.initializationInProgress = false;
    }
  }

  static async crawlAmazonProduct(query: string): Promise<CrawlResponse> {
    try {
      // If quota already exceeded, return early
      if (this.quotaExceeded) {
        return {
          success: false,
          error: "Monthly quota exceeded for the Amazon product search API. Please try again later."
        };
      }
      
      // Instead of directly setting the rapidApiKey to null, use our new method
      await this.resetApiKeyCache();
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
        
        // Check for quota exceeded errors (429 status code)
        if (response.status === 429) {
          console.warn("Received 429 Too Many Requests from RapidAPI. Full error:", errorText);
          
          // Set the quota exceeded flag
          this.quotaExceeded = true;
          
          // This is a special error we want to display differently to users
          return {
            success: false,
            error: "Monthly API quota exceeded. We've temporarily disabled Amazon product search to prevent additional charges. Please try again later."
          };
        }
        
        // Check for common API errors
        if (response.status === 403) {
          console.warn("Received 403 Forbidden from RapidAPI. Full error:", errorText);
          
          if (errorText.includes("not subscribed")) {
            // Clear the key as it's not valid for this API
            this.rapidApiKey = null;
            toast({
              title: "API Subscription Required",
              description: "You need to subscribe to the Real Time Amazon Data API on RapidAPI.",
              variant: "destructive"
            });
            return {
              success: false,
              error: "You need to subscribe to the Real Time Amazon Data API on RapidAPI. Please visit RapidAPI and subscribe to the service."
            };
          } else if (errorText.includes("exceeded the MONTHLY quota")) {
            this.quotaExceeded = true;
            toast({
              title: "API Quota Exceeded",
              description: "You have exceeded your monthly quota for the Amazon Data API.",
              variant: "destructive"
            });
            return {
              success: false,
              error: "You have exceeded your monthly quota for the Real Time Amazon Data API on RapidAPI."
            };
          } else if (errorText.includes("exceeded the DAILY quota")) {
            toast({
              title: "API Quota Exceeded",
              description: "You have exceeded your daily quota for the Amazon Data API.",
              variant: "destructive"
            });
            return {
              success: false,
              error: "You have exceeded your daily quota for the Real Time Amazon Data API on RapidAPI."
            };
          } else if (errorText.includes("exceeded the rate limit")) {
            toast({
              title: "API Rate Limit",
              description: "Rate limit exceeded. Please try again later.",
              variant: "destructive"
            });
            return {
              success: false,
              error: "You have exceeded the rate limit for the Real Time Amazon Data API on RapidAPI. Please try again later."
            };
          }
          
          // Generic access denied message
          toast({
            title: "API Access Denied",
            description: "Access denied by RapidAPI. Check your subscription status.",
            variant: "destructive"
          });
          return {
            success: false,
            error: "Access denied by RapidAPI. Please check your subscription status for the Real Time Amazon Data API."
          };
        }
        
        toast({
          title: "API Request Failed",
          description: `Failed with status: ${response.status}`,
          variant: "destructive"
        });
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
      toast({
        title: "Amazon Search Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  // New method for searching Amazon products for homepage
  static async getAmazonProductsForHomepage(searchTerm: string): Promise<any[]> {
    try {
      // If quota already exceeded, return early with empty array
      if (this.quotaExceeded) {
        console.log("API quota exceeded, returning empty results for homepage");
        return [];
      }
      
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
  
  // Helper method to check if quota is exceeded
  static isQuotaExceeded(): boolean {
    return this.quotaExceeded;
  }
  
  // Method to reset quota exceeded status (for testing or after time period)
  static resetQuotaExceeded(): void {
    this.quotaExceeded = false;
  }
}
