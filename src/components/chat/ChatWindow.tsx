
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import ChatMessage from "./ChatMessage";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  is_read: boolean;
}

interface ChatWindowProps {
  conversationId: string;
  userId: string;
}

const ChatWindow = ({ conversationId, userId }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationData, setConversationData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!conversationId) return;

    const fetchConversationDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("conversations")
          .select(`
            id,
            retailer:retailer_id(
              id,
              name
            )
          `)
          .eq("id", conversationId)
          .single();

        if (error) throw error;
        setConversationData(data);
      } catch (error) {
        console.error("Error fetching conversation details:", error);
      }
    };

    fetchConversationDetails();
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
        
        // Mark messages as read
        const unreadMessages = data?.filter(
          (msg) => !msg.is_read && msg.sender_id !== userId
        );
        
        if (unreadMessages && unreadMessages.length > 0) {
          await Promise.all(
            unreadMessages.map(async (msg) => {
              await supabase
                .from("messages")
                .update({ is_read: true })
                .eq("id", msg.id);
            })
          );
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time listener for messages
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          
          // Only add if not from current user to avoid duplicates
          // (since we add optimistically)
          if (newMsg.sender_id !== userId) {
            setMessages((prevMessages) => [...prevMessages, newMsg]);
            
            // Mark as read
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !userId) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    // Optimistically add message to UI
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      created_at: new Date().toISOString(),
      sender_id: userId,
      is_read: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      // Update last_message_at in conversation
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Save the message to the database
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: messageContent,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) => 
        prev.filter((msg) => msg.id !== optimisticMessage.id)
      );
      setNewMessage(messageContent); // Restore message to input
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="border-b pb-3 mb-4">
        <h2 className="text-xl font-semibold">
          {conversationData?.retailer?.name || "Chat"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isOwn={message.sender_id === userId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-auto pt-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[60px] resize-none"
            disabled={sending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="self-end"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
