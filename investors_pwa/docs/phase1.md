# Phase 1: Project Setup & Database

## Overview
Initialize the Next.js project, set up database schema with Drizzle ORM, create base UI components, and configure PWA.

---

## 1.1 Project Initialization

### Commands
```bash
cd /Users/pragit/Documents/GitHub/Chennai-Sharks_9.20_SDG-9/investors_pwa

# Create Next.js app
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install dependencies
npm install @neondatabase/serverless drizzle-orm
npm install -D drizzle-kit

# PWA support
npm install next-pwa

# AI Agent (for Phase 4)
npm install @langchain/openai langchain

# UI utilities
npm install clsx tailwind-merge lucide-react
```

### Environment Variables
Create `.env.local`:
```env
DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/greenfin?sslmode=require
OPENROUTER_API_KEY=sk-or-xxx
```

---

## 1.2 Database Schema

### File: `src/db/schema.ts`

```typescript
import { pgTable, uuid, varchar, decimal, timestamp, text, boolean, date, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const fundTypeEnum = pgEnum('fund_type', ['GREEN_BOND', 'INVIT', 'GREEN_FUND']);
export const orderTypeEnum = pgEnum('order_type', ['BUY', 'SELL']);
export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']);
export const sipFrequencyEnum = pgEnum('sip_frequency', ['WEEKLY', 'MONTHLY']);
export const sipStatusEnum = pgEnum('sip_status', ['ACTIVE', 'PAUSED', 'CANCELLED']);
export const claimStatusEnum = pgEnum('claim_status', ['PENDING', 'APPROVED', 'REJECTED']);

// USERS TABLE
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  profilePic: varchar('profile_pic', { length: 500 }),
  greenCredits: decimal('green_credits', { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// FUNDS TABLE
export const funds = pgTable('funds', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: fundTypeEnum('type').notNull(),
  nav: decimal('nav', { precision: 10, scale: 4 }).notNull(),
  minInvestment: decimal('min_investment', { precision: 10, scale: 2 }).notNull(),
  fixedReturn: decimal('fixed_return', { precision: 5, scale: 2 }), // For bonds/invits
  cagr1y: decimal('cagr_1y', { precision: 5, scale: 2 }),
  cagr2y: decimal('cagr_2y', { precision: 5, scale: 2 }),
  cagr3y: decimal('cagr_3y', { precision: 5, scale: 2 }),
  expenseRatio: decimal('expense_ratio', { precision: 4, scale: 2 }),
  launchDate: date('launch_date'),
  description: text('description'),
  logoUrl: varchar('logo_url', { length: 500 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// HOLDINGS TABLE
export const holdings = pgTable('holdings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  fundId: uuid('fund_id').references(() => funds.id).notNull(),
  quantity: decimal('quantity', { precision: 12, scale: 4 }).notNull(),
  avgBuyPrice: decimal('avg_buy_price', { precision: 10, scale: 4 }).notNull(),
  investedAmount: decimal('invested_amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ORDERS TABLE
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  fundId: uuid('fund_id').references(() => funds.id).notNull(),
  type: orderTypeEnum('type').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  quantity: decimal('quantity', { precision: 12, scale: 4 }).notNull(),
  navAtOrder: decimal('nav_at_order', { precision: 10, scale: 4 }).notNull(),
  status: orderStatusEnum('status').default('PENDING'),
  greenCreditsEarned: decimal('green_credits_earned', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// SIPS TABLE
export const sips = pgTable('sips', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  fundId: uuid('fund_id').references(() => funds.id).notNull(),
  installmentAmount: decimal('installment_amount', { precision: 10, scale: 2 }).notNull(),
  frequency: sipFrequencyEnum('frequency').notNull(),
  startDate: date('start_date').notNull(),
  nextExecutionDate: date('next_execution_date'),
  status: sipStatusEnum('status').default('ACTIVE'),
  totalInstallments: decimal('total_installments', { precision: 10, scale: 0 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

// WATCHLIST TABLE
export const watchlist = pgTable('watchlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  fundId: uuid('fund_id').references(() => funds.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// GREEN CREDIT CLAIMS TABLE
export const greenCreditClaims = pgTable('green_credit_claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  productName: varchar('product_name', { length: 255 }),
  productPrice: decimal('product_price', { precision: 12, scale: 2 }),
  uploadedFileUrl: varchar('uploaded_file_url', { length: 500 }),
  aiVerificationResult: text('ai_verification_result'),
  isApproved: boolean('is_approved'),
  creditsRedeemed: decimal('credits_redeemed', { precision: 10, scale: 2 }),
  status: claimStatusEnum('status').default('PENDING'),
  createdAt: timestamp('created_at').defaultNow(),
  processedAt: timestamp('processed_at'),
});

// IMPACT METRICS TABLE
export const impactMetrics = pgTable('impact_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  co2Avoided: decimal('co2_avoided', { precision: 10, scale: 2 }).default('0'), // kg
  cleanEnergyGenerated: decimal('clean_energy_generated', { precision: 10, scale: 2 }).default('0'), // kWh
  airQualityScore: decimal('air_quality_score', { precision: 5, scale: 2 }).default('0'),
  treesEquivalent: decimal('trees_equivalent', { precision: 10, scale: 0 }).default('0'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type Fund = typeof funds.$inferSelect;
export type Holding = typeof holdings.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Sip = typeof sips.$inferSelect;
export type Watchlist = typeof watchlist.$inferSelect;
export type GreenCreditClaim = typeof greenCreditClaims.$inferSelect;
export type ImpactMetric = typeof impactMetrics.$inferSelect;
```

