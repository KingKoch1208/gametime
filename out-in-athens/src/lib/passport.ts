// Athens Passport badges.
import { getPlace } from '@/services/dataService';

export type Badge = {
  id: string;
  name: string;
  blurb: string;
  need: number;
  match: (placeId: string) => boolean;
  accent: 'brick' | 'ivy' | 'mustard' | 'ink';
};

const cat = (c: string) => (id: string) => !!getPlace(id)?.exploreCategories.includes(c as never);

export const BADGES: Badge[] = [
  { id: 'trail-dawg', name: 'Trail Dawg', blurb: 'Check in at 5 trails or parks', need: 5, match: cat('trails'), accent: 'ivy' },
  { id: 'museum-rat', name: 'Museum Rat', blurb: 'Visit 3 museums or galleries', need: 3, match: cat('museums'), accent: 'brick' },
  { id: 'crate-digger', name: 'Crate Digger', blurb: 'Hit 2 record or thrift stores', need: 2, match: cat('records'), accent: 'mustard' },
  { id: 'golden-hour', name: 'Golden Hour', blurb: 'Catch 3 scenic spots', need: 3, match: cat('scenic'), accent: 'mustard' },
  { id: 'good-neighbor', name: 'Good Neighbor', blurb: 'Volunteer at 2 places', need: 2, match: cat('volunteer'), accent: 'ivy' },
  { id: 'eats', name: 'Classic City Eats', blurb: 'Check in at 5 food spots', need: 5, match: (id) => getPlace(id)?.kind === 'food', accent: 'brick' },
  { id: 'local-legend', name: 'Local Legend', blurb: 'Collect 15 stamps anywhere', need: 15, match: () => true, accent: 'ink' },
];

export function badgeProgress(b: Badge, checkins: Record<string, string>) {
  const have = Object.keys(checkins).filter(b.match).length;
  return { have: Math.min(have, b.need), need: b.need, done: have >= b.need };
}
