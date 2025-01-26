import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface FiltersSidebarProps {
  onFilterChange: (type: string, value: any) => void;
}

const FiltersSidebar = ({ onFilterChange }: FiltersSidebarProps) => {
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
    <div className="w-64 bg-white dark:bg-gray-800 p-4 rounded-lg space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox 
                id={`category-${category}`}
                onCheckedChange={(checked) => onFilterChange("category", { value: category, checked })}
              />
              <Label htmlFor={`category-${category}`}>{category}</Label>
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
            defaultValue={[0, 1000]}
            max={1000}
            step={50}
            onValueChange={(value) => onFilterChange("price", value)}
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
                onCheckedChange={(checked) => onFilterChange("priceRange", { value: range, checked })}
              />
              <Label htmlFor={`price-${range}`}>{range}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FiltersSidebar;