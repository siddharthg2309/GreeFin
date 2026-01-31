'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const navSections = [
  {
    items: [{ href: '/', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    title: 'Issue Instruments',
    items: [
      { href: '/invits', icon: TrendingUp, label: 'InvITs' },
      { href: '/bonds', icon: FileText, label: 'Green Bonds' },
    ],
  },
  {
    title: 'CSR & Impact',
    items: [{ href: '/csr-funds', icon: Wallet, label: 'CSR Funds' }],
  },
  {
    items: [{ href: '/settings', icon: Settings, label: 'Settings' }],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-black border-r border-[#2C2C2E] flex flex-col">
      <div className="p-6 border-b border-[#2C2C2E]">
        <Link href="/" className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-green-500" />
          <span className="text-lg font-semibold text-white">GreenFin</span>
          <span className="text-xs text-[#8E8E93] ml-1">Corporate</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <p className="text-xs text-[#8E8E93] uppercase tracking-wider mb-2 px-3">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                        isActive
                          ? 'bg-[#1C1C1E] text-white'
                          : 'text-[#8E8E93] hover:text-white hover:bg-[#1C1C1E]'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-[#2C2C2E]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-white">TP</span>
          </div>
          <div>
            <p className="text-sm text-white">Tata Power</p>
            <p className="text-xs text-[#8E8E93]">Corporate</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
