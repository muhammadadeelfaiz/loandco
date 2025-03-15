
import { useUser } from "@/hooks/useUser";

export const useNavLinks = () => {
  const { user } = useUser();
  
  const getNavLinks = () => {
    const links = [
      { label: "Home", href: "/" },
      { label: "Search", href: "/search" },
      { label: "About", href: "/about" },
    ];
    
    if (user) {
      links.push({ label: "Messages", href: "/chat" });
    }
    
    return links;
  };
  
  return { getNavLinks };
};
