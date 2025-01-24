interface FeatureCardsProps {
  userRole: string;
}

const FeatureCards = ({ userRole }: FeatureCardsProps) => {
  if (userRole === "customer") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
          <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Browse Products</h3>
          <p className="text-gray-600 text-sm md:text-base">
            Browse and compare products from local retailers
          </p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
          <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Connect</h3>
          <p className="text-gray-600 text-sm md:text-base">
            Chat with retailers and get product information
          </p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
          <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Shop Local</h3>
          <p className="text-gray-600 text-sm md:text-base">
            Support local businesses in your community
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
        <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Manage Products</h3>
        <p className="text-gray-600 text-sm md:text-base">
          Add and update your product listings
        </p>
      </div>
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
        <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Track Orders</h3>
        <p className="text-gray-600 text-sm md:text-base">
          Manage customer orders and inventory
        </p>
      </div>
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
        <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Analytics</h3>
        <p className="text-gray-600 text-sm md:text-base">
          View sales and performance metrics
        </p>
      </div>
    </div>
  );
};

export default FeatureCards;