interface FeatureCardsProps {
  userRole: string;
}

const FeatureCards = ({ userRole }: FeatureCardsProps) => {
  if (userRole === "customer") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Browse Products</h3>
          <p className="text-gray-600">
            Browse and compare products from local retailers
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Connect</h3>
          <p className="text-gray-600">
            Chat with retailers and get product information
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Shop Local</h3>
          <p className="text-gray-600">
            Support local businesses in your community
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Manage Products</h3>
        <p className="text-gray-600">
          Add and update your product listings
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Track Orders</h3>
        <p className="text-gray-600">
          Manage customer orders and inventory
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Analytics</h3>
        <p className="text-gray-600">
          View sales and performance metrics
        </p>
      </div>
    </div>
  );
};

export default FeatureCards;