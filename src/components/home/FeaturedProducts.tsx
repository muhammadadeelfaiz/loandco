import { Card } from "@/components/ui/card";

const FeaturedProducts = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {[1, 2, 3].map((item) => (
        <Card 
          key={item}
          className="aspect-[16/9] overflow-hidden bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
        >
          <img 
            src={`https://images.unsplash.com/photo-148859052850${item}-98d2b5aba04b`}
            alt={`Featured Product ${item}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Card>
      ))}
    </div>
  );
};

export default FeaturedProducts;