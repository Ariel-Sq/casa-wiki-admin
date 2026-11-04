import { notFound } from 'next/navigation';
import { getAdminMe, type AdminMe } from '@/lib/admin-api';

export type AdminRole = AdminMe['role'];

/**
 * Server-side page guard. The backend already re-checks the role on every API
 * call; this just avoids rendering a tab the person can't use.
 */
export async function requireRole(allowed: AdminRole[]): Promise<AdminMe> {
  const me = await getAdminMe();
  if (!allowed.includes(me.role)) notFound();
  return me;
}
