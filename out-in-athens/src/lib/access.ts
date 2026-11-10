// Core Access Mode logic.
//
// The rule: the app must never push someone toward something they can't get into.
// Every list, swipe deck, map pin and recommendation goes through `accessFor()`.

import type { Access, AccessMode, AgeRange } from '@/data/types';

export type Viewer = {
  mode: AccessMode;
  age: AgeRange;
  showUgaOnly: boolean; // locals: reveal UGA-only items, greyed out with a lock
};

export type AccessResult = {
  /** Show it at all? */
  visible: boolean;
  /** Can this person actually go? (false → greyed out, lock stamp, no CTAs) */
  canAttend: boolean;
  /** Why it's locked, for the lock stamp and the detail banner. */
  lockReason?: string;
  /** Primary stamp for cards. */
  stamp: StampKind;
  /** Show the "Dawg perk" badge. */
  perk: boolean;
};

export type StampKind = 'free' | 'open' | 'uga' | 'guest' | '18' | '21' | 'ticket' | 'perk' | 'lock' | 'featured' | 'pending' | 'verified' | 'live' | 'new';

function ageOk(access: Access, age: AgeRange): boolean | 'unknown' {
  if (access === '21+') {
    if (age === '21+') return true;
    if (age === null) return 'unknown';
    return false;
  }
  if (access === '18+') {
    if (age === '18+' || age === '21+') return true;
    if (age === null) return 'unknown';
    return false;
  }
  return true;
}

export function accessFor(item: { access: Access; dawgPerk?: string; price?: number; cost?: number }, v: Viewer): AccessResult {
  const isStudent = v.mode === 'student';
  const perk = isStudent && !!item.dawgPerk;
  const price = item.price ?? item.cost ?? 0;

  // Age gates apply to everyone.
  const age = ageOk(item.access, v.age);
  if (age === false) {
    // Known to be too young: hide entirely. Nothing to see here.
    return { visible: false, canAttend: false, lockReason: `${item.access} only`, stamp: 'lock', perk: false };
  }

  switch (item.access) {
    case 'uga_id':
      if (isStudent) return { visible: true, canAttend: true, stamp: 'uga', perk: true };
      if (v.showUgaOnly) return { visible: true, canAttend: false, lockReason: 'UGA ID required', stamp: 'lock', perk: false };
      return { visible: false, canAttend: false, lockReason: 'UGA ID required', stamp: 'lock', perk: false };
    case 'uga_guest_ok':
      return { visible: true, canAttend: true, stamp: isStudent ? (price === 0 ? 'free' : 'uga') : 'guest', perk };
    case '21+':
      return { visible: true, canAttend: true, stamp: '21', perk };
    case '18+':
      return { visible: true, canAttend: true, stamp: '18', perk };
    case 'ticketed':
      return { visible: true, canAttend: true, stamp: 'ticket', perk };
    case 'open':
    default:
      return { visible: true, canAttend: true, stamp: price === 0 ? 'free' : 'open', perk };
  }
}

export const STAMP_TEXT: Record<StampKind, string> = {
  free: 'Free',
  open: 'Open to all',
  uga: 'UGA ID',
  guest: 'w/ student guest',
  '18': '18+',
  '21': '21+',
  ticket: 'Ticketed',
  perk: 'Dawg perk',
  lock: 'UGA only',
  featured: 'Featured',
  pending: 'Pending review',
  verified: 'Verified',
  live: 'Live now',
  new: 'New',
};

export const ACCESS_LABEL: Record<Access, string> = {
  open: 'Open to everyone',
  uga_id: 'UGA ID required',
  uga_guest_ok: 'UGA ID, or come with a student',
  '18+': 'Ages 18 and up',
  '21+': 'Ages 21 and up',
  ticketed: 'Ticket required',
};

export const MODE_LABEL: Record<AccessMode, string> = {
  student: 'UGA student',
  local: 'Athens local',
  visitor: 'Just visiting',
};
