'use client';

import { useEffect } from 'react';
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

export function MapView({ onlineContinents }: MapViewProps) {
  const { user } = useUser();

  const userCoords = user ? CONTINENT_COORDS[user.continent_id] : null;
  const conePolygon =
    userCoords
      ? buildConePolygon(userCoords.lat, userCoords.lng, user!.antenna_direction)
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
      {onlineContinents
        .filter((id) => id !== user?.continent_id)
        .map((id) => {
          const coords = CONTINENT_COORDS[id];
          return coords ? (
            <CircleMarker
              key={id}
              center={[coords.lat, coords.lng]}
              radius={5}
              pathOptions={{ color: '#6b7280', fillColor: '#6b7280', fillOpacity: 0.4, weight: 1 }}
            />
          ) : null;
        })}

      {/* User marker */}
      {userCoords && (
        <CircleMarker
          center={[userCoords.lat, userCoords.lng]}
          radius={8}
          pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.9 }}
        />
      )}

      {/* 30° cone in antenna direction */}
      {conePolygon && (
        <Polygon
          positions={conePolygon}
          pathOptions={{
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.15,
            weight: 1,
          }}
        />
      )}
    </MapContainer>
  );
}
