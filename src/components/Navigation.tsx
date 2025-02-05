import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import SearchBar from "@/components/home/SearchBar";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";

interface NavigationProps {
  user: any;
}

const Navigation = ({ user }: NavigationProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const userRole = user?.user_metadata?.role || "customer";
  const location = useLocation();

  // Don't show search bar on auth pages
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Signed out successfully",
      });
      navigate("/signin");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
    }
  };

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md py-4 px-6 border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link 
              to="/" 
              className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
            >
              Lo&Co
            </Link>
            <div className="flex items-center gap-6">
              <Link 
                to="/" 
                className="text-gray-700 dark:text-gray-200 hover:text-primary transition-colors"
              >
                Home
              </Link>
              <Link 
                to="/about" 
                className="text-gray-700 dark:text-gray-200 hover:text-primary transition-colors"
              >
                About
              </Link>
              {user?.user_metadata?.role === "customer" && (
                <Link 
                  to="/wishlist" 
                  className="text-gray-700 dark:text-gray-200 hover:text-primary transition-colors"
                >
                  Wishlist
                </Link>
              )}
              {user?.user_metadata?.role === "retailer" && (
                <Link 
                  to="/dashboard" 
                  className="text-gray-700 dark:text-gray-200 hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <>
                {user?.user_metadata?.role === "retailer" && (
                  <Link 
                    to="/products" 
                    className="text-gray-700 dark:text-gray-200 hover:text-primary transition-colors"
                  >
                    Products
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-primary/20 hover:border-primary/40 transition-colors"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {user.user_metadata?.name || user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/account">My Account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Profile Settings</Link>
                    </DropdownMenuItem>
                    {user?.user_metadata?.role === "retailer" && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard">Dashboard</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/create-store">Create Store</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={handleSignOut}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-700 dark:text-gray-200 hover:text-primary transition-colors"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button 
                    variant="default" 
                    size="sm"
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Search Bar - Hidden on auth pages */}
        {!isAuthPage && (
          <div className="max-w-2xl mx-auto w-full">
            <SearchBar 
              userRole={userRole}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSubmit={handleSearch}
            />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;