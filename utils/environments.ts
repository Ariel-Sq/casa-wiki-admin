export const BACKEND_URL =
  process.env.BACKEND_URL ?? 'http://localhost:8080';

/** Storefront origin, used for the "Ver tienda" link. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://casawiki.vercel.app'
).replace(/\/$/, '');

/** Origin of this panel. */
export const ADMIN_URL = (
  process.env.NEXTAUTH_URL ?? 'https://casa-wiki-admin.vercel.app'
).replace(/\/$/, '');

/** Signs/encrypts this panel's own NextAuth session. */
export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

/**
 * Optional secret for the storefront's on-demand cache purge. The Casa Wiki
 * storefront does not expose /api/revalidate yet, so this stays unset and the
 * admin simply skips the purge.
 */
export const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;
