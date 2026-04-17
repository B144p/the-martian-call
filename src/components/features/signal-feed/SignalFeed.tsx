'use client';

import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useUser } from '@/src/contexts/UserContext';
import { DIRECTION_LABELS, CONTINENT_NAMES } from '@/src/lib/constants';
import type { SignalEntry, Direction, ContinentId } from '@/src/types/api';

interface SignalFeedProps {
  initialMessages: SignalEntry[];
}

export function SignalFeed({ initialMessages }: SignalFeedProps) {
  const { socket } = useUser();
  const [messages, setMessages] = useState<SignalEntry[]>(initialMessages);

  useEffect(() => {
    if (!socket) return;

    const handler = (data: SignalEntry) => {
      setMessages((prev) => [data, ...prev]);
    };

    socket.on('signal:received', handler);

    return () => {
      socket.off('signal:received', handler);
    };
  }, [socket]);

  const feedContent = (
    <>
      <div className="px-3 py-2 border-b border-gray-800 text-gray-500 tracking-widest uppercase shrink-0">
        Signal Feed
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {messages.length === 0 ? (
          <p className="px-3 py-4 text-gray-700 italic">No signals received yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="px-3 py-2 border-b border-gray-900 hover:bg-gray-900/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
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
              <p className="text-gray-200 whitespace-pre-wrap break-words">{msg.content}</p>
              {msg.is_interrupted && (
                <span className="text-red-400">[Transmission got interrupted!]</span>
              )}
              <p className="mt-1 text-gray-700">
                {new Date(msg.transmitted_at).toUTCString().slice(0, 25)}
              </p>
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: full right sidebar */}
      <div className="hidden md:flex flex-col h-full bg-gray-950/90 border-l border-gray-800 font-mono text-xs">
        {feedContent}
      </div>

      {/* Mobile: floating trigger + Sheet */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger className="flex items-center gap-1.5 px-3 py-2 bg-gray-950/90 border border-gray-800 rounded-lg font-mono text-xs text-gray-400 hover:text-amber-400 hover:border-amber-800 transition-colors">
            <Radio size={13} />
            FEED
          </SheetTrigger>
          <SheetContent side="right" className="p-0 bg-gray-950 border-gray-800 flex flex-col font-mono text-xs w-[85vw] max-w-sm">
            {feedContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
