
import { AlertCircle, ExternalLink, Key, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FirecrawlService } from "@/services/FirecrawlService";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface AmazonProduct {
  title: string;
  price: string;
  rating: string;
  reviews: string;
  image: string;
  url?: string;
}

interface AmazonProductsProps {
  products: AmazonProduct[];
  isLoading: boolean;
  error?: string;
}

export const AmazonProducts = ({ products, isLoading, error }: AmazonProductsProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  
  const handleRefreshApiKey = async () => {
    setRefreshing(true);
    toast({
      title: "Refreshing API Key",
      description: "Attempting to retrieve the RapidAPI key again..."
    });
    
    try {
      await FirecrawlService.resetApiKeyCache();
      const initialized = await FirecrawlService.initialize();
      
      if (initialized) {
        toast({
          title: "Success",
          description: "Successfully retrieved the RapidAPI key. Refresh the page to see results."
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to retrieve the RapidAPI key. Please verify it's set in Supabase Edge Function Secrets.",
          variant: "destructive"
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while refreshing the API key.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    // Special handling for API key errors
    if (error.includes('RapidAPI credentials not initialized') || error.includes('API key')) {
      return (
        <Alert variant="destructive">
          <Key className="h-4 w-4" />
          <AlertTitle>RapidAPI Key Required</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error}</p>
            <p className="text-sm">
              Go to Supabase Edge Function Secrets and verify the RAPIDAPI_KEY is set correctly, 
              then refresh this page.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://supabase.com/dashboard/project/svdgniviotecguehvtig/settings/functions', '_blank')}
              >
                <Key className="mr-2 h-4 w-4" />
                Open Supabase Function Secrets
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshApiKey}
                disabled={refreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh API Key'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading Amazon products</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (products.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Amazon results</AlertTitle>
        <AlertDescription>
          No products found on Amazon matching your search.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200">
          <div className="relative h-48 mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
            <img 
              src={product.image} 
              alt={product.title}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
            {product.title}
          </h3>
          <p className="text-xl font-bold text-primary mb-2">{product.price}</p>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
            <span>Rating: {product.rating}</span>
            <span>•</span>
            <span>{product.reviews} reviews</span>
          </div>
          {product.url && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={() => {
                // Ensure URL has proper format before opening
                let url = product.url;
                if (url && !url.startsWith('http')) {
                  url = `https://${url}`;
                }
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Amazon
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
