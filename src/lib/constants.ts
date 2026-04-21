import type { ContinentId, Direction } from '@/src/types/api';

export const CONTINENT_COORDS: Record<ContinentId, { lat: number; lng: number }> = {
  na: { lat: 40.0, lng: -100.0 },
  sa: { lat: -15.0, lng: -60.0 },
  eu: { lat: 50.0, lng: 15.0 },
  af: { lat: 5.0, lng: 25.0 },
  as: { lat: 40.0, lng: 90.0 },
  oc: { lat: -25.0, lng: 135.0 },
};

export const CONTINENT_NAMES: Record<ContinentId, string> = {
  na: 'North America',
  sa: 'South America',
  eu: 'Europe',
  af: 'Africa',
  as: 'Asia',
  oc: 'Oceania',
};

export const VALID_DIRECTIONS = [
  0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
] as const satisfies readonly Direction[];

export const DIRECTION_LABELS: Record<Direction, string> = {
  0: 'N',
  30: 'NNE',
  60: 'NE',
  90: 'E',
  120: 'SE',
  150: 'SSE',
  180: 'S',
  210: 'SSW',
  240: 'SW',
  270: 'W',
  300: 'NW',
  330: 'NNW',
};

// Cone extends this far from the origin marker (in km)
export const CONE_DISTANCE_KM = 3000;
