import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';
import { NEXTAUTH_SECRET } from '@/utils/environments';

/**
 * Server-only: reads the panel's own NextAuth session and returns the
 * backend-issued JWT. Importing next/headers keeps this module out of client
 * components, so the token never reaches the browser.
 */
export async function getAdminToken(): Promise<string | null> {
  const store = await cookies();
  const all = store.getAll();
  const cookieMap = Object.fromEntries(all.map((c) => [c.name, c.value]));
  const cookieHeader = all.map((c) => `${c.name}=${c.value}`).join('; ');

  const token = await getToken({
    req: { cookies: cookieMap, headers: { cookie: cookieHeader } } as never,
    secret: NEXTAUTH_SECRET,
  });

  return token?.backendToken ?? null;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
