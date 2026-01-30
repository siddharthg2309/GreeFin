import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { loadEnvConfig } from '@next/env';

import { funds, impactMetrics, users } from './schema';
import { MOCK_USER_ID } from '@/lib/mock-user';

loadEnvConfig(process.cwd());

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log('Seeding database...');

  await db
    .insert(users)
    .values({
      id: MOCK_USER_ID,
      name: 'Pragit R V',
      email: 'pragit@greenfin.com',
      greenCredits: '500.00',
    })
    .onConflictDoNothing();

  await db
    .insert(impactMetrics)
    .values({
      id: '00000000-0000-0000-0000-000000000002',
      userId: MOCK_USER_ID,
      co2Avoided: '125.50',
      cleanEnergyGenerated: '450.00',
      airQualityScore: '78.50',
      treesEquivalent: '12',
    })
    .onConflictDoNothing();

  const greenFunds = [
    {
      id: '00000000-0000-0000-0000-000000000101',
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
      id: '00000000-0000-0000-0000-000000000102',
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
      id: '00000000-0000-0000-0000-000000000103',
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

  const greenBonds = [
    {
      id: '00000000-0000-0000-0000-000000000201',
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
      id: '00000000-0000-0000-0000-000000000202',
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
      id: '00000000-0000-0000-0000-000000000203',
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

  const invits = [
    {
      id: '00000000-0000-0000-0000-000000000301',
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
      id: '00000000-0000-0000-0000-000000000302',
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
      id: '00000000-0000-0000-0000-000000000303',
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
