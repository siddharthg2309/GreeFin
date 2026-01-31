import { NextResponse } from 'next/server';
import { and, eq, gt } from 'drizzle-orm';

import { csrFundings, greenCreditClaims, users } from '@/db/schema';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/mock-user';
import { verifyGreenProduct } from '@/lib/ai-agent';
import { extractTextFromFile } from '@/lib/ocr';

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
        { success: false, error: 'Product name and valid price are required' },
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

    let invoiceText: string | undefined;
    if (file && file.size > 0) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        return NextResponse.json(
          { success: false, error: 'Only PDF invoices are accepted.' },
          { status: 400 }
        );
      }

      try {
        invoiceText = await extractTextFromFile(file);
        if (!invoiceText || invoiceText.trim().length === 0) {
          console.warn('PDF text extraction returned empty text; continuing without invoice text.');
          invoiceText = undefined;
        }
      } catch (ocrError) {
        console.error('OCR extraction failed:', ocrError);
        invoiceText = undefined;
      }
    }

    const [claim] = await db
      .insert(greenCreditClaims)
      .values({
        userId,
        productName,
        productPrice: productPrice.toString(),
        uploadedFileUrl: file ? `uploaded:${file.name}` : null,
        status: 'PENDING',
      })
      .returning();

    let verificationResult;
    let isApproved = false;
    let creditsToRedeem = 0;
    let verificationMethod: 'ai' | 'fallback' = process.env.OPENROUTER_API_KEY ? 'ai' : 'fallback';

    try {
      verificationResult = await verifyGreenProduct({
        productName,
        productPrice,
        userCredits: currentCredits,
        invoiceText,
      });

      isApproved = verificationResult.isGreenProduct;
      if (isApproved) {
        creditsToRedeem = Math.min(productPrice, currentCredits);
      }
    } catch (aiError) {
      console.error('AI verification failed, using fallback:', aiError);

      isApproved = true;
      creditsToRedeem = currentCredits;
      verificationMethod = 'fallback';
      verificationResult = {
        isGreenProduct: true,
        reason: 'AI verification unavailable - auto-approved',
        productCategory: 'Unknown',
        confidence: 'low' as const,
      };
    }

    let csrFundingId: string | null = null;
    if (isApproved && creditsToRedeem > 0) {
      const [csrFunding] = await db
        .select({
          id: csrFundings.id,
          remainingAmount: csrFundings.remainingAmount,
        })
        .from(csrFundings)
        .where(and(eq(csrFundings.status, 'ACTIVE'), gt(csrFundings.remainingAmount, '0')))
        .limit(1);

      if (csrFunding) {
        const newRemaining = Number.parseFloat(csrFunding.remainingAmount) - creditsToRedeem;

        await db
          .update(csrFundings)
          .set({
            remainingAmount: Math.max(0, newRemaining).toString(),
            status: newRemaining <= 0 ? 'EXHAUSTED' : 'ACTIVE',
            updatedAt: new Date(),
          })
          .where(eq(csrFundings.id, csrFunding.id));

        csrFundingId = csrFunding.id;
      }
    }

    await db
      .update(greenCreditClaims)
      .set({
        aiVerificationResult: JSON.stringify({
          ...verificationResult,
          verificationMethod,
          invoiceProvided: Boolean(invoiceText && invoiceText.trim().length > 0),
          invoiceTextLength: invoiceText?.length || 0,
        }),
        isApproved,
        creditsRedeemed: creditsToRedeem.toString(),
        csrFundingId,
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
        verificationResult: {
          ...verificationResult,
          method: verificationMethod,
          invoiceProcessed: Boolean(invoiceText && invoiceText.trim().length > 0),
        },
        message: isApproved
          ? verificationMethod === 'fallback'
            ? `Claim approved (auto-approved). ₹${creditsToRedeem.toFixed(2)} credited to your account.`
            : `Claim approved! ₹${creditsToRedeem.toFixed(2)} credited to your account for your ${verificationResult.productCategory || 'green product'} purchase.`
          : `Claim rejected: ${verificationResult?.reason || 'Product not eligible for green credits'}`,
      },
    });
  } catch (error) {
    console.error('Error processing claim:', error);
    return NextResponse.json({ success: false, error: 'Failed to process claim' }, { status: 500 });
  }
}
