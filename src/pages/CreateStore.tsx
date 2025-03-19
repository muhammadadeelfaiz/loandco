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
import { Building, Mail, Phone, Globe, Clock, Image } from "lucide-react";

const CreateStore = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Logo file must be less than 5MB"
        });
        return;
      }
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const { error: uploadError, data } = await supabase.storage
      .from('store-logos')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error('Failed to upload logo');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('store-logos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!phone.trim()) {
      toast({
        variant: "destructive",
        title: "Phone Number Required",
        description: "Please enter a phone number for your store."
      });
      return;
    }

    if (!location) {
      toast({
        variant: "destructive",
        title: "Location Required",
        description: "Please select a location for your store on the map."
      });
      return;
    }

    if (!logo) {
      toast({
        variant: "destructive",
        title: "Logo Required",
        description: "Please upload a logo for your store."
      });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Upload logo first
      const logoUrl = await uploadLogo(logo);
      if (!logoUrl) throw new Error("Failed to upload logo");

      const { error: storeError } = await supabase.from("stores").insert([
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
          logo_url: logoUrl,
          is_verified: true,
        },
      ]);

      if (storeError) {
        if (storeError.code === '23505') { // Unique violation error code
          toast({
            variant: "destructive",
            title: "Store Name Already Exists",
            description: "Please choose a different store name."
          });
          return;
        }
        throw storeError;
      }

      toast({
        title: "Store Created Successfully",
        description: "Your store has been created. You can now start listing products."
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 dark:text-white">
      <Navigation user={{ user_metadata: { role: 'retailer' } }} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 dark:text-white">Create Your Store</h1>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <Label htmlFor="name">Store Name *</Label>
              </div>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your store name"
                className="border-2 border-blue-100 focus:border-blue-500 dark:border-slate-700"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Image className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <Label htmlFor="logo">Store Logo *</Label>
              </div>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                required
                className="border-2 border-blue-100 focus:border-blue-500 dark:border-slate-700"
              />
              {logoPreview && (
                <div className="mt-2">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-32 h-32 object-contain border rounded"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="description">Store Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Describe your store"
                className="dark:border-slate-700"
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
                className="dark:border-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <Label htmlFor="phone">Phone Number *</Label>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="Enter phone number"
                  className="border-2 border-blue-100 focus:border-blue-500 dark:border-slate-700"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <Label htmlFor="email">Email</Label>
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter store email"
                  className="dark:border-slate-700"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <Label htmlFor="website">Website (Optional)</Label>
              </div>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://your-store-website.com"
                className="dark:border-slate-700"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <Label>Store Location *</Label>
              </div>
              <StoreLocationPicker
                onLocationSelect={setLocation}
                initialLocation={location}
              />
              {!location && (
                <p className="text-sm text-red-500">Please select a location for your store</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
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
