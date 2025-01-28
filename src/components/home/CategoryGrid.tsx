import { useNavigate } from "react-router-dom";

interface Category {
  name: string;
  image: string;
}

interface CategoryGridProps {
  categories: Category[];
}

const CategoryGrid = ({ categories }: CategoryGridProps) => {
  const navigate = useNavigate();

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Popular categories</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
        {categories.map((category) => (
          <div 
            key={category.name}
            className="group cursor-pointer"
            onClick={() => navigate(`/search?category=${category.name.toLowerCase()}`)}
          >
            <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300">
              <img 
                src={category.image} 
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="text-sm text-center font-medium text-gray-800">
              {category.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;