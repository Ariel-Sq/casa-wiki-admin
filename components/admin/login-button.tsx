'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export function LoginButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        signIn('google', { callbackUrl: '/' });
      }}
      className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-60"
    >
      {loading ? 'Conectando...' : 'Iniciar sesión con Google'}
    </button>
  );
}
