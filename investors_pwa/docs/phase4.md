# Phase 4: Account, Green Credits & AI Agent

## Overview
Build the Account page with profile, Green Credits display, claim functionality with AI verification using LangChain + OpenRouter, and finalize PWA setup.

**UI References:**
- Account Page: `docs/images/WhatsApp Image 2026-01-30 at 1.52.10 PM.jpeg`

---

## 4.1 Green Credits API

### Route: `GET /api/green-credits` - Get Balance
**File:** `src/app/api/green-credits/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/mock-user';

export async function GET() {
  try {
    const userId = getCurrentUserId();

    const [user] = await db
      .select({
        greenCredits: users.greenCredits,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: parseFloat(user.greenCredits || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching green credits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch green credits' },
      { status: 500 }
    );
  }
}
```

---

### Route: `POST /api/green-credits/claim` - Submit Claim
**File:** `src/app/api/green-credits/claim/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, greenCreditClaims } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/mock-user';
import { verifyGreenProduct } from '@/lib/ai-agent';

export async function POST(request: Request) {
  try {
    const userId = getCurrentUserId();
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const productName = formData.get('productName') as string;
    const productPrice = parseFloat(formData.get('productPrice') as string);

    if (!productName || !productPrice) {
      return NextResponse.json(
        { success: false, error: 'Product name and price required' },
        { status: 400 }
      );
    }

    // Get user's current green credits
    const [user] = await db
      .select({ greenCredits: users.greenCredits })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const currentCredits = parseFloat(user.greenCredits || '0');

    if (currentCredits <= 0) {
      return NextResponse.json(
        { success: false, error: 'No green credits available' },
        { status: 400 }
      );
    }

    // Create pending claim
    const [claim] = await db
      .insert(greenCreditClaims)
      .values({
        userId,
        productName,
        productPrice: productPrice.toString(),
        uploadedFileUrl: file ? 'uploaded' : null, // In production, upload to S3/R2
        status: 'PENDING',
      })
      .returning();

    // Verify with AI agent
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
        // Calculate credits to redeem (min of product price and available credits)
        creditsToRedeem = Math.min(productPrice, currentCredits);
      }
    } catch (aiError) {
      console.error('AI verification failed, using fallback:', aiError);

      // FALLBACK: If AI fails, approve and redeem all credits
      isApproved = true;
      creditsToRedeem = currentCredits;
      verificationResult = {
        isGreenProduct: true,
        reason: 'AI verification unavailable - auto-approved',
        productCategory: 'Unknown',
      };
    }

    // Update claim with verification result
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

    // If approved, deduct credits from user
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
    return NextResponse.json(
      { success: false, error: 'Failed to process claim' },
      { status: 500 }
    );
  }
}
```

---

## 4.2 AI Agent for Green Product Verification

### File: `src/lib/ai-agent.ts`

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// Initialize OpenRouter client
const llm = new ChatOpenAI({
  modelName: 'anthropic/claude-3-haiku', // Fast and cheap for verification
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
  },
  temperature: 0,
});

interface VerificationInput {
  productName: string;
  productPrice: number;
  userCredits: number;
}

interface VerificationResult {
  isGreenProduct: boolean;
  reason: string;
  productCategory: string;
  estimatedPrice?: number;
}

// List of valid green/renewable product categories
const GREEN_CATEGORIES = [
  'solar panel',
  'solar water heater',
  'electric vehicle',
  'ev',
  'e-bike',
  'electric scooter',
  'electric car',
  'battery storage',
  'home battery',
  'wind turbine',
  'energy efficient appliance',
  'led lights',
  'smart thermostat',
  'insulation',
  'heat pump',
  'rainwater harvesting',
  'composting system',
  'bicycle',
  'e-bicycle',
  'public transport pass',
  'metro card',
];

