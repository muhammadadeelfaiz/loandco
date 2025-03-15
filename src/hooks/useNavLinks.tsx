
import { useUser } from "@/hooks/useUser";
import { MessageSquare } from "lucide-react";

export const useNavLinks = () => {
  const { user } = useUser();
  
  const getNavLinks = () => {
    const links = [
      { label: "Home", href: "/" },
      { label: "Search", href: "/search" },
      { label: "About", href: "/about" },
    ];
    
    if (user) {
      links.push({ 
        label: "Messages", 
        href: "/chat",
        icon: <MessageSquare className="h-4 w-4 mr-2" />
      });
    }
    
    return links;
  };
  
  return { getNavLinks };
};
