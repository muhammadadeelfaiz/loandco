import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  MessageSquare,
  Package,
  Settings,
  Store,
  Users,
  Edit,
  MapPin,
  Phone,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

interface Store {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  latitude: number;
  longitude: number;
}

const RetailerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [customerInquiries, setCustomerInquiries] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/signin');
        return;
      }
      setUser(session.user);

      // Fetch store data
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', session.user.id)
        .single();

      if (storeError) {
        console.error('Error fetching store:', storeError);
        return;
      }

      setStore(storeData);

      // Fetch recent products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (productsError) {
        console.error('Error fetching products:', productsError);
        return;
      }

      setRecentProducts(productsData || []);
      setTotalProducts(productsData?.length || 0);

      // For demo purposes, set a random number of inquiries
      setCustomerInquiries(Math.floor(Math.random() * 10));
    };

    getUser();
  }, [navigate]);

  const menuItems = [
    { icon: BarChart3, label: "Dashboard Overview", path: "/dashboard" },
    { icon: Package, label: "Product Management", path: "/products" },
    { icon: MessageSquare, label: "Chat Management", path: "/chat" },
    { icon: Users, label: "Customer Analytics", path: "/analytics" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <SidebarProvider defaultOpen>
        <div className="flex min-h-[calc(100vh-73px)]">
          <Sidebar>
            <SidebarHeader className="p-4">
              <h2 className="text-lg font-semibold">Retailer Dashboard</h2>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
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

          <div className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Welcome to your retailer dashboard!</h1>
              </div>

              {store && (
                <Card className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {store.logo_url ? (
                          <img
                            src={store.logo_url}
                            alt={store.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-semibold">{store.name}</h2>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/store/${store.id}`)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Store
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          {store.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{store.phone}</span>
                            </div>
                          )}
                          {store.latitude && store.longitude && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>Location set</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">Total Products Listed</h3>
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold">{totalProducts}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">Customer Inquiries</h3>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold">{customerInquiries}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Recent Products</h3>
                  <div className="space-y-4">
                    {recentProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-600">
                            AED {product.price}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/product/${product.id}`)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default RetailerDashboard;