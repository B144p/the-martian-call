'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@/src/contexts/UserContext';
import { createPusherClient } from '@/src/lib/pusher';
import { DIRECTION_LABELS, CONTINENT_NAMES } from '@/src/lib/constants';
import type { SignalEntry, Direction, ContinentId } from '@/src/types/api';
import type Pusher from 'pusher-js';
import type { Channel } from 'pusher-js';

interface SignalFeedProps {
  initialMessages: SignalEntry[];
}

export function SignalFeed({ initialMessages }: SignalFeedProps) {
  const { user, backendToken } = useUser();
  const [messages, setMessages] = useState<SignalEntry[]>(initialMessages);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!user) return;

    const pusher = createPusherClient(backendToken);
    pusherRef.current = pusher;

    const channelName = `private-region-${user.continent_id}`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind('signal:received', (data: SignalEntry) => {
      setMessages((prev) => [data, ...prev]);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [user?.continent_id, backendToken]); // re-subscribe if continent or token changes

  return (
    <div className="flex flex-col h-full bg-gray-950/90 border-l border-gray-800 font-mono text-xs">
      <div className="px-3 py-2 border-b border-gray-800 text-gray-500 tracking-widest uppercase">
        Signal Feed
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="px-3 py-4 text-gray-700 italic">No signals received yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="px-3 py-2 border-b border-gray-900 hover:bg-gray-900/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-400">{msg.sender_callsign}</span>
                <span className="text-gray-700">·</span>
                <span className="text-gray-500">
                  {CONTINENT_NAMES[msg.sender_continent as ContinentId]}
                </span>
                <span className="text-gray-700">·</span>
                <span className="text-gray-500">
                  {msg.sender_direction}°&nbsp;
                  {DIRECTION_LABELS[msg.sender_direction as Direction]}
                </span>
              </div>
              {/* Content */}
              <p className="text-gray-200 whitespace-pre-wrap break-words">
                {msg.content}
                {msg.is_interrupted && (
                  <span className="text-red-400"> [Transmission got interrupted!]</span>
                )}
              </p>
              {/* Timestamp */}
              <p className="mt-1 text-gray-700">
                {new Date(msg.transmitted_at).toUTCString().slice(0, 25)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
