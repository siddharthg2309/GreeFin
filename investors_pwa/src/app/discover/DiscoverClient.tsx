'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import type { Fund } from '@/db/schema';
import { FundCard } from '@/components/discover/FundCard';
import { FundTypeGrid } from '@/components/discover/FundTypeGrid';
import { SearchBar } from '@/components/discover/SearchBar';

export function DiscoverClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const type = searchParams.get('type');

  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'explore' | 'watchlist'>('explore');

  useEffect(() => {
    if (!query && !type) {
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
  }, [query, type]);

  const showResults = Boolean(query || type);

  return (
    <div className="p-4">
      <div className="flex gap-6 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('explore')}
          className={`pb-2 font-medium ${
            activeTab === 'explore' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500'
          }`}
        >
          Explore
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('watchlist')}
          className={`pb-2 font-medium ${
            activeTab === 'watchlist' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500'
          }`}
        >
          Watchlist
        </button>
      </div>

      <SearchBar defaultValue={query || ''} onFilterClick={() => {}} />

      <div className="mt-6">
        {activeTab === 'explore' ? (
          showResults ? (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                {funds.length} results
                {type && ` for ${type.replace('_', ' ').toLowerCase()}`}
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

