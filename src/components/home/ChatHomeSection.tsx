
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArchiveIcon, 
  CheckCircle2, 
  FileEdit, 
  MessageCircle, 
  Search, 
  MessageSquare,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import NewChatButton from "@/components/chat/NewChatButton";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface ConversationData {
  id: string;
  retailer_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

const ChatHomeSection = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch conversations when component mounts
  useState(() => {
    if (!user?.id) return;
    
    const fetchConversations = async () => {
      setLoading(true);
      try {
        // Get conversations with last message and unread count
        const { data, error } = await supabase
          .from("conversations")
          .select(`
            id,
            last_message_at,
            retailer:retailer_id(
              name
            ),
            messages(
              content,
              created_at,
              is_read,
              sender_id
            )
          `)
          .eq("user_id", user.id)
          .order("last_message_at", { ascending: false });

        if (error) throw error;

        // Process the data to organize it properly
        const processedData = data?.map(item => {
          // Get the last message
          const messages = item.messages || [];
          const lastMessage = messages.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0] || null;

          // Count unread messages (only those sent by the retailer)
          const unreadCount = messages.filter(
            msg => !msg.is_read && msg.sender_id !== user.id
          ).length;

          return {
            id: item.id,
            retailer_name: item.retailer?.name || "Unknown Retailer",
            last_message: lastMessage?.content || "No messages yet",
            last_message_at: item.last_message_at,
            unread_count: unreadCount,
          };
        }) || [];

        setConversations(processedData);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user?.id, toast]);

  const filteredConversations = conversations.filter(conv => {
    // First apply category filter
    if (activeTab === "unread" && conv.unread_count === 0) return false;
    if (activeTab === "archived") return false; // We're not implementing archiving yet
    if (activeTab === "drafts") return false; // We're not implementing drafts yet

    // Then apply search filter
    if (searchQuery && !conv.retailer_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  if (!user) {
    return (
      <Card className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div>Messages</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">Sign in to view messages</h3>
            <p className="text-muted-foreground mb-4">
              Connect with local retailers through chat
            </p>
            <Button onClick={() => navigate("/signin")}>
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div>Messages</div>
          <NewChatButton userId={user.id || ''} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">
              <MessageCircle className="h-4 w-4 mr-2" />
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Unread
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex-1">
              <ArchiveIcon className="h-4 w-4 mr-2" />
              Archived
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex-1">
              <FileEdit className="h-4 w-4 mr-2" />
              Drafts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-0">
            {renderConversationList(filteredConversations, loading)}
          </TabsContent>
          
          <TabsContent value="unread" className="space-y-4 mt-0">
            {renderConversationList(filteredConversations, loading)}
          </TabsContent>
          
          <TabsContent value="archived" className="space-y-4 mt-0">
            <div className="text-center py-6 text-muted-foreground">
              <ArchiveIcon className="mx-auto h-10 w-10 mb-2" />
              <p>Archived conversations will appear here</p>
            </div>
          </TabsContent>
          
          <TabsContent value="drafts" className="space-y-4 mt-0">
            <div className="text-center py-6 text-muted-foreground">
              <FileEdit className="mx-auto h-10 w-10 mb-2" />
              <p>Draft messages will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  function renderConversationList(conversations: ConversationData[], isLoading: boolean) {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-muted rounded-md"></div>
            </div>
          ))}
        </div>
      );
    }

    if (conversations.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <MessageSquare className="mx-auto h-10 w-10 mb-2" />
          <p>No conversations found</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => document.getElementById('new-chat-button')?.click()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Start a new conversation
          </Button>
        </div>
      );
    }

    return conversations.map((conversation) => (
      <div
        key={conversation.id}
        className="p-3 border rounded-md hover:bg-accent cursor-pointer transition-colors"
        onClick={() => navigate(`/chat/${conversation.id}`)}
      >
        <div className="flex justify-between items-start">
          <div className="font-medium">{conversation.retailer_name}</div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
          </div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <div className="text-sm text-muted-foreground truncate max-w-[70%]">
            {conversation.last_message}
          </div>
          {conversation.unread_count > 0 && (
            <Badge variant="secondary">{conversation.unread_count}</Badge>
          )}
        </div>
      </div>
    ));
  }
};

export default ChatHomeSection;
