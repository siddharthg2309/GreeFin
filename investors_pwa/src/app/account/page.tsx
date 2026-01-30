import Link from 'next/link';
import {
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  Leaf,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { mockUser } from '@/lib/mock-user';
import { formatCurrency } from '@/lib/utils';
import { getBaseUrl } from '@/lib/get-base-url';

async function getGreenCredits() {
  try {
    const baseUrl = await getBaseUrl();
    const res = await fetch(`${baseUrl}/api/green-credits`, { cache: 'no-store' });
    if (!res.ok) return { balance: 0 };
    const json = (await res.json()) as { success: boolean; data?: { balance: number } };
    if (!json?.success) return { balance: 0 };
    return json.data ?? { balance: 0 };
  } catch {
    return { balance: 0 };
  }
}

function getInitials(name: string) {
  const parts = name
    .split(' ')
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

export default async function AccountPage() {
  const { balance } = await getGreenCredits();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Account</h1>
      </div>

      <Card className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 text-xl font-bold">{getInitials(mockUser.name)}</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold">{mockUser.name}</h2>
          <p className="text-sm text-gray-500">{mockUser.email}</p>
        </div>
      </Card>

      <Link href="/account/claim-credits">
        <Card className="mb-6 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Green Credits Balance</p>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(balance)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-500">
              <span className="text-sm">Claim</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Card>
      </Link>

      <div className="space-y-2">
        <MenuItem icon={CreditCard} label="Payments" description="Manage payment methods" href="#" />
        <MenuItem icon={HelpCircle} label="Support" description="Get help with your account" href="#" />
        <MenuItem
          icon={FileText}
          label="Terms & Conditions"
          description="Read our terms of service"
          href="#"
        />
      </div>

      <div className="mt-8">
        <Button variant="ghost" className="w-full justify-start text-red-500">
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  description,
  href,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-4 hover:bg-gray-800 transition-colors">
        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-500" />
      </Card>
    </Link>
  );
}
