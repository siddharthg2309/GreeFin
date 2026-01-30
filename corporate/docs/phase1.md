# Phase 1: Project Setup & Schema Extension

## Overview
Initialize the Next.js corporate portal, extend the shared database schema with new tables, and create the sidebar layout.

---

## 1.1 Project Initialization

### Commands
```bash
cd /Users/pragit/Documents/GitHub/Chennai-Sharks_9.20_SDG-9/corporate

# Create Next.js app
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install dependencies
npm install @neondatabase/serverless drizzle-orm
npm install -D drizzle-kit

# UI utilities (same as investors_pwa)
npm install clsx tailwind-merge lucide-react
```

### Environment Variables
Create `.env.local`:
```env
# Same database as investors_pwa
DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/greenfin?sslmode=require
```

---

## 1.2 Extended Database Schema

### File: `src/db/schema.ts`

Copy the existing schema from investors_pwa and add the following:

```typescript
import { pgTable, uuid, varchar, decimal, timestamp, text, boolean, date, pgEnum } from 'drizzle-orm/pg-core';

// ============================================
// EXISTING ENUMS (from investors_pwa)
// ============================================
export const fundTypeEnum = pgEnum('fund_type', ['GREEN_BOND', 'INVIT', 'GREEN_FUND']);
export const orderTypeEnum = pgEnum('order_type', ['BUY', 'SELL']);
export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']);
export const sipFrequencyEnum = pgEnum('sip_frequency', ['WEEKLY', 'MONTHLY']);
export const sipStatusEnum = pgEnum('sip_status', ['ACTIVE', 'PAUSED', 'CANCELLED']);
export const claimStatusEnum = pgEnum('claim_status', ['PENDING', 'APPROVED', 'REJECTED']);

// ============================================
// NEW ENUMS (for corporate portal)
// ============================================
export const csrStatusEnum = pgEnum('csr_status', ['ACTIVE', 'EXHAUSTED', 'PAUSED']);
export const issuerTypeEnum = pgEnum('issuer_type', ['CORPORATE', 'GOVERNMENT', 'NGO']);

// ============================================
// NEW TABLE: CORPORATES
// ============================================
export const corporates = pgTable('corporates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyLogo: varchar('company_logo', { length: 500 }),
  sector: varchar('sector', { length: 100 }),
  registrationNumber: varchar('registration_number', { length: 50 }),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// EXISTING TABLE: USERS (unchanged)
// ============================================
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  profilePic: varchar('profile_pic', { length: 500 }),
  greenCredits: decimal('green_credits', { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// UPDATED TABLE: FUNDS (with issuer reference)
// ============================================
export const funds = pgTable('funds', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: fundTypeEnum('type').notNull(),
  nav: decimal('nav', { precision: 10, scale: 4 }).notNull(),
  minInvestment: decimal('min_investment', { precision: 10, scale: 2 }).notNull(),
  fixedReturn: decimal('fixed_return', { precision: 5, scale: 2 }),
  cagr1y: decimal('cagr_1y', { precision: 5, scale: 2 }),
  cagr2y: decimal('cagr_2y', { precision: 5, scale: 2 }),
  cagr3y: decimal('cagr_3y', { precision: 5, scale: 2 }),
  expenseRatio: decimal('expense_ratio', { precision: 4, scale: 2 }),
  launchDate: date('launch_date'),
  maturityDate: date('maturity_date'), // NEW: For bonds
  description: text('description'),
  logoUrl: varchar('logo_url', { length: 500 }),
  isActive: boolean('is_active').default(true),
  // NEW: Issuer fields
  issuerId: uuid('issuer_id').references(() => corporates.id),
  issuerType: issuerTypeEnum('issuer_type'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// NEW TABLE: ESG REPORTS
// ============================================
export const esgReports = pgTable('esg_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  fundId: uuid('fund_id').references(() => funds.id).notNull(),
  corporateId: uuid('corporate_id').references(() => corporates.id).notNull(),
  reportUrl: varchar('report_url', { length: 500 }).notNull(),
  reportName: varchar('report_name', { length: 255 }),
  reportYear: varchar('report_year', { length: 4 }),
  fileSize: decimal('file_size', { precision: 10, scale: 0 }), // bytes
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

// ============================================
// NEW TABLE: CSR FUNDINGS
// ============================================
export const csrFundings = pgTable('csr_fundings', {
  id: uuid('id').defaultRandom().primaryKey(),
  corporateId: uuid('corporate_id').references(() => corporates.id).notNull(),
  totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).notNull(),
  remainingAmount: decimal('remaining_amount', { precision: 14, scale: 2 }).notNull(),
  description: text('description'),
  fiscalYear: varchar('fiscal_year', { length: 10 }), // e.g., "2024-25"
  status: csrStatusEnum('status').default('ACTIVE'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// EXISTING TABLES (unchanged)
// ============================================
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

export const watchlist = pgTable('watchlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  fundId: uuid('fund_id').references(() => funds.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// UPDATED TABLE: GREEN CREDIT CLAIMS (with CSR reference)
// ============================================
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
  // NEW: CSR funding reference
  csrFundingId: uuid('csr_funding_id').references(() => csrFundings.id),
  createdAt: timestamp('created_at').defaultNow(),
  processedAt: timestamp('processed_at'),
});

export const impactMetrics = pgTable('impact_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  co2Avoided: decimal('co2_avoided', { precision: 10, scale: 2 }).default('0'),
  cleanEnergyGenerated: decimal('clean_energy_generated', { precision: 10, scale: 2 }).default('0'),
  airQualityScore: decimal('air_quality_score', { precision: 5, scale: 2 }).default('0'),
  treesEquivalent: decimal('trees_equivalent', { precision: 10, scale: 0 }).default('0'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// TYPE EXPORTS
// ============================================
export type Corporate = typeof corporates.$inferSelect;
export type User = typeof users.$inferSelect;
export type Fund = typeof funds.$inferSelect;
export type Holding = typeof holdings.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Sip = typeof sips.$inferSelect;
export type Watchlist = typeof watchlist.$inferSelect;
export type GreenCreditClaim = typeof greenCreditClaims.$inferSelect;
export type ImpactMetric = typeof impactMetrics.$inferSelect;
export type EsgReport = typeof esgReports.$inferSelect;
export type CsrFunding = typeof csrFundings.$inferSelect;
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

---

## 1.4 Mock Corporate Session

### File: `src/lib/mock-corporate.ts`

```typescript
// Hardcoded corporate for hackathon demo
export const MOCK_CORPORATE_ID = '00000000-0000-0000-0000-000000000100';

