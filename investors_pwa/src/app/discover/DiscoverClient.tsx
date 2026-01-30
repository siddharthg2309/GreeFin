'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

import type { Fund } from '@/db/schema';
import { FundCard } from '@/components/discover/FundCard';
import { FundTypeGrid } from '@/components/discover/FundTypeGrid';
import { SearchBar } from '@/components/discover/SearchBar';
import { Button } from '@/components/ui/Button';

export function DiscoverClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q');
  const type = searchParams.get('type');
  const minInvestmentParam = searchParams.get('minInvestment');

  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'explore' | 'watchlist'>('explore');
  const [filterOpen, setFilterOpen] = useState(false);
  const [maxMinInvestment, setMaxMinInvestment] = useState<number | null>(
    minInvestmentParam ? Number(minInvestmentParam) : null
  );

  useEffect(() => {
    setMaxMinInvestment(minInvestmentParam ? Number(minInvestmentParam) : null);
  }, [minInvestmentParam]);

  useEffect(() => {
    if (!query && !type && !minInvestmentParam) {
      setFunds([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    (async () => {
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (type) params.set('type', type);
        if (minInvestmentParam) params.set('minInvestment', minInvestmentParam);

        const res = await fetch(`/api/funds?${params}`, { signal: controller.signal });
        const data: { success: boolean; data: Fund[] } = await res.json();

        if (data.success) {
          setFunds(data.data);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Error fetching funds:', error);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [query, type, minInvestmentParam]);

  const showResults = Boolean(query || type || minInvestmentParam);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (maxMinInvestment) {
      params.set('minInvestment', String(maxMinInvestment));
    } else {
      params.delete('minInvestment');
    }
    const qs = params.toString();
    router.push(qs ? `/discover?${qs}` : '/discover');
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setMaxMinInvestment(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('minInvestment');
    const qs = params.toString();
    router.push(qs ? `/discover?${qs}` : '/discover');
    setFilterOpen(false);
  };

  return (
    <div className="p-4">
      {/* Tab Header - Zerodha Style */}
      <div className="flex gap-8 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('explore')}
          className={`relative pb-3 text-[15px] font-medium transition-colors ${activeTab === 'explore' ? 'text-white' : 'text-[#9B9B9B] hover:text-gray-400'
            }`}
        >
          Explore
          {activeTab === 'explore' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-blue-500 rounded-sm" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('watchlist')}
          className={`relative pb-3 text-[15px] font-medium transition-colors ${activeTab === 'watchlist' ? 'text-white' : 'text-[#9B9B9B] hover:text-gray-400'
            }`}
        >
          Watchlist
          {activeTab === 'watchlist' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-blue-500 rounded-sm" />
          )}
        </button>
      </div>

      <SearchBar defaultValue={query || ''} onFilterClick={() => setFilterOpen(true)} />

      {filterOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-neutral-900 w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Filters</h2>
              <button type="button" onClick={() => setFilterOpen(false)} className="p-2" aria-label="Close filters">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-3">Max minimum investment</p>
              <div className="flex flex-wrap gap-2">
                {[500, 1000, 5000, 10000].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMaxMinInvestment(value)}
                    className={`px-3 py-2 rounded-full border text-sm ${maxMinInvestment === value
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-neutral-700 text-gray-200'
                      }`}
                  >
                    ₹{value.toLocaleString('en-IN')}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setMaxMinInvestment(null)}
                  className={`px-3 py-2 rounded-full border text-sm ${maxMinInvestment === null
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-neutral-700 text-gray-200'
                    }`}
                >
                  Any
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {maxMinInvestment ? `Showing funds with min investment ≤ ₹${maxMinInvestment.toLocaleString('en-IN')}` : 'No min investment filter'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={clearFilters}>
                Clear
              </Button>
              <Button className="flex-1" onClick={applyFilters}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        {activeTab === 'explore' ? (
          showResults ? (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                {funds.length} results
                {type && ` for ${type.replace('_', ' ').toLowerCase()}`}
                {minInvestmentParam && ` • min ≤ ₹${Number(minInvestmentParam).toLocaleString('en-IN')}`}
              </p>

              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : (
                <div className="space-y-4">
                  {funds.map((fund) => (
                    <FundCard key={fund.id} fund={fund} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <FundTypeGrid />
          )
        ) : (
          <WatchlistSection />
        )}
      </div>
    </div>
  );
}

function WatchlistSection() {
  type WatchlistItem = { fund: Fund };

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/watchlist', { signal: controller.signal });
        const data: { success: boolean; data: WatchlistItem[] } = await res.json();
        if (data.success) {
          setWatchlist(data.data);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Error fetching watchlist:', error);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading watchlist...</p>;
  }

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No funds in your watchlist</p>
        <p className="text-sm text-gray-600 mt-2">Add funds to track them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {watchlist.map((item) => (
        <FundCard key={item.fund.id} fund={item.fund} />
      ))}
    </div>
  );
}
