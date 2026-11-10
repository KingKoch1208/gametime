import { Linking } from 'react-native';

import type { LatLng, Transport } from '@/data/types';

/** Opens Apple Maps directions using the person's preferred way of getting around. */
export function openDirections(to: LatLng, name: string, transport: Transport) {
  const flag = transport === 'walk' ? 'w' : transport === 'bus' ? 'r' : transport === 'bike' ? 'c' : 'd';
  const url = `http://maps.apple.com/?daddr=${to.latitude},${to.longitude}&q=${encodeURIComponent(name)}&dirflg=${flag}`;
  Linking.openURL(url).catch(() => {});
}
