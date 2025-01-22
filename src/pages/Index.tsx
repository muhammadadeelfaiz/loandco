import { AuthForm } from "@/components/auth/AuthForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">Welcome to Lo&Co</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with retailers and discover amazing products in your area
          </p>
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