import { CheckCircle, FileText, TrendingUp, Wallet } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'invit_created' | 'bond_created' | 'csr_allocated' | 'credit_redeemed';
  title: string;
  amount?: number;
  timestamp: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const activityIcons = {
  invit_created: TrendingUp,
  bond_created: FileText,
  csr_allocated: Wallet,
  credit_redeemed: CheckCircle,
};

const activityColors = {
  invit_created: 'text-purple-500 bg-purple-500/10',
  bond_created: 'text-blue-500 bg-blue-500/10',
  csr_allocated: 'text-green-500 bg-green-500/10',
  credit_redeemed: 'text-yellow-500 bg-yellow-500/10',
} satisfies Record<Activity['type'], string>;

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <h3 className="text-lg font-medium mb-4">Recent Activity</h3>

      {activities.length === 0 ? (
        <p className="text-[#8E8E93] text-center py-8">No recent activity</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];

            return (
              <div key={activity.id} className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.title}</p>
                  <p className="text-xs text-[#8E8E93]">{formatDate(activity.timestamp)}</p>
                </div>
                {activity.amount !== undefined && (
                  <p className="text-sm font-medium">{formatCurrency(activity.amount)}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

