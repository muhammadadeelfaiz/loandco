import Navigation from "@/components/Navigation";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-white">
      <Navigation user={null} />
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6 md:mb-8 text-center">About LoCo</h1>
          
          <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center mb-12 md:mb-16">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold mb-4">Connecting Local Communities</h2>
              <p className="text-gray-600 mb-6">
                LoCo is a revolutionary platform designed to bridge the gap between local retailers and customers. 
                We believe in strengthening local economies by making it easier for people to discover and 
                support businesses in their community.
              </p>
            </div>
            <div className="bg-blue-100 rounded-lg p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-semibold mb-4">Our Mission</h3>
              <p className="text-gray-600">
                To create a thriving marketplace where local businesses can flourish and customers can easily 
                discover products and services in their community.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12 md:mb-16">
            <div className="bg-white p-5 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-lg md:text-xl font-semibold mb-3">For Customers</h3>
              <p className="text-gray-600 text-sm md:text-base">
                Discover unique products from local retailers, support your community, 
                and enjoy a personalized shopping experience.
              </p>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-lg md:text-xl font-semibold mb-3">For Retailers</h3>
              <p className="text-gray-600 text-sm md:text-base">
                Expand your reach, connect with local customers, and grow your 
                business with our powerful platform.
              </p>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-lg md:text-xl font-semibold mb-3">Community First</h3>
              <p className="text-gray-600 text-sm md:text-base">
                We prioritize building strong, sustainable local economies through 
                meaningful connections.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;