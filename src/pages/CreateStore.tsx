import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import StoreLocationPicker from "@/components/StoreLocationPicker";
import { Building, Mail, Phone, Globe, Clock } from "lucide-react";

const CreateStore = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      toast({
        variant: "destructive",
        title: "Location Required",
        description: "Please select a location for your store on the map."
      });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("stores").insert([
        {
          name,
          description,
          category,
          latitude: location.lat,
          longitude: location.lng,
          phone,
          email,
          website,
          owner_id: userData.user.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Store Created Successfully",
        description: "Your store is pending verification. You'll be notified once it's approved."
      });
      
      navigate("/products");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create store"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <Navigation user={{ user_metadata: { role: 'retailer' } }} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Create Your Store</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-gray-500" />
                <Label htmlFor="name">Store Name</Label>
              </div>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your store name"
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="description">Store Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Describe your store"
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="category">Store Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                placeholder="e.g., Electronics, Clothing, Food"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <Label htmlFor="phone">Phone Number</Label>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <Label htmlFor="email">Email</Label>
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter store email"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-gray-500" />
                <Label htmlFor="website">Website (Optional)</Label>
              </div>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://your-store-website.com"
              />
            </div>

            <div className="space-y-4">
              <Label>Store Location</Label>
              <div className="h-[300px] rounded-lg overflow-hidden">
                <StoreLocationPicker
                  onLocationSelect={setLocation}
                  initialLocation={location}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Creating Store..." : "Create Store"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateStore;