
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchBarProps {
  userRole: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const SearchBar = ({ userRole, searchTerm, onSearchChange, onSubmit }: SearchBarProps) => {
  return (
    <form onSubmit={onSubmit} className="w-full max-w-3xl mx-auto relative">
      <Input 
        type="search" 
        placeholder="Search products..."
        className="w-full pl-12 h-12 bg-white shadow-sm hover:shadow-md transition-shadow"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8E9196] h-5 w-5" />
      <Button 
        type="submit"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-secondary transition-colors"
        size="sm"
      >
        Search
      </Button>
    </form>
  );
};

export default SearchBar;
