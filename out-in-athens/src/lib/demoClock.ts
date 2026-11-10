// Which demo clock a fresh viewer starts on.
//
// The shared web link is opened by partners at random hours, so on web the app
// starts on the Friday 6:30pm preset instead of live time. A `?clock=live|fri|sat|tue`
// URL param (or `#clock=…`) overrides both that default and anything saved.
// The iPhone app keeps live time until someone picks a preset in Profile.
import { Platform } from 'react-native';

import { demoPreset } from '@/services/dataService';

export type ClockKind = 'live' | 'fri' | 'sat' | 'tue';

const KINDS: ClockKind[] = ['live', 'fri', 'sat', 'tue'];

/** The ?clock= param, if the page was opened with one (web only). */
export function clockParam(): ClockKind | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const raw = `${window.location.search}&${window.location.hash.replace(/^#/, '')}`;
    const m = raw.match(/(?:^|[?&])clock=([a-z]+)/i);
    const k = m?.[1].toLowerCase() as ClockKind | undefined;
    return k && KINDS.includes(k) ? k : null;
  } catch {
    return null;
  }
}

export function demoTimeFor(kind: ClockKind): string | null {
  return kind === 'live' ? null : demoPreset(kind);
}

/** Default demoTime for someone who has never picked one. */
export function defaultDemoTime(): string | null {
  return Platform.OS === 'web' ? demoPreset('fri') : null;
}
