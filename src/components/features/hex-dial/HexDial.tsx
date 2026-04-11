'use client';

import { useState } from 'react';
import { useInterval } from 'usehooks-ts';
import { Button } from '@/components/ui/button';
import { useUser } from '@/src/contexts/UserContext';
import { interruptMessage } from '@/src/lib/api/message';

const HEX_DIGITS = '0123456789ABCDEF';
const DIAL_RADIUS = 90; // SVG units from center
const SVG_SIZE = 240;
const CENTER = SVG_SIZE / 2;
// ms per hex pair (1 pair = 2 chars = 0.5s transmission time)
const MS_PER_PAIR = 500;

interface DialState {
  pairIndex: number;
  digitIndex: number; // 0-15 position on clock face
  progress: number;   // 0–100
  done: boolean;
}

function computeDialState(message: {
  hex_sequence: string;
  transmission_started_at: string | null;
  transmission_ends_at: string | null;
}): DialState {
  const pairs = message.hex_sequence.split(' ');
  const total = pairs.length;

  if (!message.transmission_started_at) {
    return { pairIndex: 0, digitIndex: 0, progress: 0, done: false };
  }

  const startMs = new Date(message.transmission_started_at).getTime();
  const endMs = message.transmission_ends_at
    ? new Date(message.transmission_ends_at).getTime()
    : startMs + total * MS_PER_PAIR;
  const now = Date.now();

  if (now >= endMs) {
    return { pairIndex: total - 1, digitIndex: 15, progress: 100, done: true };
  }

  const elapsed = now - startMs;
  const pairIndex = Math.min(Math.floor(elapsed / MS_PER_PAIR), total - 1);
  const currentPair = pairs[pairIndex] ?? '00';
  // Low nibble of the byte value drives the needle position
  const byteVal = parseInt(currentPair, 16);
  const digitIndex = isNaN(byteVal) ? 0 : byteVal & 0x0f;
  const progress = Math.min((elapsed / (endMs - startMs)) * 100, 100);

  return { pairIndex, digitIndex, progress, done: false };
}

export function HexDial() {
  const { activeMessage, setTransmitting } = useUser();
  const [dialState, setDialState] = useState<DialState>(() =>
    activeMessage ? computeDialState(activeMessage) : { pairIndex: 0, digitIndex: 0, progress: 0, done: false },
  );
  const [interrupting, setInterrupting] = useState(false);

  const isVisible = activeMessage?.status === 'transmitting';

  // Update needle every 250ms for smooth animation
  useInterval(
    () => {
      if (activeMessage) {
        setDialState(computeDialState(activeMessage));
      }
    },
    isVisible ? 250 : null,
  );

  async function handleCancel() {
    if (!activeMessage) return;
    setInterrupting(true);
    try {
      const res = await interruptMessage(activeMessage.id);
      if (res.data) setTransmitting(res.data);
    } finally {
      setInterrupting(false);
    }
  }

  if (!isVisible || !activeMessage) return null;

  const pairs = activeMessage.hex_sequence.split(' ');
  const currentPair = pairs[dialState.pairIndex] ?? '--';

  // Needle angle: digit 0 at top (−90°), step 22.5° per position
  const needleAngleDeg = dialState.digitIndex * 22.5 - 90;
  const needleAngleRad = (needleAngleDeg * Math.PI) / 180;
  const needleX = CENTER + (DIAL_RADIUS - 10) * Math.cos(needleAngleRad);
  const needleY = CENTER + (DIAL_RADIUS - 10) * Math.sin(needleAngleRad);

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-black/90">
      <div className="flex flex-col items-center gap-6 p-8 bg-gray-950 border border-gray-800 rounded-xl">
        <p className="font-mono text-amber-400 text-sm tracking-widest">TRANSMITTING</p>

        {/* Clock-face SVG */}
        <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
          {/* Outer ring */}
          <circle cx={CENTER} cy={CENTER} r={DIAL_RADIUS} fill="none" stroke="#374151" strokeWidth="2" />

          {/* 16 tick marks + labels */}
          {HEX_DIGITS.split('').map((label, i) => {
            const angleDeg = i * 22.5 - 90;
            const angleRad = (angleDeg * Math.PI) / 180;
            const tickOuter = DIAL_RADIUS;
            const tickInner = DIAL_RADIUS - 8;
            const labelR = DIAL_RADIUS - 18;
            const x1 = CENTER + tickOuter * Math.cos(angleRad);
            const y1 = CENTER + tickOuter * Math.sin(angleRad);
            const x2 = CENTER + tickInner * Math.cos(angleRad);
            const y2 = CENTER + tickInner * Math.sin(angleRad);
            const lx = CENTER + labelR * Math.cos(angleRad);
            const ly = CENTER + labelR * Math.sin(angleRad);
            const isActive = i === dialState.digitIndex;
            return (
              <g key={label}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isActive ? '#f59e0b' : '#4b5563'} strokeWidth="2" />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fontFamily="monospace"
                  fill={isActive ? '#f59e0b' : '#6b7280'}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Needle */}
          <line
            x1={CENTER}
            y1={CENTER}
            x2={needleX}
            y2={needleY}
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Center dot */}
          <circle cx={CENTER} cy={CENTER} r="4" fill="#f59e0b" />

          {/* Current pair in center */}
          <text
            x={CENTER}
            y={CENTER + 20}
            textAnchor="middle"
            fontSize="14"
            fontFamily="monospace"
            fill="#22c55e"
          >
            {currentPair}
          </text>
        </svg>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-amber-400 h-2 rounded-full transition-all duration-250"
            style={{ width: `${dialState.progress}%` }}
          />
        </div>
        <p className="font-mono text-xs text-gray-400">
          {dialState.pairIndex + 1} / {pairs.length} pairs · {Math.round(dialState.progress)}%
        </p>

        {/* Cancel */}
        <Button
          variant="outline"
          size="sm"
          disabled={interrupting}
          onClick={handleCancel}
          className="border-red-800 text-red-400 hover:bg-red-950 font-mono"
        >
          {interrupting ? 'INTERRUPTING...' : 'INTERRUPT TRANSMISSION'}
        </Button>
      </div>
    </div>
  );
}
