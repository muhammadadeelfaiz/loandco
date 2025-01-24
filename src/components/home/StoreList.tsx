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
  if (stores.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Nearby Stores</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stores.map((store) => (
          <div key={store.id} className="bg-white p-6 rounded-lg shadow-md">
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