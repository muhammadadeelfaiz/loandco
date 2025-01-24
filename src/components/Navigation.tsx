import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface NavigationProps {
  user: any;
}

const Navigation = ({ user }: NavigationProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

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

  return (
    <nav className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary">LoCo</Link>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-gray-600 hover:text-primary">Home</Link>
          {user?.user_metadata?.role === "retailer" && (
            <Link to="/products" className="text-gray-600 hover:text-primary">Products</Link>
          )}
          <Link to="/about" className="text-gray-600 hover:text-primary">About</Link>
          <div className="flex gap-2">
            {user ? (
              <>
                <Link to="/profile">
                  <Button variant="outline">Profile</Button>
                </Link>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;