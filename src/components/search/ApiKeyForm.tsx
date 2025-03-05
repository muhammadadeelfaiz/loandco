
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FirecrawlService } from "@/services/FirecrawlService";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export const ApiKeyForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await FirecrawlService.saveApiKey(apiKey);
      
      if (success) {
        setApiKey("");
        if (onSuccess) {
          onSuccess();
        }
      }
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
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !apiKey.trim()}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Saving..." : "Save API Key"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
