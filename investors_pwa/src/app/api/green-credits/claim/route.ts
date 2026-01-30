import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { greenCreditClaims, users } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/mock-user';
import { verifyGreenProduct } from '@/lib/ai-agent';

export async function POST(request: Request) {
  try {
    const userId = getCurrentUserId();
    const formData = await request.formData();

    const fileEntry = formData.get('file');
    const file = fileEntry instanceof File ? fileEntry : null;

    const productNameEntry = formData.get('productName');
    const productPriceEntry = formData.get('productPrice');

    const productName = typeof productNameEntry === 'string' ? productNameEntry.trim() : '';
    const productPrice = typeof productPriceEntry === 'string' ? Number.parseFloat(productPriceEntry) : NaN;

    if (!productName || !Number.isFinite(productPrice) || productPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Product name and price required' },
        { status: 400 }
      );
    }

    const [user] = await db
      .select({ greenCredits: users.greenCredits })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const currentCredits = Number.parseFloat(user.greenCredits || '0');
    if (currentCredits <= 0) {
      return NextResponse.json({ success: false, error: 'No green credits available' }, { status: 400 });
    }

    const [claim] = await db
      .insert(greenCreditClaims)
      .values({
        userId,
        productName,
        productPrice: productPrice.toString(),
        uploadedFileUrl: file ? 'uploaded' : null,
        status: 'PENDING',
      })
      .returning();

    let verificationResult;
    let isApproved = false;
    let creditsToRedeem = 0;

    try {
      verificationResult = await verifyGreenProduct({
        productName,
        productPrice,
        userCredits: currentCredits,
      });

      isApproved = verificationResult.isGreenProduct;
      if (isApproved) {
        creditsToRedeem = Math.min(productPrice, currentCredits);
      }
    } catch (aiError) {
      console.error('AI verification failed, using fallback:', aiError);

      isApproved = true;
      creditsToRedeem = currentCredits;
      verificationResult = {
        isGreenProduct: true,
        reason: 'AI verification unavailable - auto-approved',
        productCategory: 'Unknown',
      };
    }

    await db
      .update(greenCreditClaims)
      .set({
        aiVerificationResult: JSON.stringify(verificationResult),
        isApproved,
        creditsRedeemed: creditsToRedeem.toString(),
        status: isApproved ? 'APPROVED' : 'REJECTED',
        processedAt: new Date(),
      })
      .where(eq(greenCreditClaims.id, claim.id));

    if (isApproved && creditsToRedeem > 0) {
      const newCredits = currentCredits - creditsToRedeem;

      await db
        .update(users)
        .set({
          greenCredits: newCredits.toString(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    return NextResponse.json({
      success: true,
      data: {
        claimId: claim.id,
        isApproved,
        creditsRedeemed: creditsToRedeem,
        newBalance: isApproved ? currentCredits - creditsToRedeem : currentCredits,
        verificationResult,
        message: isApproved
          ? `Claim approved! ₹${creditsToRedeem.toFixed(2)} credited to your account.`
          : `Claim rejected: ${verificationResult?.reason || 'Product not eligible for green credits'}`,
      },
    });
  } catch (error) {
    console.error('Error processing claim:', error);
    return NextResponse.json({ success: false, error: 'Failed to process claim' }, { status: 500 });
  }
}

