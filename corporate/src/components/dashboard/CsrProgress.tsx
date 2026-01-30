import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

interface CsrProgressProps {
  totalAllocated: number;
  utilized: number;
  remaining: number;
}

export function CsrProgress({ totalAllocated, utilized, remaining }: CsrProgressProps) {
  const utilizationPercent = totalAllocated > 0 ? (utilized / totalAllocated) * 100 : 0;

  return (
    <Card>
      <h3 className="text-lg font-medium mb-4">CSR Fund Utilization</h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#8E8E93]">Utilized</span>
            <span>{utilizationPercent.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-[#121212] rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${utilizationPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#2C2C2E]">
          <div>
            <p className="text-sm text-[#8E8E93]">Total Allocated</p>
            <p className="text-lg font-semibold">{formatCurrency(totalAllocated)}</p>
          </div>
          <div>
            <p className="text-sm text-[#8E8E93]">Utilized</p>
            <p className="text-lg font-semibold text-green-500">{formatCurrency(utilized)}</p>
          </div>
          <div>
            <p className="text-sm text-[#8E8E93]">Remaining</p>
            <p className="text-lg font-semibold text-blue-500">{formatCurrency(remaining)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

