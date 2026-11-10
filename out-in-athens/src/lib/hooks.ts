import { useEffect, useMemo, useState } from 'react';

import { getWeather, now as clockNow } from '@/services/dataService';
import { useApp } from '@/state/AppState';

/** Current time (or the Pitch Mode demo clock), re-rendering every minute. */
export function useNow(): Date {
  const { prefs } = useApp();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => clockNow(), [tick, prefs.demoTime]);
}

export function useWeather(now: Date) {
  const { prefs } = useApp();
  // Recompute hourly-ish; the override from Pitch Mode applies instantly.
  const hourKey = `${now.getDate()}-${now.getHours()}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getWeather(now, prefs.demoWeather), [hourKey, prefs.demoWeather]);
}
