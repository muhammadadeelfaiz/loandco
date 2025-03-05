
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FirecrawlService } from "@/services/FirecrawlService";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const ApiKeyForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testInProgress, setTestInProgress] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRefresh = async () => {
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!apiKey.trim()) {
      setFormError("Please enter a valid API key");
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Clean up the API key by removing any whitespace
      const cleanedApiKey = apiKey.trim();
      
      console.log("Testing API key with length:", cleanedApiKey.length);
      
      // First test the API key
      setTestInProgress(true);
      const testResult = await FirecrawlService.testApiKey(cleanedApiKey);
      setTestInProgress(false);
      
      if (!testResult) {
        setFormError("The API key could not be verified. Please check that you've entered a valid RapidAPI key with access to the Real-Time Amazon Data API.");
        toast({
          title: "Invalid API Key",
          description: "The API key could not be verified. Please check that you've entered a valid RapidAPI key with access to the Real-Time Amazon Data API.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Save the validated API key
      const success = await FirecrawlService.saveApiKey(cleanedApiKey);
      
      if (success) {
        toast({
          title: "Success",
          description: "API key saved successfully. The product search service is now available."
        });
        
        setApiKey("");
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setFormError("Failed to save API key. Please try again.");
        toast({
          title: "Error",
          description: "Failed to save API key. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      setFormError("An unexpected error occurred while saving the API key.");
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving the API key.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Set RapidAPI Key</CardTitle>
        <CardDescription>
          Enter your RapidAPI key for Amazon product search functionality.
          You can get a free API key from <a 
            href="https://rapidapi.com/DataCrawler/api/real-time-amazon-data/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80"
          >
            Real-Time Amazon Data API
          </a>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                id="apiKey"
                type="text"
                placeholder="Enter your RapidAPI Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full"
              />
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
            </div>
            
            <Alert className="bg-muted">
              <AlertDescription className="text-xs">
                <p className="mb-2">To get your RapidAPI key:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Create a RapidAPI account</li>
                  <li>Subscribe to the <a 
                    href="https://rapidapi.com/DataCrawler/api/real-time-amazon-data/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    Real-Time Amazon Data API
                  </a> (Free tier available)</li>
                  <li>Copy your API key from the API dashboard</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || testInProgress || !apiKey.trim()}
          >
            {(isSubmitting || testInProgress) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Saving..." : testInProgress ? "Testing Key..." : "Save API Key"}
          </Button>
          
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => window.open('https://rapidapi.com/DataCrawler/api/real-time-amazon-data/', '_blank')}
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Get a RapidAPI Key
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={handleRefresh}
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Refresh Page
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};
