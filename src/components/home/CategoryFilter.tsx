import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (value: string) => void;
  categories: string[];
}

const CategoryFilter = ({ selectedCategory, onCategoryChange, categories }: CategoryFilterProps) => {
  return (
    <div className="mb-6 max-w-xs mx-auto md:max-w-sm">
      <Select
        value={selectedCategory || "All"}
        onValueChange={onCategoryChange}
      >
        <SelectTrigger className="h-9 md:h-10">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategoryFilter;