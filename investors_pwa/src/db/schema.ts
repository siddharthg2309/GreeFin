import {
  boolean,
  date,
  decimal,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const fundTypeEnum = pgEnum('fund_type', ['GREEN_BOND', 'INVIT', 'GREEN_FUND']);
export const orderTypeEnum = pgEnum('order_type', ['BUY', 'SELL']);
export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']);
export const sipFrequencyEnum = pgEnum('sip_frequency', ['WEEKLY', 'MONTHLY']);
export const sipStatusEnum = pgEnum('sip_status', ['ACTIVE', 'PAUSED', 'CANCELLED']);
export const claimStatusEnum = pgEnum('claim_status', ['PENDING', 'APPROVED', 'REJECTED']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  profilePic: varchar('profile_pic', { length: 500 }),
  greenCredits: decimal('green_credits', { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

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
  description: text('description'),
  logoUrl: varchar('logo_url', { length: 500 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const holdings = pgTable('holdings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  fundId: uuid('fund_id')
    .references(() => funds.id)
    .notNull(),
  quantity: decimal('quantity', { precision: 12, scale: 4 }).notNull(),
  avgBuyPrice: decimal('avg_buy_price', { precision: 10, scale: 4 }).notNull(),
  investedAmount: decimal('invested_amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  fundId: uuid('fund_id')
    .references(() => funds.id)
    .notNull(),
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
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  fundId: uuid('fund_id')
    .references(() => funds.id)
    .notNull(),
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
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  fundId: uuid('fund_id')
    .references(() => funds.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const greenCreditClaims = pgTable('green_credit_claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
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

export const impactMetrics = pgTable('impact_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  co2Avoided: decimal('co2_avoided', { precision: 10, scale: 2 }).default('0'),
  cleanEnergyGenerated: decimal('clean_energy_generated', { precision: 10, scale: 2 }).default('0'),
  airQualityScore: decimal('air_quality_score', { precision: 5, scale: 2 }).default('0'),
  treesEquivalent: decimal('trees_equivalent', { precision: 10, scale: 0 }).default('0'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Fund = typeof funds.$inferSelect;
export type Holding = typeof holdings.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Sip = typeof sips.$inferSelect;
export type Watchlist = typeof watchlist.$inferSelect;
export type GreenCreditClaim = typeof greenCreditClaims.$inferSelect;
export type ImpactMetric = typeof impactMetrics.$inferSelect;

