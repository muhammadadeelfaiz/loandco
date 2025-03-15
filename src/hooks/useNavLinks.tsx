
import { useUser } from "@/hooks/useUser";
import { MessageSquare } from "lucide-react";
import { ReactNode } from "react";

interface NavLink {
  label: string;
  href: string;
  icon?: ReactNode;
}

export const useNavLinks = () => {
  const { user } = useUser();
  
  const getNavLinks = (): NavLink[] => {
    const links: NavLink[] = [
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
