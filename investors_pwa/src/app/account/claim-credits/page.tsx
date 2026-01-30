'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Leaf, Upload, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';

type ClaimVerification = {
  isGreenProduct: boolean;
  reason: string;
  productCategory: string;
  estimatedPrice?: number;
};

type ClaimResponseData = {
  claimId: string;
  isApproved: boolean;
  creditsRedeemed: number;
  newBalance: number;
  verificationResult?: ClaimVerification;
  message?: string;
};

type ClaimApiResponse =
  | { success: true; data: ClaimResponseData }
  | { success: false; error: string };

type ClaimResult = ClaimResponseData | { error: string };

export default function ClaimCreditsPage() {
  const [balance, setBalance] = useState(0);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  async function fetchBalance() {
    try {
      const res = await fetch('/api/green-credits');
      const data = (await res.json()) as { success: boolean; data?: { balance: number } };
      if (data.success) {
        setBalance(data.data?.balance ?? 0);
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

      const res = await fetch('/api/green-credits/claim', { method: 'POST', body: formData });
      const data = (await res.json()) as ClaimApiResponse;

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
      <div className="flex items-center gap-4 mb-6">
        <Link href="/account" className="p-2 -ml-2" aria-label="Back to Account">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">Claim Green Credits</h1>
      </div>

      <Card className="mb-6 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
            <Leaf className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Available Balance</p>
            <p className="text-3xl font-bold text-green-500">{formatCurrency(balance)}</p>
          </div>
        </div>
      </Card>

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

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Product Name</label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Tata Nexon EV, Solar Panel 5kW"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Product Price (₹)</label>
            <Input
              type="number"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Upload Invoice (Optional)</label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-700 rounded-lg p-6 cursor-pointer hover:border-gray-600 transition-colors">
              <Upload className="w-5 h-5 text-gray-500" />
              <span className="text-gray-500">{file ? file.name : 'Click to upload'}</span>
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <Button type="submit" disabled={loading || balance <= 0} className="w-full" size="lg">
            {loading ? 'Verifying...' : 'Submit Claim'}
          </Button>

          {balance <= 0 && (
            <p className="text-sm text-red-500 text-center">
              You don’t have any green credits to claim
            </p>
          )}
        </form>
      ) : (
        <ResultCard result={result} onReset={() => setResult(null)} />
      )}
    </div>
  );
}

function ResultCard({ result, onReset }: { result: ClaimResult; onReset: () => void }) {
  const isApproved = 'isApproved' in result && Boolean(result.isApproved);

  return (
    <Card
      className={`text-center py-8 ${
        isApproved ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'
      }`}
    >
      {isApproved ? (
        <>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-500 mb-2">Claim Approved!</h3>
          <p className="text-gray-400 mb-4">{('message' in result && result.message) || 'Approved'}</p>
          <div className="bg-black/30 rounded-lg p-4 inline-block">
            <p className="text-sm text-gray-400">Amount Credited</p>
            <p className="text-3xl font-bold text-green-500">
              {formatCurrency('creditsRedeemed' in result ? result.creditsRedeemed : 0)}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            New balance: {formatCurrency('newBalance' in result ? result.newBalance : 0)}
          </p>
        </>
      ) : (
        <>
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-500 mb-2">Claim Rejected</h3>
          <p className="text-gray-400 mb-4">
            {('message' in result && result.message) ||
              ('error' in result && result.error) ||
              'Product not eligible for green credits'}
          </p>
          {'verificationResult' in result && result.verificationResult?.reason && (
            <p className="text-sm text-gray-500">Reason: {result.verificationResult.reason}</p>
          )}
        </>
      )}

      <Button onClick={onReset} variant="secondary" className="mt-6">
        Submit Another Claim
      </Button>
    </Card>
  );
}
