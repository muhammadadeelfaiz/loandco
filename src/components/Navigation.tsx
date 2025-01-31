import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import SearchBar from "@/components/home/SearchBar";
import { useState } from "react";

interface NavigationProps {
  user: any;
}

const Navigation = ({ user }: NavigationProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const userRole = user?.user_metadata?.role || "customer";

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
                <Link to="/profile">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-primary/20 hover:border-primary/40 transition-colors"
                  >
                    Profile
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="border-primary/20 hover:border-primary/40 transition-colors"
                >
                  Sign Out
                </Button>
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
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto w-full">
          <SearchBar 
            userRole={userRole}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSubmit={handleSearch}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;