import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { useState } from "react";

interface MeetingFiltersProps {
  categories: string[];
  onSearch: (query: string) => void;
  onFilterCategories: (categories: string[]) => void;
  onFilterDates: (range: DateRange | undefined) => void;
  onReset: () => void;
}

export default function MeetingFilters({
  categories,
  onSearch,
  onFilterCategories,
  onFilterDates,
  onReset,
}: MeetingFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(newCategories);
    onFilterCategories(newCategories);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setSearchQuery("");
    onReset();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button type="submit">Search</Button>
        {(searchQuery || selectedCategories.length > 0) && (
          <Button variant="outline" onClick={handleReset} size="icon">
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategories.includes(category) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleCategoryToggle(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
        <DatePickerWithRange
          onChange={onFilterDates}
          className="w-[300px]"
        />
      </div>
    </div>
  );
}
