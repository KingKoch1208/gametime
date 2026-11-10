import * as Calendar from 'expo-calendar/legacy';
import { Alert } from 'react-native';

import type { AthensEvent } from '@/data/types';
import { haptic } from './feedback';

/** Opens the iOS "New Event" sheet pre-filled. Works in Expo Go. */
export async function addToCalendar(e: AthensEvent) {
  try {
    const res = await Calendar.createEventInCalendarAsync({
      title: e.title,
      startDate: e.start,
      endDate: e.end,
      location: e.venue,
      notes: `${e.description}\n\nFound on Out in Athens (prototype — sample data).`,
    });
    if (res.action === 'saved') haptic.success();
  } catch {
    Alert.alert('Couldn’t open Calendar', 'Calendar access may be turned off for Expo Go in Settings.');
  }
}
