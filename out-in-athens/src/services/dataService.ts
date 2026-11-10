// dataService — the ONLY module screens use to read content.
//
// TODO: backend — everything below reads local mock data from /data. Replace the
// bodies of these functions with Firebase / partner feeds / a scraper pipeline
// and keep the signatures. Screens never import /data directly (except types).

import { buildEvents } from '@/data/events';
import { FOOD, FOOD_RESOURCES } from '@/data/food';
import { PLACES } from '@/data/places';
import { FRIENDS, GUIDES, ORGS } from '@/data/social';
import type { AthensEvent, EventCategory, ExploreCategory, FoodTag, Friend, Guide, Interest, LatLng, Org, Place, Transport, Weather } from '@/data/types';
import { accessFor, type AccessResult, type Viewer } from '@/lib/access';
import { distanceKm, isCarFree, isWalkable, MOCK_ME, NEAR_RADIUS_KM } from '@/lib/geo';
import { isLive, isOpenAt, overlaps, sameDay, type TimeWindow, windowRange } from '@/lib/time';

export type Listed<T> = {
  item: T;
  acc: AccessResult;
  km: number;
  live: boolean; // events: happening now. places: open now.
};

// ——— Session cache ———
let cachedAt = new Date();
let EVENTS: AthensEvent[] = buildEvents(cachedAt);

export function now(): Date {
  return new Date();
}

/** Re-generate relative dates (pull-to-refresh). */
export async function refresh(): Promise<void> {
  // TODO: backend — fetch new data here.
  await new Promise((r) => setTimeout(r, 700));
  cachedAt = new Date();
  EVENTS = buildEvents(cachedAt);
}

export function myLocation(): LatLng {
  return MOCK_ME;
}

// ——— Events ———

export type EventFilters = {
  viewer: Viewer;
  categories?: EventCategory[];
  window?: TimeWindow;
  day?: Date;
  freeOnly?: boolean;
  openToMe?: boolean;
  walkable?: boolean;
  setting?: 'indoor' | 'outdoor' | null;
  allAges?: boolean;
  soberFriendly?: boolean;
  accessible?: boolean;
  petFriendly?: boolean;
  maxPrice?: number | null;
  carFree?: boolean;
  interests?: Interest[];
  includeAway?: boolean;
  query?: string;
};