---

## 1.3 Database Connection

### File: `src/lib/db.ts`

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### File: `drizzle.config.ts`

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### Package.json Scripts
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "db:seed": "npx tsx src/db/seed.ts"
  }
}
```

---

## 1.4 Mock User Session

### File: `src/lib/mock-user.ts`

```typescript
// Hardcoded user for hackathon demo (no auth required)
export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

export const mockUser = {
  id: MOCK_USER_ID,
  name: 'Pragit R V',
  email: 'pragit@greenfin.com',
  profilePic: null,
};

// Helper to get current user (always returns mock user)
export function getCurrentUserId(): string {
  return MOCK_USER_ID;
}
```

---

## 1.5 Seed Data

### File: `src/db/seed.ts`

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, funds, impactMetrics } from './schema';
import { MOCK_USER_ID } from '@/lib/mock-user';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log('Seeding database...');

  // Create mock user
  await db.insert(users).values({
    id: MOCK_USER_ID,
    name: 'Pragit R V',
    email: 'pragit@greenfin.com',
    greenCredits: '500.00', // Starting credits
  }).onConflictDoNothing();

  // Create impact metrics for user
  await db.insert(impactMetrics).values({
    userId: MOCK_USER_ID,
    co2Avoided: '125.50',
    cleanEnergyGenerated: '450.00',
    airQualityScore: '78.50',
    treesEquivalent: '12',
  }).onConflictDoNothing();

  // Seed Green Funds
  const greenFunds = [
    {
      name: 'Tata Green Energy Fund',
      type: 'GREEN_FUND' as const,
      nav: '45.6789',
      minInvestment: '500',
      cagr1y: '18.50',
      cagr2y: '22.30',
      cagr3y: '19.80',
      expenseRatio: '0.45',
      launchDate: '2022-03-15',
      description: 'Invests in renewable energy companies across India',
    },
    {
      name: 'ICICI Prudential ESG Fund',
      type: 'GREEN_FUND' as const,
      nav: '32.1234',
      minInvestment: '1000',
      cagr1y: '15.20',
      cagr2y: '18.90',
      cagr3y: '16.50',
      expenseRatio: '0.65',
      launchDate: '2021-06-20',
      description: 'ESG focused fund investing in sustainable businesses',
    },
    {
      name: 'SBI Green Bond Fund',
      type: 'GREEN_FUND' as const,
      nav: '28.5678',
      minInvestment: '500',
      cagr1y: '12.80',
      cagr2y: '14.50',
      cagr3y: '13.20',
      expenseRatio: '0.35',
      launchDate: '2020-09-10',
      description: 'Debt fund focused on green bonds',
    },
  ];

  // Seed Green Bonds
  const greenBonds = [
    {
      name: 'NTPC Green Bond 2030',
      type: 'GREEN_BOND' as const,
      nav: '1000.0000',
      minInvestment: '10000',
      fixedReturn: '7.50',
      expenseRatio: '0.10',
      launchDate: '2024-01-15',
      description: 'Government-backed green bond for solar projects',
    },
    {
      name: 'Adani Solar Bond 2028',
      type: 'GREEN_BOND' as const,
      nav: '1000.0000',
      minInvestment: '5000',
      fixedReturn: '8.25',
      expenseRatio: '0.15',
      launchDate: '2023-08-20',
      description: 'Corporate green bond for solar farm expansion',
    },
    {
      name: 'REC Green Bond 2029',
      type: 'GREEN_BOND' as const,
      nav: '1000.0000',
      minInvestment: '5000',
      fixedReturn: '7.80',
      expenseRatio: '0.12',
      launchDate: '2024-03-01',
      description: 'Rural electrification green infrastructure bond',
    },
  ];

  // Seed InvITs
  const invits = [
    {
      name: 'IRB InvIT Fund',
      type: 'INVIT' as const,
      nav: '85.4500',
      minInvestment: '5000',
      fixedReturn: '6.50',
      cagr1y: '8.20',
      cagr2y: '9.50',
      cagr3y: '7.80',
      expenseRatio: '0.25',
      launchDate: '2019-05-10',
      description: 'Infrastructure investment trust for green highways',
    },
    {
      name: 'IndiGrid InvIT',
      type: 'INVIT' as const,
      nav: '142.7800',
      minInvestment: '10000',
      fixedReturn: '7.00',
      cagr1y: '10.50',
      cagr2y: '11.20',
      cagr3y: '9.80',
      expenseRatio: '0.30',
      launchDate: '2017-06-15',
      description: 'Power transmission infrastructure trust',
    },
    {
      name: 'Powergrid InvIT',
      type: 'INVIT' as const,
      nav: '98.5600',
      minInvestment: '5000',
      fixedReturn: '6.80',
      cagr1y: '9.20',
      cagr2y: '10.80',
      cagr3y: '8.50',
      expenseRatio: '0.20',
      launchDate: '2021-04-20',
      description: 'Green power transmission assets',
    },
  ];

  await db.insert(funds).values([...greenFunds, ...greenBonds, ...invits]).onConflictDoNothing();

  console.log('Seeding complete!');
}

seed().catch(console.error);
```

