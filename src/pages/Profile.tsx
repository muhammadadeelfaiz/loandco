import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";

const Profile = ({ user }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const userRole = user?.user_metadata?.role || "customer";

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and common phone number characters
    const value = e.target.value.replace(/[^\d+\-() ]/g, '');
    setPhone(value);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name,
          phone,
        },
      });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      // Redirect to home page after successful update
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-white">
      <Navigation user={user} />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6 md:mb-8">Profile Settings</h1>

          {userRole === "customer" ? (
            <div className="mb-6 md:mb-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Customer Dashboard</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors">
                  <h3 className="font-medium mb-2">Recent Orders</h3>
                  <p className="text-gray-600 text-sm">No orders yet</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors">
                  <h3 className="font-medium mb-2">Saved Items</h3>
                  <p className="text-gray-600 text-sm">No saved items</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 md:mb-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Retailer Dashboard</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors">
                  <h3 className="font-medium mb-2">Products</h3>
                  <p className="text-gray-600 text-sm mb-2">No products listed</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate("/products")}
                    className="w-full sm:w-auto"
                  >
                    Add Product
                  </Button>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors">
                  <h3 className="font-medium mb-2">Orders</h3>
                  <p className="text-gray-600 text-sm">No pending orders</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Enter your phone number"
                type="tel"
                pattern="[\d+\-() ]+"
                title="Please enter a valid phone number"
                className="h-10"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full md:w-auto"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;