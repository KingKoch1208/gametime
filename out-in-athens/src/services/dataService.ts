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
import { accessFor, type AccessResult, recommendable, type Viewer } from '@/lib/access';
import { distanceKm, isCarFree, isWalkable, MOCK_ME, NEAR_RADIUS_KM } from '@/lib/geo';
import { isLive, isOpenAt, overlaps, sameDay, type TimeWindow, windowRange } from '@/lib/time';

export type Listed<T> = {
  item: T;
  acc: AccessResult;
  km: number;
  live: boolean; // events: happening now. places: open now.
};

// ——— Clock ———
// Live by default. Pitch Mode can pin a demo clock (e.g. this Friday 6:30pm) so the
// schedule looks the same whenever the link is opened. The demo clock still ticks.
let clockOffsetMs = 0;
let demoKey: string | null = null;

export function now(): Date {
  return new Date(Date.now() + clockOffsetMs);
}

/** Set (ISO string) or clear (null) the demo clock. Rebuilds the sample schedule. */
export function setDemoTime(iso: string | null) {
  if (iso === demoKey) return;
  demoKey = iso;
  clockOffsetMs = iso ? new Date(iso).getTime() - Date.now() : 0;
  EVENTS = buildEvents(now());
}

/** Upcoming Friday 6:30pm (today if it's Friday), Saturday 11am, Tuesday 1pm. */
export function demoPreset(kind: 'fri' | 'sat' | 'tue'): string {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const target = { fri: 5, sat: 6, tue: 2 }[kind];
  base.setDate(base.getDate() + ((target - base.getDay() + 7) % 7));
  if (kind === 'fri') base.setHours(18, 30, 0, 0);
  if (kind === 'sat') base.setHours(11, 0, 0, 0);
  if (kind === 'tue') base.setHours(13, 0, 0, 0);
  return base.toISOString();
}

// ——— Session cache ———
let EVENTS: AthensEvent[] = buildEvents(now());

/** Re-generate relative dates (pull-to-refresh). */
export async function refresh(): Promise<void> {
  // TODO: backend — fetch new data here.
  await new Promise((r) => setTimeout(r, 700));
  EVENTS = buildEvents(now());
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
  newOnly?: boolean;
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
      if (f.openToMe && !recommendable(acc)) return false;
      if (f.categories?.length && !f.categories.includes(e.category)) return false;
      if (range && !overlaps(e.start, e.end, range)) return false;
      if (f.day && !sameDay(e.start, f.day)) return false;
      if (f.freeOnly && e.price > 0) return false;
      if (f.newOnly && !e.isNew) return false;
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
      if (q && !`${e.title} ${e.venue} ${e.description} ${e.category} ${e.interests.join(' ')} ${e.lineup?.join(' ') ?? ''}`.toLowerCase().includes(q))
        return false;
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
  // Only an event flagged featured by a partner org qualifies, and the caption
  // names that org. No fallback: if nothing qualifies, the slot is hidden.
  return getEvents({ viewer, openToMe: true, window: 'twoWeeks' }).find((l) => {
    const org = l.item.orgId ? getOrg(l.item.orgId) : undefined;
    return !!l.item.featured && org?.kind === 'partner';
  });
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
      if (f.openToMe && !recommendable(acc)) return false;
      if (f.category === 'free' && p.cost > 0) return false;
      if (f.category && f.category !== 'free' && !p.exploreCategories.includes(f.category)) return false;
      if (f.foodTags?.length && !f.foodTags.every((tag) => p.foodTags?.includes(tag))) return false;
      if (f.foodKind && p.foodKind !== f.foodKind) return false;
      if (f.openNow && !live) return false;
      if (f.carFree && !isCarFree(me, p.coords)) return false;
      if (f.freeOnly && p.cost > 0) return false;
      if (f.maxPrice != null && (p.avgPrice ?? p.cost) > f.maxPrice) return false;
      if (f.indoorOnly && !p.indoor) return false;
      if (
        q &&
        !`${p.name} ${p.description} ${p.goodFor.join(' ')} ${p.neighborhood} ${p.exploreCategories.join(' ')} ${p.foodTags?.join(' ') ?? ''} ${p.foodKind ?? ''}`
          .toLowerCase()
          .includes(q)
      )
        return false;
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
  return FOOD_RESOURCES.map((r) => ({ item: r, acc: accessFor(r, { ...viewer, showUgaOnly: true }) })).filter((r) => r.acc.visible);
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

export function getGuides(mode?: Viewer['mode']): Guide[] {
  return mode ? GUIDES.filter((g) => g.modes.includes(mode)) : GUIDES;
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
  const label = condition === 'rain' ? 'rain' : condition === 'cloudy' ? 'cloudy' : hr >= 18 || hr < 6 ? 'clear' : 'sunny';
  return { tempF, condition, label };
}

// ——— Analytics (Partner Portal mock) ———

export function getOrgAnalytics(orgId: string) {
  // SAMPLE analytics, derived from each org's own listings so partners differ.
  // Built so the numbers agree with each other: the daily bars sum to the Views
  // tile, listing views sum to the same total, and the audience split is 100%.
  const evs = getEventsByOrg(orgId);
  const seed = hash(orgId);
  const me = myLocation();

  // 1. Seven daily view counts first…
  const base = 300 + (seed % 400);
  const week = Array.from({ length: 7 }, (_, i) => Math.round(base * (0.55 + 0.45 * Math.abs(Math.sin(seed * 0.7 + i * (0.8 + (seed % 5) * 0.15)))) + i * 10));
  // 2. …then the total is their sum, and listing views are that total split by interest.
  const totalViews = week.reduce((sum, v) => sum + v, 0);
  const listingViews = splitInts(
    totalViews,
    evs.map((e) => e.interested * 9 + 140),
  );

  const used = new Set<number>();
  const rows = evs.map((e, i) => {
    const views = listingViews[i] ?? 0;
    return {
      event: e,
      views,
      saves: Math.round(views * (0.06 + (hash(e.id) % 5) / 100)),
      going: Math.min(e.going, Math.round(views * 0.12)),
      carFree: carFreeShare(distanceKm(me, e.coords), e.id, used),
    };
  });

  const W: Record<string, [number, number, number]> = {
    uga_id: [1, 0, 0],
    uga_guest_ok: [0.85, 0.15, 0],
    open: [0.4, 0.45, 0.15],
    ticketed: [0.35, 0.45, 0.2],
    '18+': [0.35, 0.45, 0.2],
    '21+': [0.35, 0.45, 0.2],
  };
  const mix = evs.reduce((acc, e) => acc.map((v, i) => v + W[e.access][i] * (1 + e.going / 100)) as [number, number, number], [0, 0, 0] as [
    number,
    number,
    number,
  ]);
  const total = mix[0] + mix[1] + mix[2] || 1;
  return {
    rows,
    totals: {
      views: totalViews,
      saves: rows.reduce((sum, r) => sum + r.saves, 0),
      going: rows.reduce((sum, r) => sum + r.going, 0),
    },
    week,
    audience: blendAudience(orgId, evs.length ? [mix[0] / total, mix[1] / total, mix[2] / total] : [0.4, 0.45, 0.15]),
  };
}

/** Split `total` into integers proportional to `weights` that sum exactly to `total` (largest remainder). */
export function splitInts(total: number, weights: number[]): number[] {
  const w = weights.reduce((a, b) => a + b, 0);
  if (!weights.length || w <= 0) return weights.map(() => 0);
  const raw = weights.map((x) => (x / w) * total);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) out[order[k][1]]++;
  return out;
}

