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
    <form onSubmit={onSubmit} className="max-w-2xl mx-auto relative">
      <Input 
        type="search" 
        placeholder={userRole === "customer" ? "Search for products..." : "Search your inventory..."}
        className="pl-10 h-11 md:h-12 text-base md:text-lg"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      <Button 
        type="submit"
        className="absolute right-2 top-1/2 transform -translate-y-1/2"
        size="sm"
      >
        Search
      </Button>
    </form>
  );
};

export default SearchBar;