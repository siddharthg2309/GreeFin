'use client';

import { useMemo, useState } from 'react';

import { Card } from '@/components/ui/Card';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';

type ChartPoint = { date: string; price: number };
type PriceHistory = Record<string, ChartPoint[]>;

function buildPath(points: ChartPoint[], width: number, height: number) {
  if (points.length < 2) return { path: '', min: 0, max: 0, first: 0, last: 0 };

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const first = points[0]?.price ?? 0;
  const last = points[points.length - 1]?.price ?? 0;

  const paddingY = (max - min) * 0.1 || 1;
  const domainMin = min - paddingY;
  const domainMax = max + paddingY;

  const scaleX = (index: number) => (index / (points.length - 1)) * width;
  const scaleY = (price: number) => height - ((price - domainMin) / (domainMax - domainMin)) * height;

  const d = points
    .map((p, i) => {
      const x = scaleX(i);
      const y = scaleY(p.price);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return { path: d, min, max, first, last };
}

export function PriceChart({ priceHistory }: { priceHistory: PriceHistory }) {
  const periods = Object.keys(priceHistory);
  const initialPeriod = periods.includes('1Y') ? '1Y' : periods[0] ?? '1Y';
  const [period, setPeriod] = useState(initialPeriod);

  const { path, min, max, first, last } = useMemo(() => {
    const points = priceHistory[period] ?? [];
    return buildPath(points, 320, 160);
  }, [priceHistory, period]);

  const change = last - first;
  const changePct = first ? (change / first) * 100 : 0;
  const isUp = change >= 0;

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">NAV Performance</h2>

      <Card className="p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs text-gray-500">{period} change</p>
            <p className={cn('text-lg font-semibold', isUp ? 'text-green-500' : 'text-red-500')}>
              {formatPercent(changePct)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Low / High</p>
            <p className="text-sm text-gray-300">
              {formatCurrency(min)} / {formatCurrency(max)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <svg viewBox="0 0 320 160" className="w-full h-40">
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(34, 197, 94, 0.25)" />
                <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
              </linearGradient>
            </defs>

            {path ? (
              <>
                <path d={`${path} L 320 160 L 0 160 Z`} fill="url(#fillGradient)" />
                <path d={path} fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" />
              </>
            ) : (
              <text x="50%" y="50%" textAnchor="middle" className="fill-gray-500 text-sm">
                Not enough data
              </text>
            )}
          </svg>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1 rounded-full text-sm border',
                p === period ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-300'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
