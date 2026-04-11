'use client';

import { useRef, useState } from 'react';
import { useInterval } from 'usehooks-ts';
import { useUser } from '@/src/contexts/UserContext';
import { rotateAntenna } from '@/src/lib/api/antenna';
import { VALID_DIRECTIONS, DIRECTION_LABELS } from '@/src/lib/constants';
import type { Direction } from '@/src/types/api';

/** Returns the shortest clockwise step sequence from `current` to `target`. */
function buildStepQueue(current: Direction, target: Direction): Direction[] {
  if (current === target) return [];

  const totalSteps = VALID_DIRECTIONS.length; // 12
  const currentIdx = VALID_DIRECTIONS.indexOf(current);
  const targetIdx = VALID_DIRECTIONS.indexOf(target);

  const cwSteps = (targetIdx - currentIdx + totalSteps) % totalSteps;
  const ccwSteps = (currentIdx - targetIdx + totalSteps) % totalSteps;

  const queue: Direction[] = [];
  if (cwSteps <= ccwSteps) {
    for (let i = 1; i <= cwSteps; i++) {
      queue.push(VALID_DIRECTIONS[(currentIdx + i) % totalSteps]);
    }
  } else {
    for (let i = 1; i <= ccwSteps; i++) {
      queue.push(VALID_DIRECTIONS[(currentIdx - i + totalSteps) % totalSteps]);
    }
  }
  return queue;
}

export function AntennaControl() {
  const { user, setAntennaDirection } = useUser();
  const [stepQueue, setStepQueue] = useState<Direction[]>([]);
  const rollbackRef = useRef<Direction | null>(null);
  const isRotating = stepQueue.length > 0;

  async function fireNextStep(queue: Direction[]) {
    const [next, ...rest] = queue;
    setAntennaDirection(next); // optimistic
    try {
      const res = await rotateAntenna(next);
      if (res.error) throw new Error(res.error.message);
      setStepQueue(rest);
    } catch {
      // Rollback and clear queue on error
      if (rollbackRef.current !== null) {
        setAntennaDirection(rollbackRef.current);
        rollbackRef.current = null;
      }
      setStepQueue([]);
    }
  }

  // Fires every 1s while there are steps queued
  useInterval(
    () => {
      if (stepQueue.length > 0) {
        fireNextStep(stepQueue);
      }
    },
    isRotating ? 1000 : null,
  );

  function handleDirectionClick(target: Direction) {
    if (!user || user.is_transmitting) return;
    const queue = buildStepQueue(user.antenna_direction, target);
    if (queue.length === 0) return;
    rollbackRef.current = user.antenna_direction;
    // Fire first step immediately, rest via interval
    const [first, ...rest] = queue;
    setStepQueue(rest);
    fireNextStep([first, ...rest]);
  }

  const disabled = !user || user.is_transmitting;
  const currentDirection = user?.antenna_direction ?? 0;

  return (
    <div className="relative w-48 h-48">
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-xs font-mono text-amber-400">
          {currentDirection}° {DIRECTION_LABELS[currentDirection as Direction]}
        </span>
      </div>

      {VALID_DIRECTIONS.map((dir) => {
        const angleDeg = dir - 90; // offset so 0° sits at top
        const angleRad = (angleDeg * Math.PI) / 180;
        const RADIUS = 72; // px, distance from center
        const x = Math.round((50 + (RADIUS / 96) * 50 * Math.cos(angleRad)) * 1000) / 1000;
        const y = Math.round((50 + (RADIUS / 96) * 50 * Math.sin(angleRad)) * 1000) / 1000;

        const isActive = dir === currentDirection;
        const isTarget = stepQueue[stepQueue.length - 1] === dir;

        return (
          <button
            key={dir}
            onClick={() => handleDirectionClick(dir)}
            disabled={disabled}
            aria-label={`${dir}° ${DIRECTION_LABELS[dir]}`}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={[
              'w-8 h-8 rounded-full text-[10px] font-mono border transition-colors',
              isActive
                ? 'bg-amber-400 text-black border-amber-400'
                : isTarget
                  ? 'bg-amber-900 text-amber-300 border-amber-500'
                  : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-amber-500 hover:text-amber-300',
              disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            {DIRECTION_LABELS[dir]}
          </button>
        );
      })}
    </div>
  );
}
