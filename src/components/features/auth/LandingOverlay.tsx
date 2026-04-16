'use client';

import { signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

/** True when the user has a NextAuth session but no backend JWT — needs a fresh sign-in cycle. */
interface LandingOverlayProps {
  hasStaleSession?: boolean;
}

export function LandingOverlay({ hasStaleSession = false }: LandingOverlayProps) {
  async function handleSignIn() {
    if (hasStaleSession) {
      // Sign out without redirecting, then immediately trigger Google OAuth.
      await signOut({ redirect: false });
    }
    signIn('google');
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/85">
      <div className="flex flex-col items-center gap-6 p-6 sm:p-10 mx-4 bg-gray-950 border border-gray-800 rounded-xl text-center w-full max-w-sm">
        <h1 className="font-mono text-xl sm:text-3xl tracking-widest text-amber-400">THE MARTIAN CALL</h1>
        <p className="font-mono text-sm text-gray-500">Broadcast signals across continents</p>
        {hasStaleSession && (
          <p className="font-mono text-xs text-red-400">Session expired — please sign in again.</p>
        )}
        <Button
          onClick={handleSignIn}
          className="bg-amber-500 hover:bg-amber-400 text-black font-mono tracking-wider"
        >
          SIGN IN WITH GOOGLE
        </Button>
      </div>
    </div>
  );
}
