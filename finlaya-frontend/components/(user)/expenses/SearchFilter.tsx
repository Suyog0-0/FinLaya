'use client';

import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';

interface SearchFilterProps {
  search: string;
  setSearch: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  categories: string[];
}

export default function SearchFilter({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  categories,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search 
          size={18} 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
        />
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 bg-white transition-all"
        />
      </div>

      {/* Category Filter */}
      <label className="relative inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer min-w-[180px]">
        <SlidersHorizontal size={14} className="text-gray-400" />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="appearance-none bg-transparent outline-none cursor-pointer text-gray-700 font-medium pr-5 flex-1"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <ChevronDown 
          size={14} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
        />
      </label>
    </div>
  );
}