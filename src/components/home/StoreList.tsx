import { useNavigate } from "react-router-dom";

interface Store {
  id: string;
  name: string;
  category: string;
  description: string | null;
  distance?: number | null;
}

interface StoreListProps {
  stores: Store[];
}

const StoreList = ({ stores }: StoreListProps) => {
  const navigate = useNavigate();

  if (stores.length === 0) return null;

  const handleStoreClick = (storeId: string) => {
    navigate(`/store/${storeId}`);
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Nearby Stores</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stores.map((store) => (
          <div
            key={store.id}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
            onClick={() => handleStoreClick(store.id)}
          >
            <h4 className="text-lg font-semibold">{store.name}</h4>
            <p className="text-gray-600">
              {store.category}
              {store.distance && ` - ${store.distance.toFixed(1)}km away`}
            </p>
            {store.description && (
              <p className="text-gray-500 mt-2">{store.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreList;