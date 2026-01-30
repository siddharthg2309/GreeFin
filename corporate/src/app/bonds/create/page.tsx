import Link from 'next/link';

import { BondForm } from '@/components/forms/BondForm';

export default function CreateBondPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/bonds" className="text-[#3B82F6] text-sm hover:underline">
          Back to Green Bonds
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-2">Create Green Bond</h1>
        <p className="text-[#8E8E93] text-sm mt-1">Issue a Green Bond with fixed coupon returns</p>
      </div>

      <BondForm />
    </div>
  );
}

