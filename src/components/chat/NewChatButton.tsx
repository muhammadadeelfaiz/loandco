
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface NewChatButtonProps {
  userId: string;
}

interface Retailer {
  id: string;
  name: string;
}

const NewChatButton = ({ userId }: NewChatButtonProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLoading(true);
      try {
        // Fetch retailers
        const { data, error } = await supabase
          .from("users")
          .select("id, name")
          .eq("role", "retailer");

        if (error) throw error;
        setRetailers(data || []);
      } catch (error) {
        console.error("Error fetching retailers:", error);
        toast({
          title: "Error",
          description: "Failed to load retailers",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateChat = async () => {
    if (!selectedRetailer || !userId) return;
    
    setCreatingChat(true);
    try {
      // Check if conversation already exists
      const { data: existingConversation, error: checkError } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", userId)
        .eq("retailer_id", selectedRetailer)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingConversation) {
        // Conversation exists, navigate to it
        navigate(`/chat/${existingConversation.id}`);
        setOpen(false);
        return;
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          retailer_id: selectedRetailer,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Navigate to the new conversation
      navigate(`/chat/${newConversation.id}`);
      toast({
        title: "Chat created",
        description: "You can now start messaging",
      });
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Error",
        description: "Failed to create chat",
        variant: "destructive",
      });
    } finally {
      setCreatingChat(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">New Chat</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a new chat</DialogTitle>
          <DialogDescription>
            Select a retailer to start chatting with
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
              ))}
            </div>
          ) : retailers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No retailers found
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {retailers.map((retailer) => (
                <div
                  key={retailer.id}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    selectedRetailer === retailer.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => setSelectedRetailer(retailer.id)}
                >
                  {retailer.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateChat}
            disabled={!selectedRetailer || creatingChat || loading}
          >
            {creatingChat ? "Creating..." : "Start Chat"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatButton;
