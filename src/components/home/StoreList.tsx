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
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Nearby Stores</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => (
          <div key={store.id} className="bg-white p-4 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-semibold">{store.name}</h4>
            <p className="text-sm text-gray-600">
              {store.category}
              {store.distance && ` - ${store.distance.toFixed(1)}km away`}
            </p>
            {store.description && (
              <p className="text-sm text-gray-500 mt-1">{store.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreList;