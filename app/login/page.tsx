import Link from 'next/link';
import { LoginButton } from '@/components/admin/login-button';
import { SITE_URL } from '@/utils/environments';

export const metadata = {
  title: 'Ingresar · Casa Wiki Panel',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-muted/20 px-6 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Casa Wiki
        </p>
        <h1 className="mt-2 text-2xl font-bold">Panel de administración</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Ingresá con la cuenta de Google autorizada. El acceso se valida contra el
          backend de Casa Wiki en cada request.
        </p>
      </div>
      <LoginButton />
      <Link href={SITE_URL} className="text-sm underline">
        Ir a la tienda
      </Link>
    </div>
  );
}
