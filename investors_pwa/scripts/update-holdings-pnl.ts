import 'dotenv/config';
import { db } from '../src/lib/db';
import { holdings, funds } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * This script updates existing holdings to show realistic P&L
 * by setting avgBuyPrice lower than current NAV (showing profit)
 */
async function updateHoldingsForPnL() {
    console.log('📊 Updating holdings with realistic buy prices for P&L display...\n');

    // Get all holdings with their fund data
    const allHoldings = await db
        .select({
            holdingId: holdings.id,
            fundId: holdings.fundId,
            quantity: holdings.quantity,
            investedAmount: holdings.investedAmount,
            fundName: funds.name,
            currentNav: funds.nav,
        })
        .from(holdings)
        .innerJoin(funds, eq(holdings.fundId, funds.id));

    console.log(`Found ${allHoldings.length} holdings to update.\n`);

    for (const holding of allHoldings) {
        const currentNav = parseFloat(holding.currentNav);
        const investedAmount = parseFloat(holding.investedAmount);

        // Generate a random profit between 5% to 25%
        const profitPercent = 5 + Math.random() * 20;

        // Calculate what the buy price would have been
        const avgBuyPrice = currentNav / (1 + profitPercent / 100);

        // Recalculate quantity based on invested amount and new buy price
        const newQuantity = investedAmount / avgBuyPrice;

        // Update the holding
        await db
            .update(holdings)
            .set({
                avgBuyPrice: avgBuyPrice.toFixed(4),
                quantity: newQuantity.toFixed(4),
                updatedAt: new Date(),
            })
            .where(eq(holdings.id, holding.holdingId));

        const currentValue = newQuantity * currentNav;
        const pnl = currentValue - investedAmount;
        const pnlPercent = (pnl / investedAmount) * 100;

        console.log(`✅ ${holding.fundName}`);
        console.log(`   Buy: ₹${avgBuyPrice.toFixed(2)} → Current: ₹${currentNav.toFixed(2)}`);
        console.log(`   P&L: ₹${pnl.toFixed(2)} (+${pnlPercent.toFixed(2)}%)\n`);
    }

    console.log('🎉 All holdings updated with realistic P&L!');
    process.exit(0);
}

updateHoldingsForPnL().catch((err) => {
    console.error('Update failed:', err);
    process.exit(1);
});
