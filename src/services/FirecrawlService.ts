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
    this.initializationInProgress = false;
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log("Testing RapidAPI key validity");
      
      // Simple test call to the API with minimal parameters
      const url = new URL('https://real-time-amazon-data.p.rapidapi.com/search');
      url.searchParams.append('query', 'test');
      url.searchParams.append('page', '1');
      url.searchParams.append('country', 'AE'); // Using AE for UAE
      url.searchParams.append('category_id', 'aps');
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
        }
      });

      console.log("API key test response status:", response.status);
      
      if (response.status === 200) {
        console.log("API key test successful");
        const data = await response.json();
        console.log("Test response data:", data);
        return true;
      }
      
      // Log specific error conditions
      if (response.status === 403) {
        const responseText = await response.text();
        console.error("API key test failed with 403 Forbidden:", responseText);
        
        if (responseText.includes("not subscribed")) {
          toast({
            title: "Subscription Required",
            description: "You need to subscribe to the Real Time Amazon Data API on RapidAPI.",
            variant: "destructive"
          });
        }
      }
      
      console.error("API key test failed with status:", response.status);
      return false;
    } catch (error) {
      console.error("Error testing API key:", error);
      return false;
    }
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
        body: { apiKey },
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
      
      // Fetch the RapidAPI key from Supabase Edge Functions
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
        
        this.initializationInProgress = false;
        if (this.retryCount < this.MAX_RETRIES) {
          console.info(`Will retry in ${this.INIT_COOLDOWN/1000} seconds...`);
          setTimeout(() => this.initializationInProgress = false, this.INIT_COOLDOWN);
        }
        return false;
      }

      const data = response.data;
      console.log("Edge function data:", data);

      // Enhanced error checking for the response
      if (!data) {
        console.error("Null or undefined response from edge function");
        this.initializationInProgress = false;
        return false;
      }

      if (data.error) {
        console.error("Error in edge function response:", data.error);
        this.initializationInProgress = false;
        return false;
      }

      // Explicitly check if keyFound is false
      if (data.keyFound === false) {
        console.error("Edge function reported key not found");
        this.initializationInProgress = false;
        return false;
      }

      // Check if we have data and it contains rapidApiKey
      if (typeof data.rapidApiKey !== 'string') {
        console.error("Invalid response from edge function. Response:", data);
        this.initializationInProgress = false;
        return false;
      }

      const rapidApiKey = data.rapidApiKey;
      console.log("Key length from edge function:", data.keyLength || 'unknown');

      if (!rapidApiKey || rapidApiKey.length < 10) {
        console.error("RapidAPI key appears to be invalid or missing. Length:", rapidApiKey ? rapidApiKey.length : 0);
        this.initializationInProgress = false;
        return false;
      }

      console.info("Successfully retrieved RapidAPI key with length:", rapidApiKey.length);
      this.rapidApiKey = rapidApiKey;
      this.retryCount = 0; // Reset retry counter on success
      this.initializationInProgress = false;
      return true;
    } catch (error) {
      console.error("Error initializing RapidAPI:", error);
      this.initializationInProgress = false;
      return false;
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
      
      // Make sure we have the latest API key
      const isInitialized = await this.initialize();
      
      if (!isInitialized || !this.rapidApiKey) {
        console.error("RapidAPI credentials not initialized");
        return {
          success: false,
          error: "RapidAPI credentials not initialized. Please check that the RAPIDAPI_KEY secret is set in Supabase Edge Function Secrets."
        };
      }

      console.log("Making request to Amazon API with key length:", this.rapidApiKey.length);
      console.log("Using host: real-time-amazon-data.p.rapidapi.com");
      console.log("Search query:", query);
      
      // Make a direct API call to RapidAPI's Amazon Search endpoint with AE country code
      const url = new URL('https://real-time-amazon-data.p.rapidapi.com/search');
      url.searchParams.append('query', query);
      url.searchParams.append('page', '1');
      url.searchParams.append('country', 'AE'); // Using AE for UAE
      url.searchParams.append('category_id', 'aps');
      
      console.log("Full URL:", url.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
        }
      });

      console.log("RapidAPI response status:", response.status);
      
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
            return {
              success: false,
              error: "You need to subscribe to the Real Time Amazon Data API on RapidAPI. Please visit RapidAPI and subscribe to the service."
            };
          } else if (errorText.includes("exceeded the MONTHLY quota")) {
            this.quotaExceeded = true;
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
      console.log("Amazon search results status:", data.status);

      // Map the response structure to our expected format
      if (data.status === "OK" && data.data && data.data.products && Array.isArray(data.data.products)) {
        console.log("Found products:", data.data.products.length);
        
        const formattedResults = data.data.products.map((product: any) => ({
          title: product.product_title || 'Unknown Product',
          price: product.product_price || product.product_original_price || 'N/A',
          rating: product.product_star_rating || 'N/A',
          reviews: product.product_num_ratings ? product.product_num_ratings.toString() : '0',
          image: product.product_photo || '',
          url: product.product_url ? 
                (product.product_url.startsWith('http') ? 
                  product.product_url : 
                  `https://www.amazon.ae${product.product_url}`) : 
                undefined
        }));

        return {
          success: true,
          data: formattedResults
        };
      } else {
        console.log("No products found or unexpected response format:", data);
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
  
  static isQuotaExceeded(): boolean {
    return this.quotaExceeded;
  }
  
  static resetQuotaExceeded(): void {
    this.quotaExceeded = false;
  }
}
