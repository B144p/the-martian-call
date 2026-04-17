'use client';

import { useState, useEffect } from 'react';
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
  const { user, socket } = useUser();
  const [stats, setStats] = useState<StatsResponse | null>(initialStats);

  useInterval(async () => {
    const res = await getStats();
    if (res.data) setStats(res.data);
  }, 30_000);

  useEffect(() => {
    if (!socket) return;

    const handler = ({ online_count }: { online_count: number }) => {
      setStats((prev) => (prev ? { ...prev, online_count } : prev));
    };

    socket.on('presence:update', handler);
    return () => { socket.off('presence:update', handler); };
  }, [socket]);

  return (
    <div className="flex items-center gap-3 px-4 h-10 bg-gray-950/95 border-b border-gray-800 font-mono text-xs overflow-hidden">
      {user ? (
        <>
          <span className="text-amber-400 font-semibold shrink-0">{user.callsign}</span>

          {/* Continent + direction — hidden on mobile */}
          <span className="hidden sm:contents">
            <span className="text-gray-700">|</span>
            <span className="text-gray-400 truncate">{CONTINENT_NAMES[user.continent_id]}</span>
            <span className="text-gray-700">|</span>
            <span className="text-gray-400 shrink-0">
              {user.antenna_direction}°&nbsp;
              {DIRECTION_LABELS[user.antenna_direction as Direction]}
            </span>
          </span>

          {stats && (
            <>
              <span className="text-gray-700">|</span>
              <span className="text-green-400 shrink-0">{stats.online_count} online</span>
            </>
          )}

          <div className="ml-auto">
            <button
              onClick={() => signOut()}
              className="text-gray-600 hover:text-gray-400 transition-colors shrink-0"
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