export const mockCorporate = {
  id: MOCK_CORPORATE_ID,
  name: 'Tata Green Initiative',
  email: 'green@tata.com',
  companyName: 'Tata Power',
  sector: 'Energy',
  companyLogo: null,
};

export function getCurrentCorporateId(): string {
  return MOCK_CORPORATE_ID;
}
```

---

## 1.5 Seed Corporate Data

### File: `src/db/seed-corporate.ts`

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { corporates, csrFundings } from './schema';
import { MOCK_CORPORATE_ID } from '@/lib/mock-corporate';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log('Seeding corporate data...');

  // Create mock corporate
  await db.insert(corporates).values({
    id: MOCK_CORPORATE_ID,
    name: 'Tata Green Initiative',
    email: 'green@tata.com',
    companyName: 'Tata Power',
    sector: 'Energy',
    registrationNumber: 'CIN-U12345MH2000PLC123456',
    address: 'Bombay House, Mumbai, Maharashtra',
  }).onConflictDoNothing();

  // Create initial CSR funding
  await db.insert(csrFundings).values({
    corporateId: MOCK_CORPORATE_ID,
    totalAmount: '5000000.00', // 50 Lakhs
    remainingAmount: '5000000.00',
    description: 'CSR allocation for FY 2024-25 Green Credits Program',
    fiscalYear: '2024-25',
    status: 'ACTIVE',
  }).onConflictDoNothing();

  console.log('Corporate seeding complete!');
}

seed().catch(console.error);
```

---

## 1.6 Utility Functions

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

