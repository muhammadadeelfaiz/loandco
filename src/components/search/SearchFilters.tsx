import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchFiltersProps {
  sortBy: string;
  setSortBy: (value: string) => void;
  priceRange: string;
  setPriceRange: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  distanceRange: string;
  setDistanceRange: (value: string) => void;
}

const SearchFilters = ({
  sortBy,
  setSortBy,
  priceRange,
  setPriceRange,
  category,
  setCategory,
  distanceRange,
  setDistanceRange,
}: SearchFiltersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger>
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default</SelectItem>
          <SelectItem value="price-asc">Price: Low to High</SelectItem>
          <SelectItem value="price-desc">Price: High to Low</SelectItem>
          <SelectItem value="name-asc">Name: A to Z</SelectItem>
          <SelectItem value="name-desc">Name: Z to A</SelectItem>
          <SelectItem value="distance">Distance</SelectItem>
        </SelectContent>
      </Select>

      <Select value={priceRange} onValueChange={setPriceRange}>
        <SelectTrigger>
          <SelectValue placeholder="Price Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Prices</SelectItem>
          <SelectItem value="0-50">Under 50 AED</SelectItem>
          <SelectItem value="50-100">50 - 100 AED</SelectItem>
          <SelectItem value="100-500">100 - 500 AED</SelectItem>
          <SelectItem value="500">500 AED and above</SelectItem>
        </SelectContent>
      </Select>

      <Select value={distanceRange} onValueChange={setDistanceRange}>
        <SelectTrigger>
          <SelectValue placeholder="Distance Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any Distance</SelectItem>
          <SelectItem value="5">Within 5 km</SelectItem>
          <SelectItem value="10">Within 10 km</SelectItem>
          <SelectItem value="20">Within 20 km</SelectItem>
          <SelectItem value="50">Within 50 km</SelectItem>
        </SelectContent>
      </Select>

      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger>
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="electronics">Electronics</SelectItem>
          <SelectItem value="clothing">Clothing</SelectItem>
          <SelectItem value="food">Food</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SearchFilters;