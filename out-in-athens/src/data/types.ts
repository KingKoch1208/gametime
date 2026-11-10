// Shared domain types. These are the shapes a real backend (Firebase, partner
// feeds, a scraper) will need to produce. See services/dataService.ts.

export type Access = 'open' | 'uga_id' | 'uga_guest_ok' | '18+' | '21+' | 'ticketed';

export type AccessMode = 'student' | 'local' | 'visitor';

export type AgeRange = 'under18' | '18+' | '21+' | null;

export type Transport = 'walk' | 'bike' | 'car' | 'bus';

export type Interest =
  | 'music'
  | 'outdoors'
  | 'sports'
  | 'arts'
  | 'food'
  | 'nightlife'
  | 'fitness'
  | 'volunteer'
  | 'nerdy'
  | 'family'
  | 'faith'
  | 'film'
  | 'markets'
  | 'study';

export type EventCategory =
  | 'concerts'
  | 'sports'
  | 'shows'
  | 'campus'
  | 'community'
  | 'outdoors'
  | 'arts'
  | 'volunteer';

export type ExploreCategory =
  | 'trails'
  | 'museums'
  | 'study'
  | 'courts'
  | 'gyms'
  | 'records'
  | 'scenic'
  | 'volunteer'
  | 'free';

export type FoodTag =
  | 'cheap'
  | 'late'
  | 'coffee'
  | 'sweet'
  | 'healthy'
  | 'vegetarian'
  | 'vegan'
  | 'gf'
  | 'halal';

export type LatLng = { latitude: number; longitude: number };

export type Source = {
  kind: 'partner' | 'student' | 'team' | 'scraper';
  name: string;
  verified: boolean;
};

export type Accent = 'brick' | 'ivy' | 'mustard' | 'ink';

export type ReviewTag =
  | 'chill'
  | 'crowded'
  | 'great for groups'
  | 'bring cash'
  | 'dog friendly'
  | 'date spot'
  | 'loud'
  | 'study-able'
  | 'kid friendly'
  | 'worth it';

export type AthensEvent = {
  id: string;
  title: string;
  category: EventCategory;
  interests: Interest[];
  start: Date;
  end: Date;
  venue: string;
  placeId?: string;
  coords: LatLng;
  price: number; // 0 = free, otherwise lowest price in USD
  priceNote?: string;
  access: Access;
  indoor: boolean;
  soberFriendly: boolean;
  accessibleVenue: boolean;
  petFriendly: boolean;
  dawgPerk?: string; // e.g. "Free with UGA ID"
  description: string;
  orgId?: string;
  source: Source;
  interested: number;
  going: number;
  friendsGoing: string[];
  isNew?: boolean;
  featured?: boolean;
  accent: Accent;
  reviewTags?: ReviewTag[];
  // concerts / sports extras
  lineup?: string[];
  opponent?: string;
  isAway?: boolean;
  ticketUrl?: string;
  studentTicketNote?: string;
  watchPartyIds?: string[];
  watchPartyFor?: string;
  // submissions
  pending?: boolean;
};

export type DayHours = [number, number] | null; // [open, close] in hours from midnight; close may be > 24

export type Hours =
  | { kind: 'always' }
  | { kind: 'daylight' } // dawn to dusk
  | { kind: 'weekly'; days: DayHours[] }; // index 0 = Sunday

export type Place = {
  id: string;
  name: string;
  kind: 'place' | 'food';
  exploreCategories: ExploreCategory[];
  interests: Interest[];
  coords: LatLng;
  hours: Hours;
  cost: number; // 0 = free
  costNote?: string;
  access: Access;
  dawgPerk?: string;
  indoor: boolean;
  goodFor: string[];
  description: string;
  neighborhood: string;
  accent: Accent;
  accessibleVenue: boolean;
  petFriendly: boolean;
  reviewTags?: ReviewTag[];
  photoCount: number;
  orgId?: string;
  // food extras
  foodKind?: 'restaurant' | 'truck' | 'dining_hall' | 'market' | 'cafe';
  foodTags?: FoodTag[];
  avgPrice?: number;
  deals?: { day: number; text: string }[];
  spottedToday?: string; // food trucks
  season?: string;
};

export type Friend = {
  id: string;
  name: string;
  initials: string;
  color: string;
  coords: LatLng;
  status: string;
  sharing: boolean; // opted in to the map
  mode: AccessMode;
};

export type Org = {
  id: string;
  name: string;
  short: string;
  kind: 'partner' | 'club' | 'media' | 'government' | 'nonprofit';
  verified: boolean;
  description: string;
  accent: Accent;
  followers: number;
};

export type GuideItem = { refType: 'place' | 'event'; refId: string; note: string };

export type Guide = {
  id: string;
  title: string;
  kicker: string;
  intro: string;
  accent: Accent;
  items: GuideItem[];
  forModes?: AccessMode[];
};

export type Weather = {
  tempF: number;
  condition: 'clear' | 'cloudy' | 'rain';
  label: string;
};

export type FoodResource = {
  id: string;
  name: string;
  detail: string;
  hours: string;
  access: Access;
  coords: LatLng;
};
