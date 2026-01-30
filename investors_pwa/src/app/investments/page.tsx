'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, ClipboardList, Repeat } from 'lucide-react';

import { IconWrapper } from '@/components/ui/IconWrapper';
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
      {/* Tab Header - Sharp Level Style */}
      <div className="flex items-center justify-center gap-16 -mx-4 px-5 py-4 mb-6 bg-[#262626] border-b border-[#333333]">
        {(['portfolio', 'sips', 'orders'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setLoading(true);
              setData([]);
              setActiveTab(tab);
            }}
            className={`relative pb-3 text-[15px] font-medium capitalize transition-colors ${activeTab === tab ? 'text-white' : 'text-[#9B9B9B] hover:text-gray-400'
              }`}
          >
            {tab === 'sips' ? 'SIPs' : tab}
            {/* Active indicator - centered blue bar */}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-blue-500 rounded-sm" />
            )}
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
      {holdings.map((item, index) => (
        <div
          key={item.id}
          className={`flex items-center gap-4 bg-[#262626] px-5 py-4 rounded-sm ${index !== holdings.length - 1 ? 'border-b border-[#333333]' : ''
            }`}
        >
          <IconWrapper
            icon={Briefcase}
            size={24}
            primaryClassName="text-blue-400"
            secondaryClassName="text-blue-400"
            glowClassName="bg-blue-500/10"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-white truncate">{item.fund.name}</h3>
            <p className="text-[13px] text-[#9B9B9B] leading-relaxed">
              {item.quantity} units @ {formatCurrency(item.avgBuyPrice)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[15px] font-semibold text-white">{formatCurrency(item.currentValue)}</p>
            <p className={`text-[13px] ${Number.parseFloat(item.pnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(item.pnl)} ({formatPercent(Number.parseFloat(item.pnlPercent))})
            </p>
          </div>
        </div>
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
      {sips.map(({ sip, fund }, index) => (
        <div
          key={sip.id}
          className={`flex items-center gap-4 bg-[#262626] px-5 py-4 rounded-sm ${index !== sips.length - 1 ? 'border-b border-[#333333]' : ''
            }`}
        >
          <IconWrapper
            icon={Repeat}
            size={24}
            primaryClassName="text-emerald-400"
            secondaryClassName="text-emerald-400"
            glowClassName="bg-emerald-500/10"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-white truncate">{fund.name}</h3>
              <span
                className={`text-[11px] px-2 py-1 rounded-sm ${sip.status === 'ACTIVE'
                    ? 'bg-green-500/20 text-green-500'
                    : sip.status === 'PAUSED'
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : 'bg-red-500/20 text-red-500'
                  }`}
              >
                {sip.status}
              </span>
            </div>
            <p className="text-[13px] text-[#9B9B9B] leading-relaxed">
              {formatCurrency(sip.installmentAmount)} / {sip.frequency.toLowerCase()}
            </p>
            <p className="text-[13px] text-[#9B9B9B] leading-relaxed">
              Next: {sip.nextExecutionDate ? new Date(sip.nextExecutionDate).toLocaleDateString('en-IN') : '—'}
            </p>
            {sip.status === 'ACTIVE' && (
              <button
                type="button"
                onClick={() => handleStatusChange(sip.id, 'PAUSED')}
                className="text-[13px] text-yellow-500 mt-2"
              >
                Pause SIP
              </button>
            )}
            {sip.status === 'PAUSED' && (
              <button
                type="button"
                onClick={() => handleStatusChange(sip.id, 'ACTIVE')}
                className="text-[13px] text-green-500 mt-2"
              >
                Resume SIP
              </button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

function OrdersList({ orders }: { orders: OrderEntry[] }) {
  return (
    <>
      {orders.map(({ order, fund }, index) => (
        <div
          key={order.id}
          className={`flex items-center gap-4 bg-[#262626] px-5 py-4 rounded-sm ${index !== orders.length - 1 ? 'border-b border-[#333333]' : ''
            }`}
        >
          <IconWrapper
            icon={ClipboardList}
            size={24}
            primaryClassName="text-gray-400"
            secondaryClassName="text-gray-400"
            glowClassName="bg-gray-500/10"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-white truncate">{fund.name}</h3>
              <span
                className={`text-[11px] px-2 py-1 rounded-sm ${order.status === 'COMPLETED'
                    ? 'bg-green-500/20 text-green-500'
                    : order.status === 'PENDING'
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : 'bg-red-500/20 text-red-500'
                  }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-[13px] text-[#9B9B9B] leading-relaxed">
              {order.type} • {formatCurrency(order.amount)}
            </p>
            <p className="text-[13px] text-[#9B9B9B] leading-relaxed">
              {new Date(order.createdAt).toLocaleDateString('en-IN')}
            </p>
            {order.greenCreditsEarned && Number.parseFloat(order.greenCreditsEarned) > 0 && (
              <p className="text-[13px] text-green-500 mt-2">
                +{formatCurrency(order.greenCreditsEarned)} Green Credits earned
              </p>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
