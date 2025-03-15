
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { useUser } from "@/hooks/useUser";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import NewChatButton from "@/components/chat/NewChatButton";

const Chat = () => {
  const { id: conversationId } = useParams();
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const [activeConversation, setActiveConversation] = useState<string | null>(conversationId || null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/signin");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    setActiveConversation(conversationId || null);
  }, [conversationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <div className="container mx-auto px-4 pt-[73px]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-8 min-h-[calc(100vh-73px)]">
          <div className="md:col-span-1 border-r border-border pr-6 relative">
            <h2 className="text-xl font-semibold mb-4">Conversations</h2>
            <ChatSidebar 
              userId={user?.id || ''} 
              activeConversationId={activeConversation} 
            />
            <div className="mt-4">
              <NewChatButton userId={user?.id || ''} />
            </div>
          </div>
          <div className="md:col-span-3">
            {activeConversation ? (
              <ChatWindow 
                conversationId={activeConversation} 
                userId={user?.id || ''} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground mb-6">
                  Choose an existing conversation from the sidebar or start a new one.
                </p>
                <NewChatButton userId={user?.id || ''} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
