import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface FiltersSidebarProps {
  onFilterChange: (type: string, value: any) => void;
  onReset: () => void;
  activeFilters: {
    categories: Set<string>;
    conditions: Set<string>;
    priceRange: number[];
    priceBrackets: Set<string>;
  };
}

const FiltersSidebar = ({ onFilterChange, onReset, activeFilters }: FiltersSidebarProps) => {
  const categories = [
    "Electronics", "Fashion", "Home & Garden", 
    "Sports", "Books", "Toys", "Beauty",
    "Automotive", "Health", "Food & Beverages"
  ];

  const conditions = ["New", "Like New", "Good", "Fair"];
  
  const priceRanges = [
    "Under 50 AED",
    "50-100 AED",
    "100-500 AED",
    "500-1000 AED",
    "Over 1000 AED"
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 p-4 rounded-lg space-y-6 transition-all duration-300">
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2 transition-opacity duration-200">
              <Checkbox 
                id={`category-${category}`}
                checked={activeFilters.categories.has(category)}
                onCheckedChange={(checked) => {
                  onFilterChange("category", { value: category, checked });
                }}
                className="transition-all duration-200"
              />
              <Label 
                htmlFor={`category-${category}`}
                className="cursor-pointer transition-colors duration-200 hover:text-primary"
              >
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Condition</h3>
        <div className="space-y-2">
          {conditions.map((condition) => (
            <div key={condition} className="flex items-center space-x-2">
              <Checkbox 
                id={`condition-${condition}`}
                checked={activeFilters.conditions.has(condition)}
                onCheckedChange={(checked) => onFilterChange("condition", { value: condition, checked })}
              />
              <Label htmlFor={`condition-${condition}`}>{condition}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            defaultValue={activeFilters.priceRange}
            value={activeFilters.priceRange}
            max={1000}
            step={50}
            onValueChange={(value) => onFilterChange("price", value)}
            className="transition-all duration-200"
          />
          <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-300">
            <span>0 AED</span>
            <span>1000+ AED</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Price Brackets</h3>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <div key={range} className="flex items-center space-x-2">
              <Checkbox 
                id={`price-${range}`}
                checked={activeFilters.priceBrackets.has(range)}
                onCheckedChange={(checked) => onFilterChange("priceRange", { value: range, checked })}
              />
              <Label htmlFor={`price-${range}`}>{range}</Label>
            </div>
          ))}
        </div>
      </div>

      <Button 
        variant="outline" 
        className="w-full mt-4 flex items-center gap-2 transition-all duration-200 hover:bg-primary hover:text-white"
        onClick={onReset}
      >
        <RotateCcw className="w-4 h-4" />
        Reset Filters
      </Button>
    </div>
  );
};

export default FiltersSidebar;