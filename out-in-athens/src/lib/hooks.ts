import { useEffect, useMemo, useState } from 'react';

import { getWeather } from '@/services/dataService';
import { useApp } from '@/state/AppState';

/** Current time, re-rendering every minute. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function useWeather(now: Date) {
  const { prefs } = useApp();
  // Recompute hourly-ish; the override from Pitch Mode applies instantly.
  const hourKey = `${now.getDate()}-${now.getHours()}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getWeather(now, prefs.demoWeather), [hourKey, prefs.demoWeather]);
}
