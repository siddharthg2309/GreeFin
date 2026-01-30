# GreenFin Corporate Portal - Implementation Plan

## Project Context
- **Location**: `/Users/pragit/Documents/GitHub/Chennai-Sharks_9.20_SDG-9/corporate`
- **Tech Stack**: Next.js 14/15 (App Router), Tailwind CSS, Drizzle ORM, Neon Postgres
- **Database**: Shared with Investors PWA (same DATABASE_URL)
- **Auth**: Mock corporate session (hardcoded for hackathon demo)
- **Layout**: Desktop web app with left sidebar navigation

---

## Overview

GreenFin Corporate Portal enables corporations to:
1. **Issue InvITs** - Create Infrastructure Investment Trusts with fixed returns + NAV appreciation
2. **Create Green Bonds** - Issue green bonds with fixed returns only
3. **Manage CSR Funds** - Allocate CSR funding for investor green credits and track redemptions
4. **View Impact** - Monitor environmental impact metrics from investments

All created funds will be visible to investors in the Investors PWA for purchase.

---

## Phase Summary

| Phase | Focus | Description |
|-------|-------|-------------|
| Phase 1 | Project Setup & Schema Extension | Init project, extend DB schema, create sidebar layout |
| Phase 2 | Dashboard & Impact Metrics | Main dashboard with stats and impact visualization |
| Phase 3 | Issue InvITs | Form to create InvITs with ESG report upload |
| Phase 4 | Create Green Bonds | Form to create Green Bonds with ESG report upload |
| Phase 5 | CSR Funds Management | CSR allocation and credit redemption tracking |

---

## Design System

### Color Palette (Dark Theme)
| Component | Hex Code | Purpose |
|-----------|----------|---------|
| Main Background | `#000000` or `#121212` | Deepest base layer |
| Card Background | `#1C1C1E` | Elevated grey for cards |
| Subtext | `#8E8E93` | Secondary text, less emphasis |
| Border/Divider | `#2C2C2E` | Subtle separators |
| Primary Accent | `#3B82F6` | Blue for actions |
| Success | `#22C55E` | Green for positive states |
| Warning | `#F59E0B` | Amber for warnings |

### Design Principles
- No Inter font, gradients, heavy rounding, or emojis
- Consistent padding and line height
- Clear visual hierarchy
- Subtle shadows for depth (no glow effects)
- Deliberate whitespace

---

## Database Schema Extension

### New Tables (Add to shared schema)

```typescript
// CORPORATES TABLE
export const corporates = pgTable('corporates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyLogo: varchar('company_logo', { length: 500 }),
  sector: varchar('sector', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ESG REPORTS TABLE (Child table for funds)
export const esgReports = pgTable('esg_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  fundId: uuid('fund_id').references(() => funds.id).notNull(),
  corporateId: uuid('corporate_id').references(() => corporates.id).notNull(),
  reportUrl: varchar('report_url', { length: 500 }).notNull(),
  reportName: varchar('report_name', { length: 255 }),
  reportYear: varchar('report_year', { length: 4 }),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

// CSR FUNDINGS TABLE
export const csrFundings = pgTable('csr_fundings', {
  id: uuid('id').defaultRandom().primaryKey(),
  corporateId: uuid('corporate_id').references(() => corporates.id).notNull(),
  totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).notNull(),
  remainingAmount: decimal('remaining_amount', { precision: 14, scale: 2 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('ACTIVE'), // ACTIVE, EXHAUSTED, PAUSED
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Extend FUNDS table with corporate reference
// Add to funds table:
//   issuerId: uuid('issuer_id').references(() => corporates.id),
//   issuerType: varchar('issuer_type', { length: 20 }), // 'CORPORATE', 'GOVERNMENT'

// Extend GREEN_CREDIT_CLAIMS with CSR funding reference
// Add to greenCreditClaims table:
//   csrFundingId: uuid('csr_funding_id').references(() => csrFundings.id),
```

### Updated Schema Relationships

```
corporates ──────┬──── funds (as issuer)
                 ├──── esgReports
                 └──── csrFundings
                            │
                            └──── greenCreditClaims (funded by)
```

---

## App Structure

