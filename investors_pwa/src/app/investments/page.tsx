'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { formatCurrency, formatPercent } from '@/lib/utils';

type Tab = 'portfolio' | 'sips' | 'orders';

type PortfolioHolding = {
  id: string;
  fund: { id: string; name: string; type: string; nav: string };
  quantity: string;
  avgBuyPrice: string;
  investedAmount: string;
  currentValue: string;
  pnl: string;
  pnlPercent: string;
};

type SipStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

type SipEntry = {
  sip: {
    id: string;
    installmentAmount: string;
    frequency: 'WEEKLY' | 'MONTHLY';
    nextExecutionDate: string | null;
    status: SipStatus;
  };
  fund: { id: string; name: string; type: string; nav: string; minInvestment: string };
};

type OrderStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

type OrderEntry = {
  order: {
    id: string;
    type: string;
    amount: string;
    createdAt: string;
    status: OrderStatus;
    greenCreditsEarned: string | null;
  };
  fund: { id: string; name: string; type: string; nav: string };
};

export default function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('portfolio');
  const [data, setData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const endpoint =
          activeTab === 'portfolio' ? '/api/portfolio' : activeTab === 'sips' ? '/api/sips' : '/api/orders';

        const res = await fetch(endpoint, { signal: controller.signal });
        const result: { success: boolean; data: unknown[] } = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          setData([]);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Error fetching data:', error);
        setData([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [activeTab, refreshToken]);

  const refetch = () => setRefreshToken((n) => n + 1);

  return (
    <div className="p-4">
      <div className="flex gap-6 mb-6 border-b border-gray-800">
        {(['portfolio', 'sips', 'orders'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              // Prevent rendering the previous tab's data under the new tab before fetch completes.
              setLoading(true);
              setData([]);
              setActiveTab(tab);
            }}
            className={`pb-3 font-medium capitalize ${
              activeTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-gray-500'
            }`}
          >
            {tab === 'sips' ? 'SIPs' : tab}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : data.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-4">
          {activeTab === 'portfolio' && <PortfolioList holdings={data as PortfolioHolding[]} />}
          {activeTab === 'sips' && <SipsList sips={data as SipEntry[]} onUpdate={refetch} />}
          {activeTab === 'orders' && <OrdersList orders={data as OrderEntry[]} />}
        </div>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Briefcase className="w-16 h-16 text-blue-500 mb-4" />
      <p className="text-lg mb-2">
        {tab === 'portfolio'
          ? "You don't have any investments"
          : tab === 'sips'
            ? "You don't have any SIPs"
            : 'No orders yet'}
      </p>
      <Link href="/discover" className="text-blue-500">
        {tab === 'portfolio' ? 'Invest now' : 'Explore funds'}
      </Link>
    </div>
  );
}

function PortfolioList({ holdings }: { holdings: PortfolioHolding[] }) {
  return (
    <>
      {holdings.map((item) => (
        <Card key={item.id}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">{item.fund.name}</h3>
              <p className="text-sm text-gray-500">
                {item.quantity} units @ {formatCurrency(item.avgBuyPrice)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatCurrency(item.currentValue)}</p>
              <p className={`text-sm ${Number.parseFloat(item.pnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(item.pnl)} ({formatPercent(Number.parseFloat(item.pnlPercent))})
              </p>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}

function SipsList({ sips, onUpdate }: { sips: SipEntry[]; onUpdate: () => void }) {
  const handleStatusChange = async (sipId: string, newStatus: SipStatus) => {
    try {
      await fetch(`/api/sips/${sipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating SIP:', error);
    }
  };

  return (
    <>
      {sips.map(({ sip, fund }) => (
        <Card key={sip.id}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-medium">{fund.name}</h3>
              <p className="text-sm text-gray-500">
                {formatCurrency(sip.installmentAmount)} / {sip.frequency.toLowerCase()}
              </p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${
                sip.status === 'ACTIVE'
                  ? 'bg-green-500/20 text-green-500'
                  : sip.status === 'PAUSED'
                    ? 'bg-yellow-500/20 text-yellow-500'
                    : 'bg-red-500/20 text-red-500'
              }`}
            >
              {sip.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Next:{' '}
            {sip.nextExecutionDate ? new Date(sip.nextExecutionDate).toLocaleDateString('en-IN') : '—'}
          </p>
          {sip.status === 'ACTIVE' && (
            <button type="button" onClick={() => handleStatusChange(sip.id, 'PAUSED')} className="text-sm text-yellow-500">
              Pause SIP
            </button>
          )}
          {sip.status === 'PAUSED' && (
            <button type="button" onClick={() => handleStatusChange(sip.id, 'ACTIVE')} className="text-sm text-green-500">
              Resume SIP
            </button>
          )}
        </Card>
      ))}
    </>
  );
}

function OrdersList({ orders }: { orders: OrderEntry[] }) {
  return (
    <>
      {orders.map(({ order, fund }) => (
        <Card key={order.id}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">{fund.name}</h3>
              <p className="text-sm text-gray-500">
                {order.type} • {formatCurrency(order.amount)}
              </p>
              <p className="text-xs text-gray-600">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${
                order.status === 'COMPLETED'
                  ? 'bg-green-500/20 text-green-500'
                  : order.status === 'PENDING'
                    ? 'bg-yellow-500/20 text-yellow-500'
                    : 'bg-red-500/20 text-red-500'
              }`}
            >
              {order.status}
            </span>
          </div>
          {order.greenCreditsEarned && Number.parseFloat(order.greenCreditsEarned) > 0 && (
            <p className="text-xs text-green-500 mt-2">
              +{formatCurrency(order.greenCreditsEarned)} Green Credits earned
            </p>
          )}
        </Card>
      ))}
    </>
  );
}
