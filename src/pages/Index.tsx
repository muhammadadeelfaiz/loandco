import { AuthForm } from "@/components/auth/AuthForm";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">LoCo</h2>
          <div className="flex gap-6">
            <Link to="/" className="text-gray-600 hover:text-primary">Home</Link>
            <Link to="/products" className="text-gray-600 hover:text-primary">Products</Link>
            <Link to="/retailers" className="text-gray-600 hover:text-primary">Retailers</Link>
            <Link to="/about" className="text-gray-600 hover:text-primary">About</Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section with Search */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">Welcome to LoCo</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Connect with retailers and discover amazing products in your area
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Input 
              type="search" 
              placeholder="Search for products..."
              className="pl-10 h-12"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center mt-8">
          <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
            <AuthForm />
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-xl font-semibold mb-4">For Customers</h3>
            <p className="text-gray-600">
              Browse and compare products from local retailers
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-xl font-semibold mb-4">For Retailers</h3>
            <p className="text-gray-600">
              Manage your inventory and connect with customers
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-xl font-semibold mb-4">Real-time Chat</h3>
            <p className="text-gray-600">
              Communicate directly with retailers or customers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;