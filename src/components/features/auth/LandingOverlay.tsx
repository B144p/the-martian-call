'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function LandingOverlay() {
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/85">
      <div className="flex flex-col items-center gap-6 p-10 bg-gray-950 border border-gray-800 rounded-xl text-center">
        <h1 className="font-mono text-3xl tracking-widest text-amber-400">THE MARTIAN CALL</h1>
        <p className="font-mono text-sm text-gray-500">Broadcast signals across continents</p>
        <Button
          onClick={() => signIn('google')}
          className="bg-amber-500 hover:bg-amber-400 text-black font-mono tracking-wider"
        >
          SIGN IN WITH GOOGLE
        </Button>
      </div>
    </div>
  );
}
