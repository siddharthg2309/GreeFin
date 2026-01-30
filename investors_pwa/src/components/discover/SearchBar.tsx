'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/Input';

interface SearchBarProps {
  defaultValue?: string;
  onFilterClick?: () => void;
}

export function SearchBar({ defaultValue = '', onFilterClick }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/discover?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search green funds..."
          className="pl-10"
        />
      </div>
      {onFilterClick && (
        <button type="button" onClick={onFilterClick} className="p-2 bg-gray-800 rounded-lg" aria-label="Filters">
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      )}
    </form>
  );
}

