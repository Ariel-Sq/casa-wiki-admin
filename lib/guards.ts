import { notFound, redirect } from 'next/navigation';
import { getAdminMe, type AdminMe } from '@/lib/admin-api';

export type AdminRole = AdminMe['role'];

/**
 * Server-side page guard. The backend re-checks the role on every API call;
 * this only decides whether to render the page.
 *
 * - No/invalid session → send the visitor to the login screen.
 * - Valid session but insufficient role → 404 (the tab is not theirs).
 */
export async function requireRole(allowed: AdminRole[]): Promise<AdminMe> {
  let me: AdminMe;
  try {
    me = await getAdminMe();
  } catch {
    redirect('/login');
  }
  if (!allowed.includes(me.role)) notFound();
  return me;
}
