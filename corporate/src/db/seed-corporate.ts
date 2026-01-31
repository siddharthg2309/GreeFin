import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { loadEnvConfig } from '@next/env';

import { MOCK_CORPORATE_ID } from '@/lib/mock-corporate';

import { corporates, csrFundings } from './schema';

loadEnvConfig(process.cwd());

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log('Seeding corporate data...');

  await db
    .insert(corporates)
    .values({
      id: MOCK_CORPORATE_ID,
      name: 'Tata Green Initiative',
      email: 'green@tata.com',
      companyName: 'Tata Power',
      sector: 'Energy',
      registrationNumber: 'CIN-U12345MH2000PLC123456',
      address: 'Bombay House, Mumbai, Maharashtra',
    })
    .onConflictDoNothing();

  await db
    .insert(csrFundings)
    .values({
      corporateId: MOCK_CORPORATE_ID,
      totalAmount: '5000000.00',
      remainingAmount: '5000000.00',
      description: 'CSR allocation for FY 2024-25 Green Credits Program',
      fiscalYear: '2024-25',
      status: 'ACTIVE',
    })
    .onConflictDoNothing();

  console.log('Corporate seeding complete!');
}

seed().catch(console.error);