```
corporate/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout with sidebar
│   │   ├── page.tsx                      # Dashboard (main)
│   │   ├── invits/
│   │   │   ├── page.tsx                  # List InvITs
│   │   │   └── create/page.tsx           # Create InvIT form
│   │   ├── bonds/
│   │   │   ├── page.tsx                  # List Green Bonds
│   │   │   └── create/page.tsx           # Create Bond form
│   │   ├── csr-funds/
│   │   │   ├── page.tsx                  # CSR overview & redemptions
│   │   │   └── allocate/page.tsx         # Allocate new CSR funds
│   │   └── api/
│   │       ├── dashboard/route.ts        # GET stats
│   │       ├── invits/
│   │       │   └── route.ts              # GET/POST InvITs
│   │       ├── bonds/
│   │       │   └── route.ts              # GET/POST Bonds
│   │       ├── csr-funds/
│   │       │   ├── route.ts              # GET/POST CSR allocations
│   │       │   └── redemptions/route.ts  # GET redemptions list
│   │       ├── esg-reports/
│   │       │   └── route.ts              # POST upload ESG report
│   │       └── impact/route.ts           # GET impact metrics
│   ├── components/
│   │   ├── ui/                           # Shared UI (from investors_pwa)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   └── FileUpload.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx               # Left navigation
│   │   │   └── Header.tsx                # Top header with corporate info
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx
│   │   │   ├── ImpactMetrics.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── forms/
│   │   │   ├── InvitForm.tsx
│   │   │   ├── BondForm.tsx
│   │   │   ├── CsrAllocationForm.tsx
│   │   │   └── EsgUpload.tsx
│   │   └── tables/
│   │       ├── FundsTable.tsx
│   │       └── RedemptionsTable.tsx
│   ├── db/                               # Symlink or copy from investors_pwa
│   │   └── schema.ts                     # Extended schema
│   └── lib/
│       ├── db.ts                         # Shared DB connection
│       ├── mock-corporate.ts             # Mock corporate session
│       └── utils.ts                      # Shared utilities
├── public/
├── drizzle.config.ts
└── package.json
```

---

## API Routes Overview

### Dashboard API
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard` | Get dashboard statistics |
| GET | `/api/impact` | Get aggregated impact metrics |

### InvITs API
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/invits` | List corporate's InvITs |
| POST | `/api/invits` | Create new InvIT |
| GET | `/api/invits/[id]` | Get InvIT details |
| PATCH | `/api/invits/[id]` | Update InvIT |

### Bonds API
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/bonds` | List corporate's Green Bonds |
| POST | `/api/bonds` | Create new Green Bond |
| GET | `/api/bonds/[id]` | Get Bond details |
| PATCH | `/api/bonds/[id]` | Update Bond |

### CSR Funds API
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/csr-funds` | Get CSR fund allocations |
| POST | `/api/csr-funds` | Create new CSR allocation |
| GET | `/api/csr-funds/redemptions` | List credit redemptions |
| GET | `/api/csr-funds/stats` | Get CSR statistics |

### ESG Reports API
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/esg-reports` | Upload ESG report PDF |
| GET | `/api/esg-reports/[fundId]` | Get reports for a fund |

---

## Sidebar Navigation

```
┌─────────────────────────────────┐
│  🌿 GreenFin Corporate         │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  📊 Dashboard                   │  ← Main overview
│                                 │
│  ─────────────────────────────  │
│  ISSUE INSTRUMENTS              │
│  ─────────────────────────────  │
│                                 │
│  📈 InvITs                      │  ← List & Create
│  📜 Green Bonds                 │  ← List & Create
│                                 │
│  ─────────────────────────────  │
│  CSR & IMPACT                   │
│  ─────────────────────────────  │
│                                 │
│  💰 CSR Funds                   │  ← Manage allocations
│                                 │
│  ─────────────────────────────  │
│                                 │
│  ⚙️ Settings                    │
│                                 │
└─────────────────────────────────┘
```

---

## Feature Details

### 1. Dashboard
**Main overview page showing:**
- Total InvITs issued (count & total value)
- Total Green Bonds issued (count & total value)
- CSR Funds allocated vs. remaining
- Impact Metrics (CO₂ avoided, clean energy, trees equivalent)
- Recent activity feed

### 2. Issue InvITs
**Form fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | text | Yes | InvIT name |
| NAV | number | Yes | Current NAV price |
| Min Investment | number | Yes | Minimum investment amount |
| Fixed Return | number | Yes | Annual fixed return % |
| CAGR 1Y/2Y/3Y | number | No | Historical performance |
| Expense Ratio | number | No | Management fee % |
| Launch Date | date | Yes | Start date |
| Description | textarea | Yes | Details about the InvIT |
| ESG Report | file | No | PDF upload (optional) |

**On Submit:**
1. Create fund record with type='INVIT'
2. If ESG report uploaded, create esgReports record
3. Fund becomes visible to investors immediately

### 3. Create Green Bonds
**Form fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | text | Yes | Bond name |
| NAV | number | Yes | Face value (usually ₹1000) |
| Min Investment | number | Yes | Minimum investment amount |
| Fixed Return | number | Yes | Annual coupon rate % |
| Maturity Date | date | Yes | Bond maturity |
| Launch Date | date | Yes | Issue date |
| Description | textarea | Yes | Bond details |
| ESG Report | file | No | PDF upload (optional) |

**Note:** Green Bonds have ONLY fixed returns (no CAGR/NAV appreciation)

**On Submit:**
1. Create fund record with type='GREEN_BOND'
2. If ESG report uploaded, create esgReports record
3. Bond becomes visible to investors immediately

### 4. CSR Funds Management
**Features:**
- **Allocate Funds:** Form to add CSR funding amount
- **View Balance:** Total allocated vs. remaining
- **Redemption List:** Table showing:
  - User name
  - Product purchased
  - Credits redeemed
  - Date
  - Status

**Business Logic:**
```
When investor claims green credits:
  1. Find active CSR funding with remaining balance
  2. Deduct creditsRedeemed from csrFunding.remainingAmount
  3. Link greenCreditClaim to csrFunding via csrFundingId
  4. If remainingAmount <= 0, mark csrFunding as 'EXHAUSTED'
