import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Store {
  id: string;
  name: string;
  distance?: number;
}

interface RetailerGridProps {
  stores: Store[];
  retailerImages: Record<string, string>;
}

const RetailerGrid = ({ stores, retailerImages }: RetailerGridProps) => {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Top retailers in your area</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-6">
        {stores.slice(0, 7).map((store) => (
          <div 
            key={store.id} 
            className="flex flex-col items-center gap-2 cursor-pointer group"
          >
            <Avatar className="w-20 h-20 border-2 border-white/20 shadow-lg group-hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm">
              {retailerImages[store.name] ? (
                <AvatarImage 
                  src={retailerImages[store.name]} 
                  alt={store.name}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl">
                  {store.name.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm font-medium text-center line-clamp-2 text-gray-800">
              {store.name}
            </span>
            {store.distance && (
              <span className="text-xs text-gray-600">
                {store.distance.toFixed(1)}km away
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default RetailerGrid;