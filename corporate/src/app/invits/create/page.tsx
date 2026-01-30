import Link from 'next/link';

import { InvitForm } from '@/components/forms/InvitForm';

export default function CreateInvitPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/invits" className="text-[#3B82F6] text-sm hover:underline">
          Back to InvITs
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-2">Issue New InvIT</h1>
        <p className="text-[#8E8E93] text-sm mt-1">
          Create an Infrastructure Investment Trust for investors
        </p>
      </div>

      <InvitForm />
    </div>
  );
}

