import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On first sign-in, exchange Google access token for our backend JWT
      if (account?.access_token) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001/api/v1';
          const res = await fetch(`${apiUrl}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: account.access_token }),
          });
          if (res.ok) {
            const data = await res.json();
            token.backendJwt = data.data?.access_token as string | undefined;
            if (!token.backendJwt) {
              console.error('[auth] Backend JWT exchange succeeded but access_token missing in response:', data);
            }
          } else {
            const body = await res.text();
            console.error(`[auth] Backend JWT exchange failed: ${res.status} ${res.statusText}`, body);
          }
        } catch (err) {
          console.error('[auth] Backend JWT exchange threw an error:', err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.backendJwt = token.backendJwt as string | undefined;
      return session;
    },
  },
});
