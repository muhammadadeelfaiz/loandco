
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

interface Category {
  name: string;
  image: string;
}

interface CategoryGridProps {
  categories: Category[];
  onCategoryClick: (category: string) => void;
}

const CategoryGrid = ({ categories, onCategoryClick }: CategoryGridProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400; // Increased scroll amount to match larger cards
      const newScrollLeft = direction === 'left' 
        ? scrollRef.current.scrollLeft - scrollAmount
        : scrollRef.current.scrollLeft + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
      </button>
      
      <div 
        ref={scrollRef}
        className="flex space-x-6 overflow-x-auto scrollbar-none py-6 px-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        {categories.map((category) => (
          <div
            key={category.name}
            className="flex-none"
            onClick={() => onCategoryClick(category.name)}
          >
            <Card className="group cursor-pointer w-64 overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-b from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
              <div className="aspect-[5/4] relative p-4">
                <div className="w-full h-full rounded-xl overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-4">
                  <div className="w-full">
                    <h3 className="text-white font-semibold text-xl tracking-wide text-center">
                      {category.name}
                    </h3>
                    <div className="mt-3 bg-primary/80 backdrop-blur-sm rounded-full py-2 px-4 mx-auto w-fit">
                      <p className="text-white text-sm font-medium">Shop Now</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <button 
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-6 w-6 text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  );
};

export default CategoryGrid;

