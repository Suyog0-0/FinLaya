'use client';

import { Search, SlidersHorizontal } from 'lucide-react';

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
    <div className="flex gap-3 mb-6">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        />
      </div>
      <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-600">
        <SlidersHorizontal size={15} className="text-gray-400" />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="appearance-none bg-transparent outline-none cursor-pointer text-gray-600"
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  );
}