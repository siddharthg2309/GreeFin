import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { loadEnvConfig } from '@next/env';
import { eq } from 'drizzle-orm';

import { MOCK_CORPORATE_ID } from '@/lib/mock-corporate';
import { corporates, csrFundings, funds, greenCreditClaims, users, impactMetrics } from './schema';

loadEnvConfig(process.cwd());

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Demo user ID (matching investors_pwa)
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function seedCorporateData() {
  console.log('🌱 Seeding comprehensive corporate data...\n');

  // 1. Ensure corporate exists
  console.log('📊 Creating corporate profile...');
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

  // 2. Add CSR Funding allocations with realistic utilization
  console.log('💰 Creating CSR fund allocations...');

  // Main FY 2024-25 allocation (partially utilized)
  await db.insert(csrFundings).values({
    corporateId: MOCK_CORPORATE_ID,
    totalAmount: '7500000.00',
    remainingAmount: '5235000.00',  // 70% remaining
    description: 'CSR allocation for FY 2024-25 Green Credits Program',
    fiscalYear: '2024-25',
    status: 'ACTIVE',
  }).onConflictDoNothing();

  // Q4 allocation  
  await db.insert(csrFundings).values({
    corporateId: MOCK_CORPORATE_ID,
    totalAmount: '2500000.00',
    remainingAmount: '1850000.00',  // Some utilized
    description: 'Q4 Green Energy Incentive Fund',
    fiscalYear: '2024-25',
    status: 'ACTIVE',
  }).onConflictDoNothing();

  // Previous FY allocation (exhausted)
  await db.insert(csrFundings).values({
    corporateId: MOCK_CORPORATE_ID,
    totalAmount: '5000000.00',
    remainingAmount: '0.00',
    description: 'CSR allocation for FY 2023-24 Green Credits Program',
    fiscalYear: '2023-24',
    status: 'EXHAUSTED',
  }).onConflictDoNothing();

  // 3. Add Green Bonds issued by corporate
  console.log('📈 Adding corporate-issued Green Bonds...');
  const greenBonds = [
    { name: 'Tata Power Green Bond 2027', nav: '1000.00', minInvestment: '10000', fixedReturn: '7.85', description: 'Green bond for renewable energy projects' },
    { name: 'Tata Renewables Bond Series A', nav: '1000.00', minInvestment: '25000', fixedReturn: '8.10', description: 'Funding solar and wind installations' },
    { name: 'Tata EV Infrastructure Bond', nav: '1000.00', minInvestment: '15000', fixedReturn: '7.65', description: 'EV charging infrastructure development' },
    { name: 'Tata Clean Energy Bond 2028', nav: '1000.00', minInvestment: '20000', fixedReturn: '8.25', description: 'Hybrid renewable energy projects' },
    { name: 'Tata Green Hydrogen Bond', nav: '1000.00', minInvestment: '50000', fixedReturn: '8.50', description: 'Green hydrogen production facilities' },
  ];

  for (const bond of greenBonds) {
    await db.insert(funds).values({
      ...bond,
      type: 'GREEN_BOND',
      issuerId: MOCK_CORPORATE_ID,
      issuerType: 'CORPORATE',
      launchDate: '2024-06-15',
      maturityDate: '2027-06-15',
      expenseRatio: '0.15',
    }).onConflictDoNothing();
    console.log(`  ✅ ${bond.name}`);
  }

  // 4. Add InvITs issued by corporate
  console.log('🏗️ Adding corporate-issued InvITs...');
  const invits = [
    { name: 'Tata Power Transmission InvIT', nav: '125.50', minInvestment: '5000', cagr1y: '11.50', description: 'Power transmission infrastructure' },
    { name: 'Tata Renewable Energy InvIT', nav: '142.75', minInvestment: '5000', cagr1y: '13.25', description: 'Solar and wind energy assets' },
    { name: 'Tata Green Corridor InvIT', nav: '98.40', minInvestment: '10000', cagr1y: '9.80', description: 'Highway and infrastructure projects' },
    { name: 'Tata Smart Grid InvIT', nav: '156.20', minInvestment: '5000', cagr1y: '14.50', description: 'Smart grid infrastructure investments' },
    { name: 'Tata Solar Parks InvIT', nav: '118.90', minInvestment: '5000', cagr1y: '12.30', description: 'Utility-scale solar park assets' },
  ];

  for (const invit of invits) {
    await db.insert(funds).values({
      ...invit,
      type: 'INVIT',
      issuerId: MOCK_CORPORATE_ID,
      issuerType: 'CORPORATE',
      launchDate: '2023-04-01',
      expenseRatio: '0.45',
    }).onConflictDoNothing();
    console.log(`  ✅ ${invit.name}`);
  }

  // 5. Get first CSR funding for linking redemptions
  const [csrFunding] = await db.select().from(csrFundings).limit(1);

  // 6. Add recent redemptions (green credit claims)
  console.log('🎁 Adding recent redemptions...');

  // Ensure demo user exists
  await db.insert(users).values({
    id: DEMO_USER_ID,
    name: 'Pragit R V',
    email: 'pragit@demo.com',
    greenCredits: '15000.00',
  }).onConflictDoNothing();

  const redemptions = [
    { productName: 'Solar Panel 5kW', productPrice: '2500.00', creditsRedeemed: '2500.00', date: '2026-01-31' },
    { productName: 'Ather 450X Electric Scooter', productPrice: '145000.00', creditsRedeemed: '12500.00', date: '2026-01-28' },
    { productName: 'Tata Nexon EV', productPrice: '1450000.00', creditsRedeemed: '25000.00', date: '2026-01-25' },
    { productName: 'Luminous Solar Inverter', productPrice: '35000.00', creditsRedeemed: '5000.00', date: '2026-01-22' },
    { productName: 'LED Panel Lighting System', productPrice: '8500.00', creditsRedeemed: '2500.00', date: '2026-01-20' },
    { productName: 'Electric Bicycle', productPrice: '45000.00', creditsRedeemed: '7500.00', date: '2026-01-18' },
  ];

  for (const redemption of redemptions) {
    await db.insert(greenCreditClaims).values({
      userId: DEMO_USER_ID,
      productName: redemption.productName,
      productPrice: redemption.productPrice,
      creditsRedeemed: redemption.creditsRedeemed,
      isApproved: true,
      status: 'APPROVED',
      csrFundingId: csrFunding?.id,
      aiVerificationResult: JSON.stringify({
        isGreenProduct: true,
        reason: 'Verified green product',
        productCategory: 'Green Energy',
        confidence: 'high',
      }),
      processedAt: new Date(redemption.date),
      createdAt: new Date(redemption.date),
    }).onConflictDoNothing();
    console.log(`  ✅ ${redemption.productName} - ₹${redemption.creditsRedeemed}`);
  }

  // 7. Update impact metrics with realistic data
  console.log('🌍 Updating environmental impact metrics...');

  await db.update(impactMetrics).set({
    co2Avoided: '2450.75',
    cleanEnergyGenerated: '8500.50',
    airQualityScore: '85.50',
    treesEquivalent: '125',
    updatedAt: new Date(),
  }).where(eq(impactMetrics.userId, DEMO_USER_ID));

  // Also insert if not exists
  await db.insert(impactMetrics).values({
    userId: DEMO_USER_ID,
    co2Avoided: '2450.75',
    cleanEnergyGenerated: '8500.50',
    airQualityScore: '85.50',
    treesEquivalent: '125',
  }).onConflictDoNothing();

  console.log('\n🎉 Corporate data seeding complete!');
  console.log('\n📊 Summary:');
  console.log('   • 3 CSR fund allocations');
  console.log('   • 5 Green Bonds');
  console.log('   • 5 InvITs');
  console.log('   • 6 Recent redemptions');
  console.log('   • Environmental impact metrics updated');
}

seedCorporateData().catch(console.error);
