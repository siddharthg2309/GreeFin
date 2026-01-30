'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Leaf,
  Loader2,
  Upload,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';

type ClaimVerification = {
  isGreenProduct: boolean;
  reason: string;
  productCategory: string;
  confidence: 'high' | 'medium' | 'low';
  extractedDetails?: {
    detectedProductName?: string;
    detectedPrice?: number;
    sellerName?: string;
    invoiceDate?: string;
  };
  method?: 'ai' | 'fallback';
  invoiceProcessed?: boolean;
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
  const [loadingMessage, setLoadingMessage] = useState('');
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

  const getFileIcon = () => {
    if (!file) return Upload;
    if (file.type === 'application/pdf') return FileText;
    return FileText;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (!selected) {
      setFile(null);
      return;
    }

    const isPdf = selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      alert('Please upload a PDF invoice only.');
      e.currentTarget.value = '';
      setFile(null);
      return;
    }

    setFile(selected);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!productName.trim()) {
      alert('Please enter the product name');
      return;
    }

    if (!productPrice || Number.parseFloat(productPrice) <= 0) {
      alert('Please enter a valid product price');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      if (file) {
        setLoadingMessage('Processing invoice...');
        await new Promise((resolve) => setTimeout(resolve, 500));
        setLoadingMessage('Extracting text from invoice...');
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      setLoadingMessage('Verifying with AI...');

      const formData = new FormData();
      formData.append('productName', productName.trim());
      formData.append('productPrice', productPrice);
      if (file) {
        formData.append('file', file);
      }

      const res = await fetch('/api/green-credits/claim', { method: 'POST', body: formData });
      const data = (await res.json()) as ClaimApiResponse;

      if (data.success) {
        setResult(data.data);
        setBalance(data.data.newBalance);
        if (data.data.isApproved) {
          setProductName('');
          setProductPrice('');
          setFile(null);
        }
      } else {
        setResult({ error: data.error });
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      setResult({ error: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }

  const FileIcon = getFileIcon();

  return (
    <div className="p-4 pb-24">
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

      <Card className="mb-6 bg-neutral-900/50">
        <h3 className="font-medium mb-3">How it works</h3>
        <ol className="text-sm text-gray-400 space-y-2">
          <li className="flex gap-2">
            <span className="text-blue-500 font-medium">1.</span>
            Enter details of your green/renewable energy purchase
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500 font-medium">2.</span>
            Upload invoice (PDF only, optional but recommended)
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500 font-medium">3.</span>
            Our AI verifies if the product is eligible
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500 font-medium">4.</span>
            If approved, credits are converted to cash
          </li>
        </ol>
        <div className="mt-4 p-3 bg-neutral-800/50 rounded-lg">
          <p className="text-xs text-gray-500">
            <span className="text-green-500 font-medium">Eligible products:</span> Solar panels, EVs,
            e-bikes, home batteries, EV chargers, LED systems, etc.
          </p>
        </div>
      </Card>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Tata Nexon EV, Solar Panel 5kW"
              disabled={loading}
            />
            <p className="text-xs text-gray-600 mt-1">Be specific - include brand and model if possible</p>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Product Price (₹) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              placeholder="Enter amount"
              min="1"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Upload Invoice (PDF only)</label>
            <label
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
                file ? 'border-green-600 bg-green-900/20' : 'border-neutral-700 hover:border-neutral-600'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FileIcon className={`w-8 h-8 ${file ? 'text-green-500' : 'text-gray-500'}`} />
              <span className={`text-sm ${file ? 'text-green-400' : 'text-gray-500'}`}>
                {file ? file.name : 'Click to upload PDF invoice'}
              </span>
              {file && <span className="text-xs text-gray-600">{(file.size / 1024).toFixed(1)} KB</span>}
              <input
                type="file"
                className="hidden"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={loading}
              />
            </label>
            <p className="text-xs text-gray-600 mt-1">
              Supported: PDF only
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || balance <= 0 || !productName.trim() || !productPrice}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {loadingMessage || 'Processing...'}
              </span>
            ) : (
              'Submit Claim'
            )}
          </Button>

          {balance <= 0 && (
            <p className="text-sm text-red-500 text-center">You don’t have any green credits to claim</p>
          )}
        </form>
      ) : (
        <ResultCard result={result} onReset={() => setResult(null)} />
      )}
    </div>
  );
}

function ResultCard({ result, onReset }: { result: ClaimResult; onReset: () => void }) {
  if ('error' in result) {
    return (
      <Card className="text-center py-8 bg-red-900/20 border border-red-800">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-500 mb-2">Error</h3>
        <p className="text-gray-400 mb-4">{result.error}</p>
        <Button onClick={onReset} variant="secondary">
          Try Again
        </Button>
      </Card>
    );
  }

  const isApproved = result.isApproved;

  return (
    <Card
      className={`text-center py-8 border ${
        isApproved ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'
      }`}
    >
      {isApproved ? (
        <>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-500 mb-2">Claim Approved!</h3>
          <p className="text-gray-400 mb-4">{result.message}</p>
          <div className="bg-black/30 rounded-lg p-4 inline-block">
            <p className="text-sm text-gray-400">Amount Credited</p>
            <p className="text-3xl font-bold text-green-500">{formatCurrency(result.creditsRedeemed)}</p>
          </div>
          <p className="text-sm text-gray-500 mt-4">New balance: {formatCurrency(result.newBalance)}</p>
          {result.verificationResult?.productCategory && (
            <p className="text-xs text-gray-600">Category: {result.verificationResult.productCategory}</p>
          )}
          {result.verificationResult?.method === 'fallback' && (
            <p className="text-xs text-yellow-500 mt-2">
              Note: Auto-approved due to verification service unavailability
            </p>
          )}
        </>
      ) : (
        <>
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-500 mb-2">Claim Rejected</h3>
          <p className="text-gray-400 mb-4">{result.message}</p>
          {result.verificationResult?.reason && (
            <p className="text-sm text-gray-500 mb-4">Reason: {result.verificationResult.reason}</p>
          )}
          <p className="text-xs text-gray-600">
            Try submitting with a clearer product name or upload an invoice for better verification.
          </p>
        </>
      )}

      <Button onClick={onReset} variant="secondary" className="mt-6">
        {isApproved ? 'Submit Another Claim' : 'Try Again'}
      </Button>
    </Card>
  );
}
