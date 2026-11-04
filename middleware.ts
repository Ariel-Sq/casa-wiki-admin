import { NextResponse, type NextRequest } from 'next/server';

/**
 * Admin panel access control (this app serves only the panel).
 *
 *  1. HTTP Basic Auth runs before anything is rendered; missing credentials
 *     close the app (503) instead of leaving it open.
 *  2. Sessions are the panel's own (lib/server-auth.ts): when there is none,
 *     the layout shows the "Iniciar sesión" screen instead of redirecting, so
 *     logging out here never bounces you straight back in.
 *  3. The *role* is not checked here: every backend call re-reads it from the
 *     database (see lib/admin-api.ts + AdminGuard).
 *
 * Env vars: ADMIN_BASIC_AUTH_USER, ADMIN_BASIC_AUTH_PASS, NEXT_PUBLIC_SITE_URL.
 */

const REALM = 'Casa Wiki Admin';

function unauthorized(): NextResponse {
  return new NextResponse('Autenticación requerida', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Cache-Control': 'no-store',
    },
  });
}

/** Length-checked, constant-time-ish comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1)
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function middleware(request: NextRequest) {
  const user = process.env.ADMIN_BASIC_AUTH_USER;
  const pass = process.env.ADMIN_BASIC_AUTH_PASS;

  // Local development has no Basic Auth credentials configured.
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev && (!user || !pass)) return NextResponse.next();

  if (!user || !pass) {
    return new NextResponse('Panel no configurado', { status: 503 });
  }

  const header = request.headers.get('authorization') ?? '';
  if (!header.startsWith('Basic ')) return unauthorized();

  let decoded = '';
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }
  const separator = decoded.indexOf(':');
  if (separator < 0) return unauthorized();
  if (
    !safeEqual(decoded.slice(0, separator), user) ||
    !safeEqual(decoded.slice(separator + 1), pass)
  ) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
