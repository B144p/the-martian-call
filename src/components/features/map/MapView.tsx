'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useUser } from '@/src/contexts/UserContext';
import { CONTINENT_COORDS } from '@/src/lib/constants';
import type { ContinentId } from '@/src/types/api';
import type { LatLngTuple } from 'leaflet';

const EARTH_RADIUS_KM = 6371;
const CONE_DISTANCE_KM = 3000;
const CONE_HALF_ANGLE_DEG = 15;

/**
 * Compute a destination lat/lng given an origin, bearing (degrees), and distance (km).
 * Uses the spherical law of cosines.
 */
function destPoint(
  lat: number,
  lng: number,
  bearingDeg: number,
  distKm: number,
): LatLngTuple {
  const R = EARTH_RADIUS_KM;
  const d = distKm / R; // angular distance in radians
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );

  return [(lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI];
}

/** Builds the 3-point cone polygon from an origin toward a bearing. */
function buildConePolygon(
  lat: number,
  lng: number,
  directionDeg: number,
): LatLngTuple[] {
  const origin: LatLngTuple = [lat, lng];
  const left = destPoint(lat, lng, directionDeg - CONE_HALF_ANGLE_DEG, CONE_DISTANCE_KM);
  const right = destPoint(lat, lng, directionDeg + CONE_HALF_ANGLE_DEG, CONE_DISTANCE_KM);
  return [origin, left, right];
}

/** Keeps the map view stable on first load. */
function MapInit() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

interface MapViewProps {
  onlineContinents: ContinentId[];
}

/** Smoothly interpolates an angle (degrees) toward a target using rAF. */
function useAnimatedAngle(target: number): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const from = displayRef.current;
    // Shortest angular delta, handling 0°/360° wrap
    let delta = ((target - from) % 360 + 360) % 360;
    if (delta > 180) delta -= 360;

    if (Math.abs(delta) < 0.3) {
      displayRef.current = target;
      rafRef.current = requestAnimationFrame(() => {
        setDisplay(target);
        rafRef.current = null;
      });
      return;
    }

    // 120°/s sweep speed
    const SPEED = 0.12; // deg per ms
    const duration = Math.abs(delta) / SPEED;
    let startTs: number | null = null;

    function frame(ts: number) {
      if (startTs === null) startTs = ts;
      const t = Math.min((ts - startTs) / duration, 1);
      // ease-in-out quad
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const current = from + delta * ease;
      displayRef.current = current;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        displayRef.current = target;
        setDisplay(target);
      }
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target]);

  return display;
}

export function MapView({ onlineContinents }: MapViewProps) {
  const { user } = useUser();

  const animatedDirection = useAnimatedAngle(user?.antenna_direction ?? 0);
  const userCoords = user ? CONTINENT_COORDS[user.continent_id] : null;
  const conePolygon =
    userCoords
      ? buildConePolygon(userCoords.lat, userCoords.lng, animatedDirection)
      : null;

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={10}
      maxBounds={[[-90, -180], [90, 180]]}
      maxBoundsViscosity={1.0}
      zoomControl={false}
      attributionControl={false}
      style={{ height: '100%', width: '100%', minHeight: '100vh', background: '#0a0a0a' }}
    >
      <MapInit />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={10}
      />

      {/* Faint dots for other online users' continents */}
      {onlineContinents.flatMap((id) => {
        if (id === user?.continent_id) return [];
        const coords = CONTINENT_COORDS[id];
        if (!coords) return [];
        return [
          <CircleMarker
            key={id}
            center={[coords.lat, coords.lng]}
            radius={5}
            pathOptions={{ color: '#6b7280', fillColor: '#6b7280', fillOpacity: 0.4, weight: 1 }}
          />,
        ];
      })}

      {/* User marker */}
      {userCoords && (
        <CircleMarker
          center={[userCoords.lat, userCoords.lng]}
          radius={8}
          pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.9 }}
        />
      )}

      {/* 30° cone in antenna direction — position updates every rAF tick */}
      {conePolygon && (
        <Polygon
          positions={conePolygon}
          pathOptions={{
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: Math.abs(animatedDirection - (user?.antenna_direction ?? 0)) > 0.5 ? 0.25 : 0.15,
            weight: Math.abs(animatedDirection - (user?.antenna_direction ?? 0)) > 0.5 ? 1.5 : 1,
          }}
        />
      )}
    </MapContainer>
  );
}
