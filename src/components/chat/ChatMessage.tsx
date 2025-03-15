
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
}

const ChatMessage = ({ message, isOwn }: ChatMessageProps) => {
  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] rounded-lg p-3 ${
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-accent"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <div
          className={`text-xs mt-1 ${
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          {isOwn && (
            <span className="ml-2">
              {message.is_read ? "• Read" : "• Sent"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
