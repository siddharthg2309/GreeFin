 TECH STACK (Focused + Lightweight)

Frontend + Backend (Single App)

 Next.js 14/15 (App Router)
    •    UI pages + dashboards
    •    Server-side rendering for speed
    •    Runs on Vercel

Tailwind CSS
    •    Rapid dashboard UI building
    •    Mobile-first PWA look

Server Actions + Route Handlers
    •    Server Actions for: Invest, CSR Fund, Mint Credits
    •    Route Handlers only if needed for API reads

No separate backend service.

⸻

Database Layer

Neon Postgres (Serverless)
    •    Managed Postgres DB for production
    •    No Docker DB on Vercel
    •    Scales automatically

Neon Serverless Driver
    •    Prevents “too many connections” on Vercel
    •    Built for serverless environments

Package:
    •    @neondatabase/serverless

⸻

ORM Layer (Simplest Choice)

 Drizzle ORM + Drizzle Kit
    •    Lightweight, TypeScript-friendly
    •    Perfect match with Neon serverless
    •    Easy schema + migrations

Packages:
    •    drizzle-orm
    •    drizzle-kit

⸻

Auth Layer (Hackathon Fast Option)

Clerk Auth (Recommended)
    •    Instant login system
    •    Supports role-based dashboards
    •    Saves huge time
PWA Layer

 next-pwa
    •    Installable app experience
    •    Works on mobile instantly

Includes:
    •    manifest.json
    •    icons
    •    offline cached shell
 FINAL DEPLOYMENT TARGET

Production Demo Setup
    •    Next.js app deployed on Vercel
    •    Neon Postgres connected via DATABASE_URL
    •    Citizen + Corporate dashboards live
    •    PWA installable from browser
