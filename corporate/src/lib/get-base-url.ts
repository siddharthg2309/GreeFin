import { headers } from 'next/headers';

export async function getBaseUrl(): Promise<string> {
  try {
    const headerStore = await headers();
    const proto = headerStore.get('x-forwarded-proto') ?? 'http';
    const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host');
    if (host) return `${proto}://${host}`;
  } catch {}

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}

