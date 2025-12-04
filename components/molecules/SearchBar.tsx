'use client';

import { useState } from 'react';
import { Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onCategoryChange?: (category: string) => void;
  categories?: string[];
  placeholder?: string;
  showCategoryFilter?: boolean;
}

export function SearchBar({ 
  onSearch, 
  onCategoryChange,
  categories = [],
  placeholder = 'Search...',
  showCategoryFilter = false 
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    if (onCategoryChange) {
      onCategoryChange(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pr-10"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
      
      {showCategoryFilter && categories.length > 0 && (
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      <Button onClick={handleSearch} className="w-full sm:w-auto">
        Search
      </Button>
    </div>
  );
}
