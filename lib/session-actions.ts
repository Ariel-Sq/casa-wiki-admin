'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SESSION_COOKIES = [
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
  '__Host-next-auth.csrf-token',
  '__Secure-next-auth.csrf-token',
  'next-auth.csrf-token',
  '__Secure-next-auth.callback-url',
  'next-auth.callback-url',
];

/** Sign out of the panel only. */
export async function signOutAndLeave(): Promise<void> {
  const store = await cookies();
  for (const name of SESSION_COOKIES) {
    try {
      store.delete({ name, path: '/' });
    } catch {
      // Cookie may not exist; nothing to do.
    }
  }
  redirect('/');
}

/** Send the visitor to the panel's own Google sign-in. */
export async function startSignIn(): Promise<void> {
  redirect('/login');
}
