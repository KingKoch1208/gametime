// App state: profile, preferences, saved items, check-ins, plans, submissions.
// Persisted locally with AsyncStorage. No auth — onboarding just writes here.
// TODO: backend — sync to a user doc once there is real login (see README).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { Access, AccessMode, AgeRange, EventCategory, Interest, LatLng, ReviewTag, Transport } from '@/data/types';
import type { Viewer } from '@/lib/access';

export type Profile = {
  name: string;
  mode: AccessMode;
  interests: Interest[];
  transport: Transport;
  age: AgeRange;
  onboarded: boolean;
};

export type Prefs = {
  showUgaOnly: boolean;
  ghostMode: boolean;
  theme: 'system' | 'paper' | 'afterDark';
  textScale: 1 | 1.15 | 1.3;
  reduceMotion: boolean;
  sounds: boolean;
  notif: { weekendDrop: boolean; friendsGoing: boolean; reminders: boolean };
  pitchMode: boolean;
  demoWeather: 'auto' | 'rain' | 'clear';
};

export type Plan = {
  id: string;
  refType: 'event' | 'place';
  refId: string;
  title: string;
  invited: string[];
  times: { label: string; votes: string[] }[];
  responses: Record<string, 'in' | 'maybe' | 'pending'>;
  createdAt: string;
};

export type Submission = {
  id: string;
  title: string;
  category: EventCategory;
  dayOffset: number;
  hour: number;
  coords: LatLng;
  price: number;
  access: Access;
  photoUri?: string;
  status: 'pending';
  submittedAt: string;
  asPartner?: string;
};

type Persisted = {
  profile: Profile;
  prefs: Prefs;
  savedEvents: string[];
  savedPlaces: string[];
  rsvp: Record<string, 'interested' | 'going'>;
  checkins: Record<string, string>; // placeId → ISO date
  plans: Plan[];
  submissions: Submission[];
  following: string[];
  myTags: Record<string, ReviewTag[]>;
  reported: string[];
  featureRequests: string[];
};

const DEFAULT: Persisted = {
  profile: { name: '', mode: 'student', interests: [], transport: 'walk', age: null, onboarded: false },
  prefs: {
    showUgaOnly: false,
    ghostMode: false,
    theme: 'system',
    textScale: 1,
    reduceMotion: false,
    sounds: true,
    notif: { weekendDrop: true, friendsGoing: true, reminders: true },
    pitchMode: false,
    demoWeather: 'auto',
  },
  savedEvents: [],
  savedPlaces: [],
  rsvp: {},
  // A few starter stamps so the passport isn't empty in demos.
  checkins: {},
  plans: [],
  submissions: [],
  following: ['red-black'],
  myTags: {},
  reported: [],
  featureRequests: [],
};

const KEY = 'out-in-athens:v1';

type Ctx = Persisted & {
  ready: boolean;
  viewer: Viewer;
  setProfile: (p: Partial<Profile>) => void;
  setPrefs: (p: Partial<Prefs>) => void;
  toggleSavedEvent: (id: string) => boolean;
  toggleSavedPlace: (id: string) => boolean;
  setRsvp: (id: string, v: 'interested' | 'going' | null) => void;
  checkIn: (placeId: string) => void;
  addPlan: (p: Plan) => void;
  updatePlan: (id: string, patch: Partial<Plan>) => void;
  addSubmission: (s: Submission) => void;
  toggleFollow: (orgId: string) => void;
  toggleTag: (id: string, tag: ReviewTag) => void;
  report: (id: string) => void;
  requestFeature: (id: string) => void;
  resetAll: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(DEFAULT);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Persisted>;
          setState((s) => ({
            ...s,
            ...parsed,
            profile: { ...s.profile, ...parsed.profile },
            prefs: { ...s.prefs, ...parsed.prefs, notif: { ...s.prefs.notif, ...parsed.prefs?.notif } },
          }));
        }
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const setProfile = useCallback((p: Partial<Profile>) => setState((s) => ({ ...s, profile: { ...s.profile, ...p } })), []);
  const setPrefs = useCallback((p: Partial<Prefs>) => setState((s) => ({ ...s, prefs: { ...s.prefs, ...p } })), []);

  const stateRef = useRef(state);
  stateRef.current = state;

  const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const toggleSavedEvent = useCallback((id: string) => {
    const now = !stateRef.current.savedEvents.includes(id);
    setState((s) => ({ ...s, savedEvents: toggleIn(s.savedEvents, id) }));
    return now;
  }, []);
  const toggleSavedPlace = useCallback((id: string) => {
    const now = !stateRef.current.savedPlaces.includes(id);
    setState((s) => ({ ...s, savedPlaces: toggleIn(s.savedPlaces, id) }));
    return now;
  }, []);
  const setRsvp = useCallback((id: string, v: 'interested' | 'going' | null) => {
    setState((s) => {
      const rsvp = { ...s.rsvp };
      if (v) rsvp[id] = v;
      else delete rsvp[id];
      return { ...s, rsvp };
    });
  }, []);
  const checkIn = useCallback(
    (placeId: string) => setState((s) => ({ ...s, checkins: { ...s.checkins, [placeId]: new Date().toISOString() } })),
    [],
  );
  const addPlan = useCallback((p: Plan) => setState((s) => ({ ...s, plans: [p, ...s.plans] })), []);
  const updatePlan = useCallback(
    (id: string, patch: Partial<Plan>) => setState((s) => ({ ...s, plans: s.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
    [],
  );
  const addSubmission = useCallback((sub: Submission) => setState((s) => ({ ...s, submissions: [sub, ...s.submissions] })), []);
  const toggleFollow = useCallback((orgId: string) => setState((s) => ({ ...s, following: toggleIn(s.following, orgId) })), []);
  const toggleTag = useCallback(
    (id: string, tag: ReviewTag) =>
      setState((s) => {
        const cur = s.myTags[id] ?? [];
        const next = cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag];
        return { ...s, myTags: { ...s.myTags, [id]: next } };
      }),
    [],
  );
  const report = useCallback((id: string) => setState((s) => ({ ...s, reported: toggleIn(s.reported.filter((x) => x !== id), id) })), []);
  const requestFeature = useCallback((id: string) => setState((s) => ({ ...s, featureRequests: [...s.featureRequests.filter((x) => x !== id), id] })), []);
  const resetAll = useCallback(() => setState(DEFAULT), []);

  const viewer = useMemo<Viewer>(
    () => ({ mode: state.profile.mode, age: state.profile.age, showUgaOnly: state.prefs.showUgaOnly }),
    [state.profile.mode, state.profile.age, state.prefs.showUgaOnly],
  );

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      ready,
      viewer,
      setProfile,
      setPrefs,
      toggleSavedEvent,
      toggleSavedPlace,
      setRsvp,
      checkIn,
      addPlan,
      updatePlan,
      addSubmission,
      toggleFollow,
      toggleTag,
      report,
      requestFeature,
      resetAll,
    }),
    [state, ready, viewer, setProfile, setPrefs, toggleSavedEvent, toggleSavedPlace, setRsvp, checkIn, addPlan, updatePlan, addSubmission, toggleFollow, toggleTag, report, requestFeature, resetAll],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside AppStateProvider');
  return ctx;
}
