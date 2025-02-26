
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import SearchFilters from "./SearchFilters";

interface SearchHeaderProps {
  query: string;
  category: string;
  sortBy: string;
  setSortBy: (value: string) => void;
  priceRange: string;
  setPriceRange: (value: string) => void;
  setCategory: (value: string) => void;
  distanceRange: string;
  setDistanceRange: (value: string) => void;
  onResetFilters: () => void;
}

export const SearchHeader = ({
  query,
  category,
  sortBy,
  setSortBy,
  priceRange,
  setPriceRange,
  setCategory,
  distanceRange,
  setDistanceRange,
  onResetFilters,
}: SearchHeaderProps) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center mb-6">
        <div className="flex-1">
          <SearchFilters
            sortBy={sortBy}
            setSortBy={setSortBy}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            category={category}
            setCategory={setCategory}
            distanceRange={distanceRange}
            setDistanceRange={setDistanceRange}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={onResetFilters}
          className="w-full md:w-auto"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Filters
        </Button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        {query 
          ? `Search Results for "${query}"${category !== 'all' ? ` in ${category}` : ''}`
          : category !== 'all' 
            ? `Browsing ${category}`
            : "All Products"
        }
      </h1>
    </div>
  );
};
