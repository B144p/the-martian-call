'use client';

import { useState } from 'react';
import { getMissedSignals } from '@/src/lib/api/signals';
import { DIRECTION_LABELS, CONTINENT_NAMES } from '@/src/lib/constants';
import type { MissedSignal, Direction, ContinentId } from '@/src/types/api';

interface MissedSignalsBannerProps {
  initialCount: number;
}

export function MissedSignalsBanner({ initialCount }: MissedSignalsBannerProps) {
  const [count, setCount] = useState(initialCount);
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<MissedSignal[]>([]);
  const [loading, setLoading] = useState(false);

  if (count === 0) return null;

  async function handleExpand() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getMissedSignals();
      if (res.data) {
        setEntries(res.data);
        setCount(0); // marked as read server-side
      }
    } finally {
      setLoading(false);
      setExpanded(true);
    }
  }

  function handleDismiss() {
    setCount(0);
    setExpanded(false);
  }

  return (
    <div className="bg-gray-900 border-b border-amber-900/50 font-mono text-xs">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 h-8">
        <span className="text-amber-400">
          {count > 0 ? `${count} missed signal${count !== 1 ? 's' : ''}` : 'Missed signals'}
        </span>
        <button
          onClick={handleExpand}
          disabled={loading}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          {loading ? 'loading...' : expanded ? 'collapse' : 'expand'}
        </button>
        <button
          onClick={handleDismiss}
          className="ml-auto text-gray-600 hover:text-gray-400 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Expanded entries */}
      {expanded && entries.length > 0 && (
        <div className="px-4 pb-3 flex flex-col gap-1 max-h-40 overflow-y-auto">
          {entries.map((sig) => (
            <div key={sig.id} className="flex items-center gap-3 text-gray-400 py-0.5">
              <span className="text-gray-500">
                {new Date(sig.transmitted_at).toUTCString().slice(0, 25)}
              </span>
              <span className="text-gray-600">|</span>
              <span>{CONTINENT_NAMES[sig.sender_continent as ContinentId]}</span>
              <span className="text-gray-600">→</span>
              <span>
                {sig.sender_direction}°&nbsp;
                {DIRECTION_LABELS[sig.sender_direction as Direction]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
