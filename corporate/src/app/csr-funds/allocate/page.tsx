import Link from 'next/link';

import { CsrAllocationForm } from '@/components/forms/CsrAllocationForm';

export default function AllocateCsrPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/csr-funds" className="text-[#3B82F6] text-sm hover:underline">
          Back to CSR Funds
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-2">Allocate CSR Funds</h1>
        <p className="text-[#8E8E93] text-sm mt-1">
          Add funds to support investor green credit redemptions
        </p>
      </div>

      <CsrAllocationForm />
    </div>
  );
}

