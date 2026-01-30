import { Suspense } from 'react';

import { DiscoverClient } from './DiscoverClient';

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="p-4 text-gray-500">Loading...</div>}>
      <DiscoverClient />
    </Suspense>
  );
}