export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
```

---

## 1.7 Base UI Components

### File: `src/components/ui/Button.tsx`

```typescript
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors',
          'disabled:opacity-50 disabled:pointer-events-none rounded-md',
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
            'bg-[#1C1C1E] text-white hover:bg-[#2C2C2E] border border-[#2C2C2E]': variant === 'secondary',
            'bg-transparent hover:bg-[#1C1C1E] text-[#8E8E93]': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
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

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ className, padding = 'md', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#1C1C1E] rounded-lg border border-[#2C2C2E]',
        {
          'p-0': padding === 'none',
          'p-3': padding === 'sm',
          'p-4': padding === 'md',
          'p-6': padding === 'lg',
        },
        className
      )}
      {...props}
    />
  );
}
```

### File: `src/components/ui/Input.tsx`

```typescript
import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm text-[#8E8E93]">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-[#121212] border rounded-md px-3 py-2',
            'text-white placeholder:text-[#8E8E93]',
            'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
            error ? 'border-red-500' : 'border-[#2C2C2E]',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
```

### File: `src/components/ui/Select.tsx`

```typescript
import { cn } from '@/lib/utils';
import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm text-[#8E8E93]">{label}</label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full bg-[#121212] border rounded-md px-3 py-2',
            'text-white',
            'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
            error ? 'border-red-500' : 'border-[#2C2C2E]',
            className
          )}
          {...props}
        >
          {options.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
```

### File: `src/components/ui/Textarea.tsx`

```typescript
import { cn } from '@/lib/utils';
import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm text-[#8E8E93]">{label}</label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full bg-[#121212] border rounded-md px-3 py-2 min-h-[100px]',
            'text-white placeholder:text-[#8E8E93]',
            'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
            error ? 'border-red-500' : 'border-[#2C2C2E]',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
```

### File: `src/components/ui/FileUpload.tsx`

```typescript
'use client';

import { cn } from '@/lib/utils';
import { Upload, FileText, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface FileUploadProps {
  label?: string;
  accept?: string;
  onChange?: (file: File | null) => void;
  error?: string;
}

export function FileUpload({ label, accept = '.pdf', onChange, error }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    onChange?.(selected);
  };

  const handleRemove = () => {
    setFile(null);
    onChange?.(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm text-[#8E8E93]">{label}</label>
      )}

      {!file ? (
        <label
          className={cn(
            'flex flex-col items-center justify-center gap-2',
            'border-2 border-dashed rounded-lg p-6 cursor-pointer',
            'transition-colors hover:border-[#8E8E93]',
            error ? 'border-red-500' : 'border-[#2C2C2E]'
          )}
        >
          <Upload className="w-8 h-8 text-[#8E8E93]" />
          <span className="text-sm text-[#8E8E93]">
            Click to upload {accept === '.pdf' ? 'PDF' : 'file'}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
        </label>
      ) : (
        <div className="flex items-center justify-between bg-[#121212] border border-[#2C2C2E] rounded-lg p-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-white truncate max-w-[200px]">{file.name}</p>
              <p className="text-xs text-[#8E8E93]">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1 hover:bg-[#2C2C2E] rounded"
          >
            <X className="w-4 h-4 text-[#8E8E93]" />
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

---

## 1.8 Sidebar Component

### File: `src/components/layout/Sidebar.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  Wallet,
  Settings,
  Leaf,
} from 'lucide-react';

const navSections = [
  {
    items: [
      { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ],
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
    items: [
      { href: '/csr-funds', icon: Wallet, label: 'CSR Funds' },
    ],
  },
  {
    items: [
      { href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-black border-r border-[#2C2C2E] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#2C2C2E]">
        <Link href="/" className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-green-500" />
          <span className="text-lg font-semibold text-white">GreenFin</span>
          <span className="text-xs text-[#8E8E93] ml-1">Corporate</span>
        </Link>
      </div>

      {/* Navigation */}
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
                const isActive = pathname === href ||
                  (href !== '/' && pathname.startsWith(href));

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

      {/* Footer */}
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
```

---

## 1.9 Root Layout

### File: `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'GreenFin Corporate Portal',
  description: 'Issue green investments and manage CSR funds',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#121212] text-white min-h-screen">
        <Sidebar />
        <main className="ml-64 min-h-screen p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
```

### File: `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #121212;
}

::-webkit-scrollbar-thumb {
  background: #2C2C2E;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3C3C3E;
}
```

---

## 1.10 Tailwind Configuration

### File: `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom dark theme colors
        background: '#121212',
        card: '#1C1C1E',
        border: '#2C2C2E',
        muted: '#8E8E93',
      },
    },
  },
  plugins: [],
};
export default config;
```

---

## Phase 1 Checklist

- [ ] Create Next.js project in corporate folder
- [ ] Install all dependencies
- [ ] Copy and extend database schema
- [ ] Create database connection
- [ ] Create mock corporate session helper
- [ ] Run `db:push` to add new tables
- [ ] Run seed script for corporate data
- [ ] Create utility functions
- [ ] Create base UI components (Button, Card, Input, Select, Textarea, FileUpload)
- [ ] Create Sidebar component
- [ ] Set up root layout with sidebar
- [ ] Configure Tailwind with custom colors
- [ ] Verify schema works with both portals

---

## Next: [Phase 2 - Dashboard](./phase2.md)
