
import { Card } from "@/components/ui/card";

interface Category {
  name: string;
  image: string;
}

interface CategoryGridProps {
  categories: Category[];
  onCategoryClick: (category: string) => void;
}

const CategoryGrid = ({ categories, onCategoryClick }: CategoryGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {categories.map((category) => (
        <Card
          key={category.name}
          className="group cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          onClick={() => onCategoryClick(category.name)}
        >
          <div className="aspect-square relative">
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-4">
              <h3 className="text-white font-semibold text-lg tracking-wide">
                {category.name}
              </h3>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default CategoryGrid;
