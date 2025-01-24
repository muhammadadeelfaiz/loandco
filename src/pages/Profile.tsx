import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validatePassword } from "@/lib/utils";

const Profile = ({ user }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const userRole = user?.user_metadata?.role || "customer";

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || "");
      setPhone(user.user_metadata?.phone || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d+\-() ]/g, '');
    setPhone(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPwd = e.target.value;
    setNewPassword(newPwd);
    setPasswordErrors(validatePassword(newPwd));
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordErrors.length > 0) {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: "Please fix the password requirements below.",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      
      setCurrentPassword("");
      setNewPassword("");
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
          
          <Tabs defaultValue="info" className="space-y-6">
            <TabsList>
              <TabsTrigger value="info">Profile Information</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} disabled className="bg-gray-50" />
                <p className="text-sm text-gray-500">Email cannot be changed</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
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
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                  />
                  {passwordErrors.length > 0 && (
                    <ul className="text-sm text-red-500 list-disc pl-4 mt-2">
                      {passwordErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full md:w-auto"
                  disabled={loading || passwordErrors.length > 0}
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {userRole === "customer" ? (
            <div className="mt-8 pt-6 border-t">
              <h2 className="text-lg font-semibold mb-4">Account Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium">Account Type</p>
                  <p className="text-gray-600 capitalize">{userRole}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium">Member Since</p>
                  <p className="text-gray-600">
                    {new Date(user?.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 pt-6 border-t">
              <h2 className="text-lg font-semibold mb-4">Retailer Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium">Account Type</p>
                  <p className="text-gray-600 capitalize">{userRole}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium">Member Since</p>
                  <p className="text-gray-600">
                    {new Date(user?.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;