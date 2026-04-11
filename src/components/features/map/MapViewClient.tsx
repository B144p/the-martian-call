'use client';

import dynamic from 'next/dynamic';
import type { ContinentId } from '@/src/types/api';

// Leaflet requires browser APIs — ssr: false must live in a client component
const MapView = dynamic(() => import('./MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-950" />,
});

interface MapViewClientProps {
  onlineContinents: ContinentId[];
}

export function MapViewClient({ onlineContinents }: MapViewClientProps) {
  return <MapView onlineContinents={onlineContinents} />;
}
