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
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Browse Categories
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {categories.map((category) => (
          <Card
            key={category.name}
            className="group cursor-pointer hover:shadow-lg transition-shadow duration-300"
            onClick={() => onCategoryClick(category.name)}
          >
            <div className="aspect-square relative overflow-hidden">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                <h3 className="text-white font-medium">{category.name}</h3>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;