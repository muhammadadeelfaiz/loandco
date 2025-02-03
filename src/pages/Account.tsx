import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { User, UserCircle, Key, Home, Heart, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AccountProps {
  user: any;
}

const Account = ({ user }: AccountProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          variant: "destructive",
          title: "Error fetching user data",
          description: error instanceof Error ? error.message : "An error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user, toast]);

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

  if (loading) {
    return <div>Loading...</div>;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const menuItems = [
    {
      icon: UserCircle,
      label: "Personal Data",
      onClick: () => navigate("/profile"),
    },
    {
      icon: Key,
      label: "Change Password",
      onClick: () => navigate("/profile?tab=password"),
    },
    {
      icon: Home,
      label: "Addresses",
      onClick: () => navigate("/profile?tab=addresses"),
    },
    {
      icon: Heart,
      label: "Wishlist",
      onClick: () => navigate("/wishlist"),
    },
    {
      icon: LogOut,
      label: "Log Out",
      onClick: handleSignOut,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <div className="container mx-auto px-4 py-8">
        <SidebarProvider defaultOpen>
          <div className="flex gap-8">
            <Sidebar className="w-64">
              <SidebarHeader className="p-4">
                <h2 className="text-lg font-semibold">My Account</h2>
              </SidebarHeader>
              <SidebarContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        onClick={item.onClick}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-accent rounded-md"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>

            <div className="flex-1 bg-card rounded-lg p-8 shadow-sm">
              <div className="flex items-center gap-6 mb-8">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {userData?.name ? getInitials(userData.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <h1 className="text-2xl font-semibold">{userData?.name}</h1>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={userData?.name || ''}
                    readOnly
                    className="max-w-md"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={userData?.date_of_birth || ''}
                    readOnly
                    className="max-w-md"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userData?.email || ''}
                    readOnly
                    className="max-w-md"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Account Type</Label>
                  <Input
                    id="role"
                    value={userData?.role || ''}
                    readOnly
                    className="max-w-md capitalize"
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={() => navigate("/profile")} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
};

export default Account;