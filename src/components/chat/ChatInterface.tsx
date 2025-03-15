
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";

interface ChatInterfaceProps {
  userId: string | undefined;
  retailerId: string;
  retailerName: string;
}

const ChatInterface = ({ userId, retailerId, retailerName }: ChatInterfaceProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    if (!userId) {
      navigate("/signin");
      return;
    }

    setLoading(true);
    try {
      // Check if conversation already exists
      const { data: existingConversation, error: checkError } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", userId)
        .eq("retailer_id", retailerId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingConversation) {
        // Conversation exists, navigate to it
        navigate(`/chat/${existingConversation.id}`);
        return;
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          retailer_id: retailerId,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Navigate to the new conversation
      navigate(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Error",
        description: "Failed to start chat with retailer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStartChat}
      disabled={loading}
      variant="secondary"
      className="flex items-center gap-2"
    >
      <MessageSquare className="h-4 w-4" />
      {loading ? "Loading..." : `Chat with ${retailerName}`}
    </Button>
  );
};

export default ChatInterface;
