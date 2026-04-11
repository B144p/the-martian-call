'use client';

import { useState, useEffect } from 'react';
import { useInterval } from 'usehooks-ts';
import { Button } from '@/components/ui/button';
import { useUser } from '@/src/contexts/UserContext';
import { interruptMessage } from '@/src/lib/api/message';

const HEX_DIGITS = '0123456789ABCDEF';
const DIAL_RADIUS = 90; // SVG units from center
const SVG_SIZE = 240;
const CENTER = SVG_SIZE / 2;
const NEEDLE_LENGTH = DIAL_RADIUS - 12;
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

  // Update needle every 250ms
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

  // Needle points up at 0° (digit 0), rotates clockwise 22.5° per step
  const needleRotateDeg = dialState.digitIndex * 22.5;

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-black/90 animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-6 p-8 bg-gray-950 border border-gray-800 rounded-xl animate-in zoom-in-95 duration-300">

        {/* Blinking header */}
        <p className="font-mono text-amber-400 text-sm tracking-widest animate-pulse">
          TRANSMITTING
        </p>

        {/* Dial + current pair overlay */}
        <div className="relative">
          <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
            {/* Subtle inner glow ring behind the dial */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={DIAL_RADIUS + 6}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1"
              opacity="0.08"
            />

            {/* Outer ring */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={DIAL_RADIUS}
              fill="none"
              stroke="#374151"
              strokeWidth="1.5"
            />

            {/* 16 tick marks + labels */}
            {HEX_DIGITS.split('').map((label, i) => {
              const isActive = i === dialState.digitIndex;
              const angleDeg = i * 22.5 - 90;
              const angleRad = (angleDeg * Math.PI) / 180;
              const tickOuter = DIAL_RADIUS;
              const tickInner = DIAL_RADIUS - (isActive ? 14 : 8);
              const labelR = DIAL_RADIUS - 24;
              const x1 = CENTER + tickOuter * Math.cos(angleRad);
              const y1 = CENTER + tickOuter * Math.sin(angleRad);
              const x2 = CENTER + tickInner * Math.cos(angleRad);
              const y2 = CENTER + tickInner * Math.sin(angleRad);
              const lx = CENTER + labelR * Math.cos(angleRad);
              const ly = CENTER + labelR * Math.sin(angleRad);
              return (
                <g key={label}>
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={isActive ? '#f59e0b' : '#374151'}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    style={{ transition: 'stroke 200ms ease, stroke-width 200ms ease' }}
                  />
                  <text
                    x={lx} y={ly}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={isActive ? 11 : 9}
                    fontFamily="monospace"
                    fill={isActive ? '#fbbf24' : '#4b5563'}
                    style={{ transition: 'fill 200ms ease, font-size 200ms ease' }}
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Needle — smooth rotation via CSS spring transition */}
            <g
              style={{
                transform: `rotate(${needleRotateDeg}deg)`,
                transformOrigin: `${CENTER}px ${CENTER}px`,
                transition: 'transform 380ms cubic-bezier(0.34, 1.4, 0.64, 1)',
              }}
            >
              {/* Needle body */}
              <line
                x1={CENTER}
                y1={CENTER + 6}
                x2={CENTER}
                y2={CENTER - NEEDLE_LENGTH}
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Tip glow dot */}
              <circle cx={CENTER} cy={CENTER - NEEDLE_LENGTH} r="3.5" fill="#fbbf24" />
            </g>

            {/* Center pivot */}
            <circle cx={CENTER} cy={CENTER} r="5" fill="#f59e0b" />
            <circle cx={CENTER} cy={CENTER} r="3" fill="#1f2937" />
          </svg>

          {/* Current pair — remounts on change to flash */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingTop: '32px' }}>
            <span
              key={currentPair}
              className="font-mono text-base text-green-400 animate-in fade-in zoom-in-75 duration-150"
              style={{ textShadow: '0 0 8px #22c55e99' }}
            >
              {currentPair}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-amber-400 h-full rounded-full"
            style={{
              width: `${dialState.progress}%`,
              transition: 'width 250ms linear',
              boxShadow: '0 0 6px #f59e0b80',
            }}
          />
        </div>
        <p className="font-mono text-xs text-gray-500">
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
