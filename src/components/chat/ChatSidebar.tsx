
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  last_message_at: string;
  retailer: {
    name: string;
  };
}

interface ChatSidebarProps {
  userId: string;
  activeConversationId: string | null;
}

const ChatSidebar = ({ userId, activeConversationId }: ChatSidebarProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchConversations = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("conversations")
          .select(`
            id,
            last_message_at,
            retailer:retailer_id(
              id,
              name
            )
          `)
          .eq("user_id", userId)
          .order("last_message_at", { ascending: false });

        if (error) throw error;
        
        // Process the data to match our Conversation type
        if (data) {
          const formattedData = data.map(item => ({
            id: item.id,
            last_message_at: item.last_message_at,
            retailer: {
              // If retailer is null or an empty array, use default values
              name: item.retailer && Array.isArray(item.retailer) && item.retailer.length > 0
                ? item.retailer[0].name
                : "Unknown Retailer"
            }
          }));
          
          setConversations(formattedData);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Set up real-time listener for conversations
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading && conversations.length === 0) {
    return (
      <div className="py-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!loading && conversations.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        No conversations yet. Start a new chat with a retailer.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
      {conversations.map((conversation) => (
        <Link
          key={conversation.id}
          to={`/chat/${conversation.id}`}
          className={`block p-3 rounded-md transition-colors ${
            activeConversationId === conversation.id
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="font-medium">{conversation.retailer?.name || "Unknown Retailer"}</div>
            <div className="text-xs opacity-70">
              {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ChatSidebar;
