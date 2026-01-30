'use client';

import { Card } from '@/components/ui/Card';

interface Redemption {
  id: string;
  userName: string;
  userEmail: string;
  productName: string | null;
  productPrice: string | null;
  creditsRedeemed: string | null;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

interface RedemptionsTableProps {
  redemptions: Redemption[];
}

export function RedemptionsTable({ redemptions }: RedemptionsTableProps) {
  if (redemptions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-[#8E8E93]">No redemptions yet</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" padding="none">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2C2C2E]">
              <th className="text-left text-[#8E8E93] text-sm font-medium px-4 py-3">User</th>
              <th className="text-left text-[#8E8E93] text-sm font-medium px-4 py-3">Product</th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">Redeemed</th>
              <th className="text-center text-[#8E8E93] text-sm font-medium px-4 py-3">Status</th>
              <th className="text-right text-[#8E8E93] text-sm font-medium px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {redemptions.map((redemption) => (
              <tr
                key={redemption.id}
                className="border-b border-[#2C2C2E] last:border-b-0 hover:bg-[#2C2C2E]/30"
              >
                <td className="px-4 py-4">
                  <div>
                    <p className="text-sm text-white">{redemption.userName || 'Unknown'}</p>
                    <p className="text-xs text-[#8E8E93]">{redemption.userEmail}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div>
                    <p className="text-sm text-white">{redemption.productName || '—'}</p>
                    <p className="text-xs text-[#8E8E93]">
                      Rs. {Number.parseFloat(redemption.productPrice || '0').toLocaleString('en-IN')}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-white font-medium">
                    Rs. {Number.parseFloat(redemption.creditsRedeemed || '0').toLocaleString('en-IN')}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      redemption.status === 'APPROVED'
                        ? 'bg-[#22C55E]/10 text-[#22C55E]'
                        : redemption.status === 'PENDING'
                          ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                          : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {redemption.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-[#8E8E93] text-sm">
                    {new Date(redemption.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

