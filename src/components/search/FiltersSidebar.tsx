import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface FiltersSidebarProps {
  onFilterChange: (type: string, value: any) => void;
}

const FiltersSidebar = ({ onFilterChange }: FiltersSidebarProps) => {
  const brands = ["Nike", "Adidas", "Puma", "New Balance", "Under Armour", "Reebok"];
  const colors = [
    "black", "red", "purple", "pink", "gray", "white",
    "teal", "lime", "violet", "brown", "silver", "beige"
  ];
  const sizes = [
    "36", "36.5", "37", "37.5", "38", "38.5",
    "39", "39.5", "40", "40.5", "41", "41.5"
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 p-4 rounded-lg space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Gender</h3>
        <div className="space-y-2">
          {["Men", "Women", "Kids", "Girls", "Boys", "Unisex"].map((gender) => (
            <div key={gender} className="flex items-center space-x-2">
              <Checkbox 
                id={`gender-${gender}`}
                onCheckedChange={(checked) => onFilterChange("gender", { value: gender, checked })}
              />
              <Label htmlFor={`gender-${gender}`}>{gender}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Brands</h3>
        <div className="space-y-2">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox 
                id={`brand-${brand}`}
                onCheckedChange={(checked) => onFilterChange("brand", { value: brand, checked })}
              />
              <Label htmlFor={`brand-${brand}`}>{brand}</Label>
            </div>
          ))}
        </div>
        <button className="text-sm text-primary mt-2">see more</button>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Colors</h3>
        <div className="grid grid-cols-6 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              className={`w-6 h-6 rounded-full border border-gray-200 hover:ring-2 ring-primary`}
              style={{ backgroundColor: color }}
              onClick={() => onFilterChange("color", color)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Shoe Size</h3>
        <div className="grid grid-cols-4 gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              className="px-2 py-1 text-sm border rounded hover:bg-primary hover:text-white transition-colors"
              onClick={() => onFilterChange("size", size)}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Price</h3>
        <div className="px-2">
          <Slider
            defaultValue={[0, 600]}
            max={600}
            step={50}
            onValueChange={(value) => onFilterChange("price", value)}
          />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>0 AED</span>
            <span>600 AED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltersSidebar;