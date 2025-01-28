interface Category {
  name: string;
  image: string;
}

interface CategoryGridProps {
  categories: Category[];
  onCategoryClick: (categoryName: string) => void;
}

const CategoryGrid = ({ categories, onCategoryClick }: CategoryGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      {categories.map((category) => (
        <div
          key={category.name}
          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => onCategoryClick(category.name)}
        >
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <span className="text-white text-xl font-semibold">{category.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryGrid;