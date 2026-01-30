# GreenFin - Investor PWA

A Progressive Web App to democratize micro-investments in India's green infrastructure.

**Hackathon Project | SDG 9 | Climate Action | Retail Investing**

---

## Project Overview

GreenFin is a fintech solution designed to enable retail and institutional investors in India to invest in green infrastructure projects—like solar farms, wind energy, and clean transport—through instruments such as green InvITs, green bonds, and renewable mutual funds.

Our MVP is an investor-facing Progressive Web App (PWA) that showcases investment opportunities, real-time environmental impact, and gamified rewards via **Green Credits**—an innovative incentive aligned with India's net-zero goals and the UN's Sustainable Development Goal 9 (SDG 9).

---

## Key Features

### Micro-Invest in Green Projects
Discover government/corporate-issued green InvITs and bonds with as little as ₹500.

### Green Credits Rewards
Earn Green Credits for investing, redeemable for real-world green actions (e.g., rooftop solar installations).

### CO₂ Impact Dashboard
Track your emissions offset, clean energy generated, and SDG alignment in real time.

### Personal Portfolio Insights
Visualize your investment breakdown and returns from green infrastructure.

---

## Tech Stack

### Frontend + Backend (Unified)
- **Next.js 14/15** (App Router) - UI pages, dashboards, SSR for speed
- **Tailwind CSS** - Rapid dashboard UI, mobile-first PWA design
- **Server Actions + Route Handlers** - For Invest, CSR Fund, Mint Credits operations

### Database Layer
- **Neon Postgres** (Serverless) - Managed, auto-scaling production database
- **@neondatabase/serverless** - Optimized for serverless environments

### ORM Layer
- **Drizzle ORM + Drizzle Kit** - Lightweight, TypeScript-friendly, easy migrations

### Authentication
- **Clerk Auth** - Instant login system with role-based dashboard support

### PWA Layer
- **next-pwa** - Installable app experience with offline caching
- manifest.json, icons, offline cached shell

### Deployment
- **Vercel** - Next.js app hosting
- **Neon Postgres** - Connected via DATABASE_URL

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Neon Postgres account
- Clerk account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/Chennai-Sharks_9.20_SDG-9.git
cd Chennai-Sharks_9.20_SDG-9/investors_pwa

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your DATABASE_URL (ask a teammate for the connection string)

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL=your_neon_postgres_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

---

## Project Structure

```
investors_pwa/
├── app/                  # Next.js App Router pages
│   ├── (auth)/          # Authentication routes
│   ├── dashboard/       # Investor dashboard
│   ├── invest/          # Investment flows
│   └── portfolio/       # Portfolio views
├── components/          # Reusable UI components
├── lib/                 # Utilities, DB client, helpers
├── db/                  # Drizzle schema & migrations
├── public/              # Static assets, PWA manifest
└── docs/                # Documentation
```

---

## SDG 9 Alignment

This project directly supports **UN Sustainable Development Goal 9: Industry, Innovation, and Infrastructure** by:

- Mobilizing retail capital for sustainable infrastructure
- Democratizing access to green investment opportunities
- Promoting innovative financial instruments for climate action
- Building resilient infrastructure through crowd-funded green projects

---

## Team

**Chennai Sharks** - Hackathon Team

---

## License

This project is built for hackathon demonstration purposes.

---

## Links

- [Tech Stack Documentation](./docs/techstack.md)
