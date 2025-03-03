
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
import { useUser } from "@/hooks/useUser";
import { Footer } from "@/components/ui/Footer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const { user, loading } = useUser();
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      const initialTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      root.classList.add(initialTheme);
      setTheme(initialTheme);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <Toaster />
            <Sonner />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Index user={user} />} />
                <Route path="/search" element={<SearchResults user={user} />} />
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
                <Route path="/store/:id" element={<StoreProfile user={user} />} />
                <Route path="/product/:id" element={<ProductDetails user={user} />} />
                <Route path="/compare/:id" element={<CompareProducts user={user} />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
