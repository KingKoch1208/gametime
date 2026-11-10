import type { LatLng, Transport } from '@/data/types';

export const ATHENS_CENTER: LatLng = { latitude: 33.957, longitude: -83.376 };

// The prototype uses a fixed "you are here" on North Campus so demos are
// consistent wherever the pitch happens. TODO: backend — swap for expo-location.
export const MOCK_ME: LatLng = { latitude: 33.9561, longitude: -83.3752 };

export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const la1 = (a.latitude * Math.PI) / 180;
  const la2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** "Near me" radius depends on how you get around. */
export const NEAR_RADIUS_KM: Record<Transport, number> = {
  walk: 1.8,
  bike: 5,
  bus: 7,
  car: 20,
};

export type TravelTimes = { walk: number; bike: number; bus: number; car: number };

/** Rough minutes, assuming Athens street grid (x1.3 detour factor). */
export function travelTimes(from: LatLng, to: LatLng): TravelTimes {
  const km = distanceKm(from, to) * 1.3;
  return {
    walk: Math.max(1, Math.round((km / 4.8) * 60)),
    bike: Math.max(1, Math.round((km / 15) * 60)),
    bus: Math.max(4, Math.round((km / 18) * 60 + 7)), // incl. avg wait for an Athens Transit / UGA bus
    car: Math.max(3, Math.round((km / 35) * 60 + 4)), // incl. parking
  };
}

export function fmtMins(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h${r}` : `${h}h`;
}

export function fmtDistance(km: number): string {
  const mi = km * 0.621;
  return mi < 0.2 ? `${Math.round((mi * 5280) / 10) * 10} ft` : `${mi.toFixed(1)} mi`;
}

/** Car-free = walkable in 25 min, bikeable in 20, or bus in 25. */
export function isCarFree(from: LatLng, to: LatLng): boolean {
  const t = travelTimes(from, to);
  return t.walk <= 25 || t.bike <= 20 || t.bus <= 25;
}

export function isWalkable(from: LatLng, to: LatLng): boolean {
  return travelTimes(from, to).walk <= 20;
}