/**
 * Sample share of "Directions" taps that pick walk, bike or bus, from distance:
 * under 1.5 km 75–90%, 1.5–5 km 40–70%, over 5 km 10–35%. Seeded per listing,
 * and nudged so no two listings in one portal show the same number.
 */
function carFreeShare(km: number, id: string, used: Set<number>): number {
  const [lo, hi] = km < 1.5 ? [75, 90] : km <= 5 ? [40, 70] : [10, 35];
  let pct = lo + (hash(id) % (hi - lo + 1));
  for (let n = 0; used.has(pct) && n < 60; n++) pct = pct + 1 > hi ? lo : pct + 1;
  used.add(pct);
  return pct / 100;
}

// Who each partner mostly reaches (sample), blended 50/50 with what their listings imply.
const AUDIENCE_BIAS: Record<string, [number, number, number]> = {
  'visit-athens': [0.2, 0.45, 0.35],
  'uga-rec': [0.97, 0.03, 0],
  'acc-leisure': [0.1, 0.8, 0.1],
  sustainability: [0.65, 0.3, 0.05],
  'farmers-market': [0.25, 0.6, 0.15],
  'red-black': [0.75, 0.15, 0.1],
};

function blendAudience(orgId: string, derived: [number, number, number]) {
  const b = AUDIENCE_BIAS[orgId] ?? derived;
  const m = derived.map((d, i) => (d + b[i]) / 2);
  // Whole percents that always total 100.
  const [students, locals, visitors] = splitInts(100, m);
  return { students, locals, visitors };
}

function hash(str: string): number {
  let h = 7;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/** The next few things this person can actually go to (I'm bored's quiet-hour fallback). */
export function getUpcoming(viewer: Viewer, n = 3): Listed<AthensEvent>[] {
  const t = now();
  return getEvents({ viewer, openToMe: true, window: 'twoWeeks' })
    .filter((l) => l.item.start > t && !l.item.isAway)
    .slice(0, n);
}
