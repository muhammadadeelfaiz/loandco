import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import Account from "./pages/Account";
import Products from "./pages/Products";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SearchResults from "./pages/SearchResults";
import StoreProfile from "./pages/StoreProfile";
import ProductDetails from "./pages/ProductDetails";
import CreateStore from "./pages/CreateStore";
import Wishlist from "./pages/Wishlist";
import CompareProducts from "./pages/CompareProducts";
import RetailerDashboard from "./pages/RetailerDashboard";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and subscribe to auth changes
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setLoading(false);

        // Set up real-time subscription to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error checking auth state:", error);
        setLoading(false);
      }
    };

    // Initialize theme from localStorage or system preference
    const initializeTheme = () => {
      if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        const initialTheme = localStorage.getItem('theme') || 
          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        root.classList.add(initialTheme);
      }
    };

    checkUser();
    initializeTheme();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index user={user} />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/signin" element={!user ? <SignIn /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />
            <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/signin" />} />
            <Route path="/account" element={user ? <Account user={user} /> : <Navigate to="/signin" />} />
            <Route path="/wishlist" element={user ? <Wishlist user={user} /> : <Navigate to="/signin" />} />
            <Route 
              path="/dashboard" 
              element={
                user?.user_metadata?.role === "retailer" 
                  ? <RetailerDashboard /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/products" 
              element={
                user?.user_metadata?.role === "retailer" 
                  ? <Products /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/create-store" 
              element={
                user?.user_metadata?.role === "retailer" 
                  ? <CreateStore /> 
                  : <Navigate to="/" />
              } 
            />
            <Route path="/store/:id" element={<StoreProfile />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/compare/:id" element={<CompareProducts />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;