export function getEvents(f: EventFilters): Listed<AthensEvent>[] {
  const t = now();
  const me = myLocation();
  const range = f.window ? windowRange(f.window, t) : null;
  const q = f.query?.trim().toLowerCase();
  return EVENTS.filter((e) => e.end > t)
    .map((e) => ({ item: e, acc: accessFor(e, f.viewer), km: distanceKm(me, e.coords), live: isLive(e.start, e.end, t) }))
    .filter(({ item: e, acc }) => {
      if (!acc.visible) return false;
      if (f.openToMe && !acc.canAttend) return false;
      if (f.categories?.length && !f.categories.includes(e.category)) return false;
      if (range && !overlaps(e.start, e.end, range)) return false;
      if (f.day && !sameDay(e.start, f.day)) return false;
      if (f.freeOnly && e.price > 0) return false;
      if (f.maxPrice != null && e.price > f.maxPrice) return false;
      if (f.walkable && !isWalkable(me, e.coords)) return false;
      if (f.carFree && !isCarFree(me, e.coords)) return false;
      if (f.setting === 'indoor' && !e.indoor) return false;
      if (f.setting === 'outdoor' && e.indoor) return false;
      if (f.allAges && (e.access === '18+' || e.access === '21+')) return false;
      if (f.soberFriendly && !e.soberFriendly) return false;
      if (f.accessible && !e.accessibleVenue) return false;
      if (f.petFriendly && !e.petFriendly) return false;
      if (f.interests?.length && !e.interests.some((i) => f.interests!.includes(i))) return false;
      if (!f.includeAway && e.isAway && !f.categories?.includes('sports')) return false;
      if (q && !`${e.title} ${e.venue} ${e.description}`.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => {
      // Attendable first, then chronological.
      if (a.acc.canAttend !== b.acc.canAttend) return a.acc.canAttend ? -1 : 1;
      return a.item.start.getTime() - b.item.start.getTime();
    });
}

export function getEvent(id: string): AthensEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}

export function getEventsAtPlace(placeId: string): AthensEvent[] {
  const t = now();
  return EVENTS.filter((e) => e.placeId === placeId && e.end > t).sort((a, b) => +a.start - +b.start);
}

export function getEventsByOrg(orgId: string): AthensEvent[] {
  const t = now();
  return EVENTS.filter((e) => e.orgId === orgId && e.end > t).sort((a, b) => +a.start - +b.start);
}

export function getFeatured(viewer: Viewer): Listed<AthensEvent> | undefined {
  // TODO: backend — paid placement from the Partner Portal. Always labeled "Featured".
  return getEvents({ viewer, openToMe: true }).find((l) => l.item.featured) ?? getEvents({ viewer, openToMe: true, window: 'week' })[0];
}

// ——— Places & food ———

export type PlaceFilters = {
  viewer: Viewer;
  kind?: 'place' | 'food';
  category?: ExploreCategory | null;
  foodTags?: FoodTag[];
  foodKind?: Place['foodKind'];
  openNow?: boolean;
  openToMe?: boolean;
  carFree?: boolean;
  freeOnly?: boolean;
  maxPrice?: number;
  indoorOnly?: boolean;
  query?: string;
};

export function getPlaces(f: PlaceFilters): Listed<Place>[] {
  const t = now();
  const me = myLocation();
  const all = f.kind === 'food' ? FOOD : f.kind === 'place' ? PLACES : [...PLACES, ...FOOD];
  const q = f.query?.trim().toLowerCase();
  return all
    .map((p) => ({ item: p, acc: accessFor(p, f.viewer), km: distanceKm(me, p.coords), live: isOpenAt(p.hours, t) }))
    .filter(({ item: p, acc, live }) => {
      if (!acc.visible) return false;
      if (f.openToMe && !acc.canAttend) return false;
      if (f.category === 'free' && p.cost > 0) return false;
      if (f.category && f.category !== 'free' && !p.exploreCategories.includes(f.category)) return false;
      if (f.foodTags?.length && !f.foodTags.every((tag) => p.foodTags?.includes(tag))) return false;
      if (f.foodKind && p.foodKind !== f.foodKind) return false;
      if (f.openNow && !live) return false;
      if (f.carFree && !isCarFree(me, p.coords)) return false;
      if (f.freeOnly && p.cost > 0) return false;
      if (f.maxPrice != null && (p.avgPrice ?? p.cost) > f.maxPrice) return false;
      if (f.indoorOnly && !p.indoor) return false;
      if (q && !`${p.name} ${p.description} ${p.goodFor.join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.acc.canAttend !== b.acc.canAttend) return a.acc.canAttend ? -1 : 1;
      if (a.live !== b.live) return a.live ? -1 : 1;
      return a.km - b.km;
    });
}

export function getPlace(id: string): Place | undefined {
  return PLACES.find((p) => p.id === id) ?? FOOD.find((p) => p.id === id);
}

export function getDealsForDay(day: number, viewer: Viewer): { place: Place; text: string; acc: AccessResult }[] {
  return FOOD.flatMap((p) => (p.deals ?? []).filter((d) => d.day === day).map((d) => ({ place: p, text: d.text, acc: accessFor(p, viewer) }))).filter(
    (d) => d.acc.visible,
  );
}

export function getFoodResources(viewer: Viewer) {
  // Resources are always listed so people know they exist, but UGA-only ones
  // are clearly labeled for locals rather than hidden.
  return FOOD_RESOURCES.map((r) => ({ item: r, acc: accessFor(r, { ...viewer, showUgaOnly: true }) }));
}

// ——— "I'm bored" deck ———

export type DeckCard = { type: 'event'; listed: Listed<AthensEvent>; score: number } | { type: 'place'; listed: Listed<Place>; score: number };

/** Things open right now, near you, and allowed for your Access Mode. */
export function getBoredDeck(viewer: Viewer, transport: Transport, interests: Interest[], weather: Weather): DeckCard[] {
  const t = now();
  const radius = NEAR_RADIUS_KM[transport];
  const soon = new Date(t.getTime() + 75 * 60_000);
  const rainy = weather.condition === 'rain';

  const evs: DeckCard[] = getEvents({ viewer, openToMe: true })
    .filter((l) => l.item.start <= soon && l.item.end > t && l.km <= radius && !l.item.isAway)
    .map((l) => ({ type: 'event', listed: l, score: score(l.item.interests, l.km, interests, rainy && !l.item.indoor) + (l.live ? 2 : 1) }));

  const pls: DeckCard[] = getPlaces({ viewer, openToMe: true, openNow: true })
    .filter((l) => l.km <= radius && l.item.foodKind !== 'dining_hall')
    .map((l) => ({ type: 'place', listed: l, score: score(l.item.interests, l.km, interests, rainy && !l.item.indoor) }));

  return [...evs, ...pls].sort((a, b) => b.score - a.score).slice(0, 14);
}

function score(itemInterests: Interest[], km: number, mine: Interest[], wetPenalty: boolean): number {
  const match = itemInterests.filter((i) => mine.includes(i)).length;
  return match * 2 - km * 0.6 - (wetPenalty ? 3 : 0) + Math.random() * 1.5;
}

// ——— Social / orgs / guides ———

export function getFriends(): Friend[] {
  return FRIENDS;
}

export function getFriend(id: string): Friend | undefined {
  return FRIENDS.find((f) => f.id === id);
}

export function getOrgs(): Org[] {
  return ORGS;
}

export function getOrg(id: string): Org | undefined {
  return ORGS.find((o) => o.id === id);
}

export function getGuides(): Guide[] {
  return GUIDES;
}

export function getGuide(id: string): Guide | undefined {
  return GUIDES.find((g) => g.id === id);
}

// ——— Weather (mock) ———

export function getWeather(t: Date, override: 'auto' | 'rain' | 'clear'): Weather {
  // TODO: backend — real forecast (NWS API is free) for 30601.
  const doy = Math.floor((t.getTime() - new Date(t.getFullYear(), 0, 0).getTime()) / 86_400_000);
  const seasonal = 62 - 22 * Math.cos(((doy - 15) / 365) * 2 * Math.PI); // ~40°F Jan, ~84°F Jul
  const hr = t.getHours();
  const diurnal = -6 * Math.cos(((hr - 3) / 24) * 2 * Math.PI);
  const tempF = Math.round(seasonal + diurnal);
  const roll = (doy * 7) % 10;
  let condition: Weather['condition'] = roll < 2 ? 'rain' : roll < 4 ? 'cloudy' : 'clear';
  if (override !== 'auto') condition = override;
  const label = condition === 'rain' ? 'rain' : condition === 'cloudy' ? 'cloudy' : hr >= 19 || hr < 6 ? 'clear' : 'sunny';
  return { tempF, condition, label };
}

// ——— Analytics (Partner Portal mock) ———

export function getOrgAnalytics(orgId: string) {
  const evs = getEventsByOrg(orgId);
  const rows = evs.map((e) => ({
    event: e,
    views: e.interested * 9 + 140,
    saves: Math.round(e.interested * 0.7),
    going: e.going,
  }));
  const week = [0.6, 0.8, 0.7, 1.1, 1.4, 1.9, 1.5].map((m, i) => Math.round(m * (420 + orgId.length * 31) + i * 12));
  return {
    rows,
    totals: {
      views: rows.reduce((s, r) => s + r.views, 0),
      saves: rows.reduce((s, r) => s + r.saves, 0),
      going: rows.reduce((s, r) => s + r.going, 0),
    },
    week,
    audience: { students: 0.58, locals: 0.34, visitors: 0.08 },
  };
}