export async function verifyGreenProduct(
  input: VerificationInput
): Promise<VerificationResult> {
  const { productName, productPrice, userCredits } = input;

  const systemPrompt = `You are a green product verification assistant for GreenFin.
Your job is to determine if a product qualifies for green credit redemption.

ELIGIBLE PRODUCTS (renewable energy or eco-friendly):
- Solar panels, solar water heaters, solar inverters
- Electric vehicles (EVs), e-bikes, electric scooters
- Home batteries, energy storage systems
- Energy efficient appliances (5-star rated)
- LED lighting systems
- Heat pumps, smart thermostats
- Rainwater harvesting systems
- Bicycles, public transport passes

NOT ELIGIBLE:
- Regular vehicles (petrol/diesel)
- Standard home appliances
- Electronics (phones, laptops, TVs)
- Clothing, furniture, food
- Any non-environmental products

Respond in JSON format:
{
  "isGreenProduct": boolean,
  "reason": "Brief explanation",
  "productCategory": "Category name or 'Not Eligible'",
  "estimatedPrice": number (estimated market price in INR)
}`;

  const userPrompt = `Verify this product for green credit redemption:

Product Name: ${productName}
Claimed Price: ₹${productPrice}
User's Available Credits: ₹${userCredits}

Is this a valid green/renewable energy product? Respond with JSON only.`;

  try {
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    const content = response.content as string;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]) as VerificationResult;

    // Additional validation: check if product name contains green keywords
    const productLower = productName.toLowerCase();
    const hasGreenKeyword = GREEN_CATEGORIES.some(cat =>
      productLower.includes(cat.toLowerCase())
    );

    // If AI says not green but product has green keyword, trust the keyword
    if (!result.isGreenProduct && hasGreenKeyword) {
      result.isGreenProduct = true;
      result.reason = `Product contains green keyword: ${productName}`;
    }

    return result;
  } catch (error) {
    console.error('AI verification error:', error);

    // Fallback: Simple keyword matching
    const productLower = productName.toLowerCase();
    const isGreen = GREEN_CATEGORIES.some(cat =>
      productLower.includes(cat.toLowerCase())
    );

    return {
      isGreenProduct: isGreen,
      reason: isGreen
        ? 'Product matches green category keywords'
        : 'Product does not match any green category',
      productCategory: isGreen ? 'Green Product' : 'Not Eligible',
    };
  }
}

// Tool functions for agent (if using more complex agent setup)
export const agentTools = {
  // Check if product is green
  async verifyProduct(name: string): Promise<boolean> {
    const productLower = name.toLowerCase();
    return GREEN_CATEGORIES.some(cat => productLower.includes(cat.toLowerCase()));
  },

  // Get user's green credits
  async getGreenCredits(userId: string): Promise<number> {
    // This would be called from DB in actual implementation
    return 0; // Placeholder
  },

  // Update user's green credits
  async updateGreenCredits(
    userId: string,
    amount: number,
    operation: 'add' | 'subtract'
  ): Promise<number> {
    // This would update DB in actual implementation
    return 0; // Placeholder
  },

  // Approve a claim
  async approveClaim(claimId: string): Promise<boolean> {
    // This would update claim status in DB
    return true; // Placeholder
  },

  // Reject a claim
  async rejectClaim(claimId: string, reason: string): Promise<boolean> {
    // This would update claim status in DB
    return true; // Placeholder
  },
};
```

---

## 4.3 Account Page

### File: `src/app/account/page.tsx`

```typescript
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { mockUser } from '@/lib/mock-user';
import { formatCurrency } from '@/lib/utils';
import {
  CreditCard,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Leaf,
} from 'lucide-react';
import Link from 'next/link';