```

---

## Phase-wise Implementation

### Phase 1: Project Setup & Schema Extension
- Initialize Next.js project
- Copy shared DB schema from investors_pwa
- Add new tables (corporates, esgReports, csrFundings)
- Extend funds table with issuer fields
- Create base UI components
- Create Sidebar layout component
- Set up mock corporate session

### Phase 2: Dashboard & Impact Metrics
- Create dashboard page
- Build StatCard component
- Build ImpactMetrics component
- Create `/api/dashboard` route
- Create `/api/impact` route

### Phase 3: Issue InvITs
- Create InvITs list page
- Create InvIT form page
- Build InvitForm component
- Build EsgUpload component
- Create `/api/invits` routes
- Create `/api/esg-reports` route

### Phase 4: Create Green Bonds
- Create Bonds list page
- Create Bond form page
- Build BondForm component
- Create `/api/bonds` routes
- Test fund visibility in investors portal

### Phase 5: CSR Funds Management
- Create CSR overview page
- Create allocation form page
- Build CsrAllocationForm component
- Build RedemptionsTable component
- Create `/api/csr-funds` routes
- Link redemptions to CSR funding

---

## Detailed Phase Plans

- **[Phase 1: Setup & Schema](./phase1.md)**
- **[Phase 2: Dashboard](./phase2.md)**
- **[Phase 3: InvITs](./phase3.md)**
- **[Phase 4: Green Bonds](./phase4.md)**
- **[Phase 5: CSR Funds](./phase5.md)**

---

## Key Differences: InvIT vs Green Bond

| Aspect | InvIT | Green Bond |
|--------|-------|------------|
| Returns | Fixed Return + NAV Appreciation | Fixed Return Only |
| CAGR Data | Yes (1Y, 2Y, 3Y) | No |
| NAV Changes | Yes (fluctuates) | No (fixed face value) |
| Risk Profile | Medium | Low |
| Maturity | Open-ended | Fixed maturity date |

---

## Shared Code with Investors PWA

### Copy from investors_pwa:
- `src/db/schema.ts` (extend with new tables)
- `src/lib/db.ts`
- `src/lib/utils.ts`
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Input.tsx`

### New for Corporate:
- `src/components/layout/Sidebar.tsx`
- `src/components/ui/Select.tsx`
- `src/components/ui/Textarea.tsx`
- `src/components/ui/FileUpload.tsx`
- Form components
- Table components

---

## Verification Steps

1. **Database:** Run `db:push` to add new tables
2. **Schema:** Verify extended schema works with both portals
3. **InvIT Creation:** Create InvIT, verify it appears in investors portal
4. **Bond Creation:** Create Bond, verify it appears in investors portal
5. **CSR Allocation:** Allocate funds, verify balance tracking
6. **Redemption Linking:** Claim credits in investors app, verify CSR deduction
7. **Impact Metrics:** Verify aggregated metrics display correctly
