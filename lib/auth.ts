import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import {
  BACKEND_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from '@/utils/environments';
import { frontendKeyHeaders } from '@/utils/frontend-key';

/**
 * The panel owns its Google sign-in (independent from the storefront session).
 * The backend verifies the Google id_token and issues its own JWT, which is
 * kept encrypted inside the NextAuth token and never exposed to the browser.
 */
async function exchangeGoogleIdToken(idToken: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...frontendKeyHeaders() },
      body: JSON.stringify({ idToken }),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[admin auth] backend google login failed', res.status);
      return null;
    }
    return (await res.json()) as {
      accessToken: string;
      user: Record<string, unknown>;
    };
  } catch (error) {
    console.error('[admin auth] backend google login error', error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID ?? '',
      clientSecret: GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: { prompt: 'select_account', access_type: 'online' },
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.id_token) {
        const exchanged = await exchangeGoogleIdToken(account.id_token);
        if (exchanged) token.backendToken = exchanged.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Only a marker: the backend JWT stays on the encrypted JWT.
      session.user = {
        ...session.user,
        role: 'admin',
      };
      return session;
    },
  },
};