---

## 1.6 Base UI Components

### File: `src/components/ui/Button.tsx`

```typescript
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
            'bg-gray-800 text-white hover:bg-gray-700': variant === 'secondary',
            'bg-transparent hover:bg-gray-800': variant === 'ghost',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-base': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
```

### File: `src/components/ui/Card.tsx`

```typescript
import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-gray-900 rounded-xl p-4', className)}
      {...props}
    />
  );
}
```

### File: `src/components/ui/Input.tsx`

```typescript
import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2',
          'text-white placeholder:text-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
```

### File: `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPercent(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}
```

---

## 1.7 Bottom Navigation

### File: `src/components/layout/BottomNav.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, Search, User } from 'lucide-react';
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
          const isActive = pathname === href ||
            (href !== '/' && pathname.startsWith(href));

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
```

---

## 1.8 PWA Configuration

### File: `next.config.js`

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withPWA(nextConfig);
```

### File: `public/manifest.json`

```json
{
  "name": "GreenFin - Green Investments",
  "short_name": "GreenFin",
  "description": "Invest in India's green infrastructure",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#22c55e",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 1.9 Root Layout

### File: `src/app/layout.tsx`

```typescript
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { BottomNav } from '@/components/layout/BottomNav';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GreenFin - Green Investments',
  description: 'Invest in India\'s green infrastructure',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <main className="pb-20 max-w-md mx-auto">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
```

---

## Phase 1 Checklist

- [ ] Create Next.js project
- [ ] Install all dependencies
- [ ] Create database schema
- [ ] Set up Drizzle connection
- [ ] Create mock user helper
- [ ] Run `db:push` to create tables
- [ ] Run seed script to populate data
- [ ] Create base UI components (Button, Card, Input)
- [ ] Create BottomNav component
- [ ] Configure PWA manifest
- [ ] Set up root layout

---

## Next: [Phase 2 - Home & Discover Pages](./phase2.md)