async function getGreenCredits() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/green-credits`, {
    cache: 'no-store',
  });
  if (!res.ok) return { balance: 0 };
  const data = await res.json();
  return data.data;
}

export default async function AccountPage() {
  const { balance } = await getGreenCredits();

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Account</h1>
        <button className="p-2">
          <span className="sr-only">Notifications</span>
          {/* Bell icon */}
        </button>
      </div>

      {/* Profile Card */}
      <Card className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 text-xl font-bold">
            {mockUser.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <h2 className="text-lg font-semibold">{mockUser.name}</h2>
          <p className="text-sm text-gray-500">{mockUser.email}</p>
        </div>
      </Card>

      {/* Green Credits Card */}
      <Link href="/account/claim-credits">
        <Card className="mb-6 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Green Credits Balance</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-500">
              <span className="text-sm">Claim</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Card>
      </Link>

      {/* Menu Items */}
      <div className="space-y-2">
        <MenuItem
          icon={CreditCard}
          label="Payments"
          description="Manage payment methods"
          href="#"
        />
        <MenuItem
          icon={HelpCircle}
          label="Support"
          description="Get help with your account"
          href="#"
        />
        <MenuItem
          icon={FileText}
          label="Terms & Conditions"
          description="Read our terms of service"
          href="#"
        />
      </div>

      {/* Logout */}
      <div className="mt-8">
        <Button variant="ghost" className="w-full justify-start text-red-500">
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  description,
  href,
}: {
  icon: any;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-4 hover:bg-gray-800 transition-colors">
        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-500" />
      </Card>
    </Link>
  );
}
```

---

## 4.4 Claim Green Credits Page

### File: `src/app/account/claim-credits/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Leaf, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

export default function ClaimCreditsPage() {
  const [balance, setBalance] = useState(0);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  async function fetchBalance() {
    try {
      const res = await fetch('/api/green-credits');
      const data = await res.json();
      if (data.success) {
        setBalance(data.data.balance);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!productName || !productPrice) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('productName', productName);
      formData.append('productPrice', productPrice);
      if (file) {
        formData.append('file', file);
      }

      const res = await fetch('/api/green-credits/claim', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.data);
        setBalance(data.data.newBalance);
      } else {
        setResult({ error: data.error });
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      setResult({ error: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/account" className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">Claim Green Credits</h1>
      </div>

      {/* Balance Card */}
      <Card className="mb-6 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
            <Leaf className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Available Balance</p>
            <p className="text-3xl font-bold text-green-500">
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
      </Card>

      {/* Info */}
      <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
        <h3 className="font-medium mb-2">How it works</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>1. Enter details of your green/renewable energy purchase</li>
          <li>2. Upload invoice or receipt (optional)</li>
          <li>3. Our AI verifies if the product is eligible</li>
          <li>4. If approved, credits are converted to cash</li>
        </ul>
        <p className="text-xs text-gray-500 mt-4">
          Eligible products: Solar panels, EVs, e-bikes, home batteries, etc.
        </p>
      </div>

      {/* Claim Form */}
      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Product Name
            </label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Tata Nexon EV, Solar Panel 5kW"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Product Price (₹)
            </label>
            <Input
              type="number"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Upload Invoice (Optional)
            </label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-700 rounded-lg p-6 cursor-pointer hover:border-gray-600 transition-colors">
              <Upload className="w-5 h-5 text-gray-500" />
              <span className="text-gray-500">
                {file ? file.name : 'Click to upload'}
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading || balance <= 0}
            className="w-full"
            size="lg"
          >
            {loading ? 'Verifying...' : 'Submit Claim'}
          </Button>

          {balance <= 0 && (
            <p className="text-sm text-red-500 text-center">
              You don't have any green credits to claim
            </p>
          )}
        </form>
      ) : (
        <ResultCard result={result} onReset={() => setResult(null)} />
      )}
    </div>
  );
}

function ResultCard({ result, onReset }: { result: any; onReset: () => void }) {
  const isApproved = result.isApproved;

  return (
    <Card className={`text-center py-8 ${
      isApproved ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'
    }`}>
      {isApproved ? (
        <>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-500 mb-2">
            Claim Approved!
          </h3>
          <p className="text-gray-400 mb-4">{result.message}</p>
          <div className="bg-black/30 rounded-lg p-4 inline-block">
            <p className="text-sm text-gray-400">Amount Credited</p>
            <p className="text-3xl font-bold text-green-500">
              {formatCurrency(result.creditsRedeemed)}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            New balance: {formatCurrency(result.newBalance)}
          </p>
        </>
      ) : (
        <>
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-500 mb-2">
            Claim Rejected
          </h3>
          <p className="text-gray-400 mb-4">
            {result.message || result.error || 'Product not eligible for green credits'}
          </p>
          {result.verificationResult?.reason && (
            <p className="text-sm text-gray-500">
              Reason: {result.verificationResult.reason}
            </p>
          )}
        </>
      )}

      <Button onClick={onReset} variant="secondary" className="mt-6">
        Submit Another Claim
      </Button>
    </Card>
  );
}
```

---

## 4.5 Fund Actions Component

### File: `src/components/fund/FundActions.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BuyModal } from './BuyModal';
import { SipModal } from './SipModal';
import type { Fund } from '@/db/schema';

interface FundActionsProps {
  fund: Fund;
}

