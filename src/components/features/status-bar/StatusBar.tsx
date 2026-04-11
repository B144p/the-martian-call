'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useInterval } from 'usehooks-ts';
import { useUser } from '@/src/contexts/UserContext';
import { getStats } from '@/src/lib/api/stats';
import { DIRECTION_LABELS, CONTINENT_NAMES } from '@/src/lib/constants';
import type { StatsResponse, Direction } from '@/src/types/api';

interface StatusBarProps {
  initialStats: StatsResponse | null;
}

export function StatusBar({ initialStats }: StatusBarProps) {
  const { user } = useUser();
  const [stats, setStats] = useState<StatsResponse | null>(initialStats);

  useInterval(async () => {
    const res = await getStats();
    if (res.data) setStats(res.data);
  }, 30_000);

  return (
    <div className="flex items-center gap-3 px-4 h-10 bg-gray-950/95 border-b border-gray-800 font-mono text-xs">
      {user ? (
        <>
          <span className="text-amber-400 font-semibold">{user.callsign}</span>
          <span className="text-gray-700">|</span>
          <span className="text-gray-400">{CONTINENT_NAMES[user.continent_id]}</span>
          <span className="text-gray-700">|</span>
          <span className="text-gray-400">
            {user.antenna_direction}°&nbsp;
            {DIRECTION_LABELS[user.antenna_direction as Direction]}
          </span>
          {stats && (
            <>
              <span className="text-gray-700">|</span>
              <span className="text-green-400">{stats.online_count} online</span>
            </>
          )}
          <div className="ml-auto">
            <button
              onClick={() => signOut()}
              className="text-gray-600 hover:text-gray-400 transition-colors"
            >
              SIGN OUT
            </button>
          </div>
        </>
      ) : (
        <span className="text-gray-600 italic">not signed in</span>
      )}
    </div>
  );
}
