import { Card } from "@/components/ui/card";

const BestSellers = () => {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Best sellers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((item) => (
          <Card 
            key={item} 
            className="aspect-[3/4] bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
          >
            <div className="p-4 h-full flex items-center justify-center text-secondary group-hover:text-accent transition-colors">
              Coming Soon
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default BestSellers;