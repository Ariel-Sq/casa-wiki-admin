import type React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';
import { getAdminMe, type AdminMe } from '@/lib/admin-api';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { LoginButton } from '@/components/admin/login-button';
import { signOutAndLeave } from '@/lib/session-actions';
import { SITE_URL } from '@/utils/environments';
import './globals.css';

const workSans = localFont({
  src: './fonts/WorkSans-Variable.woff2',
  variable: '--font-work-sans',
  weight: '400 800',
  display: 'swap',
});

/**
 * Admin panel shell. This deployment is only the panel (the storefront is a
 * separate app on casawiki.vercel.app), so the chrome lives right here: nav,
 * signed-in email/role, theme switch and sign out.
 */
export const metadata: Metadata = {
  title: 'Casa Wiki · Panel',
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let me: AdminMe | null = null;
  try {
    me = await getAdminMe();
  } catch (error) {
    // No session or not staff: the backend already refused the call.
    console.error(
      'admin gate:',
      error instanceof Error ? error.message : error
    );
  }

  const role = me?.role;
  const canManageUsers = me?.isOwner ?? false;
  const canCatalogue = role === 'owner' || role === 'admin' || role === 'editor';
  const canReviews =
    role === 'owner' || role === 'admin' || role === 'editor' || role === 'sales';
  const canAudit = role === 'owner' || role === 'admin';

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`font-sans ${workSans.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          {me ? (
            <div className="flex min-h-screen flex-col bg-muted/20">
              <header className="border-b bg-background">
                <div className="container mx-auto flex flex-wrap items-center gap-4 px-4 py-3">
                  <Link href="/" className="text-lg font-bold">
                    Casa Wiki · Panel
                  </Link>
                  <nav className="flex flex-wrap items-center gap-4 text-sm">
                    {canCatalogue && (
                      <Link href="/portada" className="hover:text-primary">
                        Portada
                      </Link>
                    )}
                    {canCatalogue && (
                      <Link href="/" className="hover:text-primary">
                        Productos
                      </Link>
                    )}
                    <Link href="/orders" className="hover:text-primary">
                      Pedidos
                    </Link>
                    {canReviews && (
                      <Link href="/reviews" className="hover:text-primary">
                        Reseñas
                      </Link>
                    )}
                    {canManageUsers && (
                      <Link href="/users" className="hover:text-primary">
                        Usuarios
                      </Link>
                    )}
                    {canAudit && (
                      <Link href="/audit" className="hover:text-primary">
                        Historial
                      </Link>
                    )}
                    <a
                      href={SITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      Ver tienda ↗
                    </a>
                  </nav>

                  <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="hidden sm:inline">{me.email}</span>
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">
                      {me.isOwner ? 'dueño' : me.role}
                    </span>
                    <ThemeToggle />
                    <form action={signOutAndLeave}>
                      <button
                        type="submit"
                        className="rounded-lg border px-3 py-1.5 font-medium transition-colors hover:bg-muted"
                      >
                        Salir
                      </button>
                    </form>
                  </div>
                </div>
              </header>

              <main className="container mx-auto flex-1 px-4 py-8">
                {children}
              </main>
            </div>
          ) : (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
              <h1 className="text-2xl font-bold">Sin acceso al panel</h1>
              <p className="max-w-md text-muted-foreground">
                {me === null
                  ? 'Tu sesión del panel terminó. Entrá con Google para continuar.'
                  : 'Tu cuenta no tiene rol de administrador.'}
              </p>
              <LoginButton />
              <a href={SITE_URL} className="text-sm underline">
                Ir a la tienda
              </a>
            </div>
          )}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
