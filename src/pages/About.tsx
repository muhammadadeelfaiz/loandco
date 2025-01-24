import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-8">About LoCo</h1>
          
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Connecting Local Communities</h2>
              <p className="text-gray-600 mb-6">
                LoCo is a revolutionary platform designed to bridge the gap between local retailers and customers. 
                We believe in strengthening local economies by making it easier for people to discover and 
                support businesses in their community.
              </p>
              <Link to="/signup">
                <Button>Join Our Community</Button>
              </Link>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img 
                src="/photo-1486312338219-ce68d2c6f44d" 
                alt="Local Business"
                className="w-full h-auto"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">For Customers</h3>
              <p className="text-gray-600">
                Discover unique products from local retailers, support your community, 
                and enjoy a personalized shopping experience.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">For Retailers</h3>
              <p className="text-gray-600">
                Expand your reach, connect with local customers, and grow your 
                business with our powerful platform.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3">Community First</h3>
              <p className="text-gray-600">
                We prioritize building strong, sustainable local economies through 
                meaningful connections.
              </p>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-6">Ready to Get Started?</h2>
            <div className="space-x-4">
              <Link to="/signup">
                <Button>Sign Up Now</Button>
              </Link>
              <Link to="/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;