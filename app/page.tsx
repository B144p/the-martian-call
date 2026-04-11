import { auth } from '@/auth';
import { UserProvider } from '@/src/contexts/UserContext';
import { MapViewClient } from '@/src/components/features/map/MapViewClient';
import { AntennaControl } from '@/src/components/features/antenna/AntennaControl';
import { ComposePanel } from '@/src/components/features/compose/ComposePanel';
import { HexDial } from '@/src/components/features/hex-dial/HexDial';
import { StatusBar } from '@/src/components/features/status-bar/StatusBar';
import { MissedSignalsBanner } from '@/src/components/features/missed-signals/MissedSignalsBanner';
import { SignalFeed } from '@/src/components/features/signal-feed/SignalFeed';
import { LandingOverlay } from '@/src/components/features/auth/LandingOverlay';
import type { User, Message, SignalEntry, StatsResponse } from '@/src/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

async function serverFetch<T>(
  path: string,
  token?: string,
): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return null;
    const body = await res.json();
    return (body.data as T) ?? null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const session = await auth();
  const token = session?.backendJwt ?? null;

  // All data fetched server-side in parallel
  const [meData, feedData, statsData, missedData] = await Promise.all([
    serverFetch<{ user: User; activeMessage: Message | null }>('/users/me', token ?? undefined),
    token ? serverFetch<SignalEntry[]>('/signals/feed', token) : Promise.resolve([]),
    serverFetch<StatsResponse>('/stats'),
    token ? serverFetch<{ count: number }>('/signals/missed/count', token ?? undefined) : Promise.resolve(null),
  ]);

  const user = meData?.user ?? null;
  const activeMessage = meData?.activeMessage ?? null;
  const initialMessages = feedData ?? [];
  const initialStats = statsData ?? null;
  const missedCount = missedData?.count ?? 0;
  const onlineContinents = initialStats?.online_continents ?? [];

  return (
    <UserProvider initialUser={user} initialMessage={activeMessage} backendToken={token}>
      <div className="relative h-full w-full flex flex-col">
        {/* Top chrome: status bar + missed signals banner */}
        <div className="relative z-[1000] flex-shrink-0">
          <StatusBar initialStats={initialStats} />
          <MissedSignalsBanner initialCount={missedCount} />
        </div>

        {/* Main area: map + overlays */}
        <div className="relative flex-1 overflow-hidden">
          {/* Map fills the area */}
          <div className="absolute inset-0 z-0">
            <MapViewClient onlineContinents={onlineContinents} />
          </div>

          {/* Right sidebar: signal feed */}
          <div className="absolute top-0 right-0 bottom-0 w-72 z-[1000]">
            <SignalFeed initialMessages={initialMessages} />
          </div>

          {/* Bottom-left: antenna ring */}
          <div className="absolute bottom-6 left-6 z-[1000]">
            <AntennaControl />
          </div>

          {/* Bottom-center: compose panel */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
            <ComposePanel />
          </div>

          {/* Full-screen transmission overlay */}
          <HexDial />
        </div>

        {/* Landing overlay — shown when not signed in */}
        {!session && <LandingOverlay />}
      </div>
    </UserProvider>
  );
}
