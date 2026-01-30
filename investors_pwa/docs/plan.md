# GreenFin Investor PWA - Implementation Plan

## Project Context
- **Location**: `/Users/pragit/Documents/GitHub/Chennai-Sharks_9.20_SDG-9/investors_pwa`
- **Tech Stack**: Next.js 14/15, Tailwind CSS, Neon Postgres, Drizzle ORM, next-pwa
- **AI Agent**: OpenRouter + LangChain for green credit verification
- **Payments**: Mock payments (instant order placement)
- **Auth**: Mock user session (hardcoded user for hackathon demo)

---

## Overview

GreenFin is a PWA enabling retail investors to invest in green infrastructure (Green Bonds, InvITs, Green Mutual Funds) with micro-investments starting at ₹500. Investors earn 5% Green Credits on every investment, redeemable for renewable energy purchases.

---

## Phase Summary

| Phase | Focus | Detailed Plan |
|-------|-------|---------------|
| Phase 1 | Project Setup, Database, Base Components | [phase1.md](./phase1.md) |
| Phase 2 | Home & Discover Pages | [phase2.md](./phase2.md) |
| Phase 3 | Investments, Orders, SIPs, Watchlist | [phase3.md](./phase3.md) |
| Phase 4 | Account, Green Credits, AI Agent | [phase4.md](./phase4.md) |

---

## Database Schema Overview

```
users ──────────┬──── holdings ──── funds
                ├──── orders ──────────┘
                ├──── sips ────────────┘
                ├──── watchlist ───────┘
                ├──── greenCreditClaims
                └──── impactMetrics
```

---

## API Routes Overview

### Funds API
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/funds` | List all funds with filters |
| GET | `/api/funds/[id]` | Get fund details |
| GET | `/api/funds/search?q=` | Search funds by name |
| GET | `/api/funds/type/[type]` | Get funds by type |

### Portfolio API
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/portfolio` | Get user holdings |
| GET | `/api/portfolio/summary` | Get P&L summary |

### Orders API
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/orders` | Create buy order |
| GET | `/api/orders` | List user orders |
| GET | `/api/orders/[id]` | Get order details |

### SIPs API
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/sips` | Create SIP |
| GET | `/api/sips` | List user SIPs |
| PATCH | `/api/sips/[id]` | Pause/Cancel SIP |

### Watchlist API
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/watchlist` | Add to watchlist |
| DELETE | `/api/watchlist/[fundId]` | Remove from watchlist |
| GET | `/api/watchlist` | Get user watchlist |

### Green Credits API
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/green-credits` | Get balance |
| POST | `/api/green-credits/claim` | Submit claim with file |

### Impact API
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/impact` | Get user impact metrics |

---

## App Structure

```
investors_pwa/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Home page
│   │   ├── investments/page.tsx          # Portfolio/SIPs/Orders
│   │   ├── discover/
│   │   │   ├── page.tsx                  # Explore + Watchlist
│   │   │   └── fund/[id]/page.tsx        # Fund detail
│   │   ├── account/
│   │   │   ├── page.tsx                  # Profile settings
│   │   │   └── claim-credits/page.tsx    # Green credits claim
│   │   └── api/
│   │       ├── funds/
│   │       │   ├── route.ts              # GET all funds
│   │       │   ├── [id]/route.ts         # GET fund by id
│   │       │   ├── search/route.ts       # GET search
│   │       │   └── type/[type]/route.ts  # GET by type
│   │       ├── portfolio/
│   │       │   ├── route.ts              # GET holdings
│   │       │   └── summary/route.ts      # GET P&L summary
│   │       ├── orders/
│   │       │   ├── route.ts              # GET/POST orders
│   │       │   └── [id]/route.ts         # GET order
│   │       ├── sips/
│   │       │   ├── route.ts              # GET/POST sips
│   │       │   └── [id]/route.ts         # PATCH sip
│   │       ├── watchlist/
│   │       │   ├── route.ts              # GET/POST watchlist
│   │       │   └── [fundId]/route.ts     # DELETE
│   │       ├── green-credits/
│   │       │   ├── route.ts              # GET balance
│   │       │   └── claim/route.ts        # POST claim
│   │       └── impact/route.ts           # GET metrics
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── home/
│   │   ├── portfolio/
│   │   ├── discover/
│   │   ├── fund/
│   │   └── account/
│   ├── db/
│   │   ├── schema.ts
│   │   ├── index.ts
│   │   └── seed.ts
│   └── lib/
│       ├── db.ts
│       ├── mock-user.ts
│       └── ai-agent.ts
├── public/
│   ├── manifest.json
│   └── icons/
├── drizzle.config.ts
└── package.json
```

---

## UI Reference Images

| Page | Reference |
|------|-----------|
| Home | `docs/images/image copy.png` |
| Investments | `docs/images/image.png` |
| Discover | `docs/images/image copy 11.png` |
| Search Results | `docs/images/image copy 2.png` |
| Fund Detail | `docs/images/image copy 3.png`, `docs/images/image copy 4.png` |
| Buy Flow | `docs/images/image copy 6.png`, `docs/images/image copy 13.png` |
| SIP Flow | `docs/images/image copy 12.png` |
| Filters | `docs/images/image copy 10.png` |
| Account | `docs/images/WhatsApp Image 2026-01-30 at 1.52.10 PM.jpeg` |

---

## Key Business Logic

### Green Credits Calculation
```
On every BUY order:
  greenCreditsEarned = investmentAmount * 0.05 (5%)
  user.greenCredits += greenCreditsEarned
```

### P&L Calculation
```
For each holding:
  currentValue = quantity * fund.nav
  pnl = currentValue - investedAmount
  pnlPercent = (pnl / investedAmount) * 100

Total Portfolio:
  totalInvested = SUM(holdings.investedAmount)
  totalCurrent = SUM(holdings.currentValue)
  totalPnl = totalCurrent - totalInvested
```

### Order Processing (Mock)
```
On order creation:
  1. Validate amount >= fund.minInvestment
  2. Calculate quantity = amount / fund.nav
  3. Create order with status 'COMPLETED' (mock instant)
  4. Update/Create holding record
  5. Award 5% green credits
  6. Update impact metrics
```

---

## Detailed Phase Plans

- **[Phase 1: Setup & Database](./phase1.md)** - Project init, schema, base components
- **[Phase 2: Home & Discover](./phase2.md)** - Core pages, fund listing, search
- **[Phase 3: Transactions](./phase3.md)** - Orders, SIPs, watchlist, portfolio
- **[Phase 4: Green Credits](./phase4.md)** - Account, AI verification, PWA
