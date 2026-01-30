'use client';

import Link from 'next/link';
import { ArrowLeft, Bookmark } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

type FundLike = {
  id: string;
  name: string;
  type: 'GREEN_BOND' | 'INVIT' | 'GREEN_FUND';
  description?: string | null;
};

function formatFundType(type: FundLike['type']) {
  if (type === 'GREEN_FUND') return 'Green Fund';
  if (type === 'GREEN_BOND') return 'Green Bond';
  return 'InvIT';
}

export function FundHeader({ fund }: { fund: FundLike }) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistBusy, setWatchlistBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/watchlist', { signal: controller.signal });
        const data: { success: boolean; data: Array<{ fund: { id: string } }> } = await res.json();
        if (data.success) {
          setInWatchlist(data.data.some((item) => item.fund.id === fund.id));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // Ignore watchlist errors in the header for demo resilience.
      }
    })();

    return () => controller.abort();
  }, [fund.id]);

  const toggleWatchlist = async () => {
    if (watchlistBusy) return;
    setWatchlistBusy(true);
    try {
      if (inWatchlist) {
        const res = await fetch(`/api/watchlist/${fund.id}`, { method: 'DELETE' });
        const data: { success: boolean } = await res.json();
        if (data.success) setInWatchlist(false);
      } else {
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fundId: fund.id }),
        });
        const data: { success: boolean } = await res.json();
        if (data.success) setInWatchlist(true);
      }
    } finally {
      setWatchlistBusy(false);
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-gray-900">
      <div className="p-4 flex items-start gap-3">
        <Link href="/discover" className="p-2 -ml-2 -mt-2" aria-label="Back to Discover">
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base font-semibold truncate">{fund.name}</h1>
              <p className="text-xs text-gray-500">{formatFundType(fund.type)}</p>
            </div>
          </div>

          {fund.description && <p className="text-sm text-gray-400 mt-3">{fund.description}</p>}
        </div>

        <button
          type="button"
          onClick={toggleWatchlist}
          disabled={watchlistBusy}
          className={cn('p-2 -mt-2', inWatchlist ? 'text-blue-500' : 'text-gray-400', watchlistBusy && 'opacity-60')}
          aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          <Bookmark className={cn('w-5 h-5', inWatchlist && 'fill-current')} />
        </button>
      </div>
    </div>
  );
}
