'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Home, Search, User } from 'lucide-react';

import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/investments', icon: Building2, label: 'Investments' },
  { href: '/discover', icon: Search, label: 'Discover' },
  { href: '/account', icon: User, label: 'Account' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2',
                isActive ? 'text-blue-500' : 'text-gray-500'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