export function FundActions({ fund }: FundActionsProps) {
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSipModal, setShowSipModal] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleWatchlist = async () => {
    try {
      if (inWatchlist) {
        await fetch(`/api/watchlist/${fund.id}`, { method: 'DELETE' });
        setInWatchlist(false);
      } else {
        await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fundId: fund.id }),
        });
        setInWatchlist(true);
      }
    } catch (error) {
      console.error('Watchlist error:', error);
    }
  };

  const handleSuccess = (data: any) => {
    setShowBuyModal(false);
    setShowSipModal(false);
    setSuccess(data.message);
    setTimeout(() => setSuccess(null), 5000);
  };

  return (
    <>
      {/* Watchlist Button */}
      <div className="px-4 mb-4">
        <button
          onClick={handleWatchlist}
          className="flex items-center gap-2 text-sm"
        >
          <Heart
            className={`w-4 h-4 ${inWatchlist ? 'fill-red-500 text-red-500' : ''}`}
          />
          {inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mx-4 mb-4 p-4 bg-green-900/30 border border-green-800 rounded-lg">
          <p className="text-green-500 text-sm">{success}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-black border-t border-gray-800">
        <div className="flex gap-4 max-w-md mx-auto">
          <Button
            onClick={() => setShowBuyModal(true)}
            className="flex-1"
            size="lg"
          >
            Buy
          </Button>
          <Button
            onClick={() => setShowSipModal(true)}
            variant="secondary"
            className="flex-1"
            size="lg"
          >
            SIP
          </Button>
        </div>
      </div>

      {/* Modals */}
      {showBuyModal && (
        <BuyModal
          fund={fund}
          onClose={() => setShowBuyModal(false)}
          onSuccess={handleSuccess}
        />
      )}
      {showSipModal && (
        <SipModal
          fund={fund}
          onClose={() => setShowSipModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
```

---

## 4.6 Fund Header Component

### File: `src/components/fund/FundHeader.tsx`

```typescript
'use client';

import { ArrowLeft, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Fund } from '@/db/schema';

interface FundHeaderProps {
  fund: Fund;
}

export function FundHeader({ fund }: FundHeaderProps) {
  const router = useRouter();

  const typeLabel = fund.type === 'GREEN_FUND'
    ? 'Green Fund'
    : fund.type === 'GREEN_BOND'
    ? 'Green Bond'
    : 'InvIT';

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="h-32 bg-gradient-to-br from-green-600 to-blue-600" />

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 p-2 bg-black/20 rounded-full"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Share button */}
      <button className="absolute top-4 right-4 p-2 bg-black/20 rounded-full">
        <Share2 className="w-5 h-5" />
      </button>

      {/* Fund info overlay */}
      <div className="px-4 -mt-8 relative">
        <div className="flex items-end gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl shadow-lg" />
          <div className="pb-2">
            <h1 className="text-xl font-bold">{fund.name}</h1>
            <p className="text-sm text-gray-400">{typeLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 4.7 Price Chart Component (Mock)

### File: `src/components/fund/PriceChart.tsx`

```typescript
'use client';

import { useState } from 'react';

interface PriceChartProps {
  priceHistory: Record<string, { date: string; price: number }[]>;
}

const periods = ['3M', '6M', '1Y', '2Y', '3Y', 'Max'];

export function PriceChart({ priceHistory }: PriceChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('1Y');

  const data = priceHistory[selectedPeriod] || priceHistory['1Y'] || [];

  if (data.length === 0) {
    return null;
  }

  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  // Generate SVG path
  const width = 300;
  const height = 100;
  const padding = 10;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.price - minPrice) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  const isPositive = prices[prices.length - 1] >= prices[0];

  return (
    <div className="px-4 py-6">
      {/* Chart */}
      <div className="bg-gray-900 rounded-lg p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
          <path
            d={pathD}
            fill="none"
            stroke={isPositive ? '#22c55e' : '#ef4444'}
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Period Selector */}
      <div className="flex justify-between mt-4">
        {periods.map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period === 'Max' ? '3Y' : period)}
            className={`px-3 py-1 text-sm rounded ${
              (period === 'Max' ? '3Y' : period) === selectedPeriod
                ? 'bg-blue-600 text-white'
                : 'text-gray-500'
            }`}
          >
            {period}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## 4.8 Environment Variables

### File: `.env.local` (complete)

```env
# Database
DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/greenfin?sslmode=require

# OpenRouter for AI
OPENROUTER_API_KEY=sk-or-v1-xxxx

# App URL (for API calls in server components)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 4.9 PWA Final Setup

### File: `src/app/layout.tsx` (updated)

```typescript
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { BottomNav } from '@/components/layout/BottomNav';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GreenFin - Green Investments',
  description: 'Invest in India\'s green infrastructure. Earn Green Credits on every investment.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GreenFin',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <main className="pb-20 max-w-md mx-auto min-h-screen">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
```

---

## Phase 4 Checklist

- [ ] Create `GET /api/green-credits` route
- [ ] Create `POST /api/green-credits/claim` route
- [ ] Create AI agent with LangChain + OpenRouter
- [ ] Create Account page with profile and credits
- [ ] Create Claim Credits page with form
- [ ] Create FundActions component
- [ ] Create FundHeader component
- [ ] Create PriceChart component
- [ ] Add OpenRouter API key to env
- [ ] Test AI verification flow
- [ ] Test fallback when AI fails
- [ ] Verify PWA manifest and icons
- [ ] Test PWA installation on mobile
- [ ] Deploy to Vercel

---

## Deployment Checklist

1. **Neon Database**
   - Create database at neon.tech
   - Run `npm run db:push` to create tables
   - Run `npm run db:seed` to populate data

2. **Vercel**
   - Connect GitHub repo
   - Add environment variables:
     - `DATABASE_URL`
     - `OPENROUTER_API_KEY`
     - `NEXT_PUBLIC_BASE_URL` (your vercel URL)

3. **PWA Icons**
   - Create icons at 192x192 and 512x512
   - Add apple-touch-icon.png
   - Place in `/public/icons/`

4. **Testing**
   - Test all API routes
   - Test buy/SIP flows
   - Test green credit claim
   - Test PWA installation

---

## Summary

This completes the GreenFin Investor PWA implementation plan with:

- **Database**: 8 tables covering users, funds, holdings, orders, SIPs, watchlist, claims, and impact metrics
- **API Routes**: 15+ endpoints for all CRUD operations
- **Pages**: Home, Discover, Fund Detail, Investments, Account, Claim Credits
- **AI Agent**: LangChain + OpenRouter for green product verification
- **PWA**: Installable app with offline support

The app enables micro-investments in green infrastructure with 5% Green Credits rewards redeemable for renewable energy purchases.
