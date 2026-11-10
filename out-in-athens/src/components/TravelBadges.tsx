// Walk / bike / bus travel-time badges — the sustainability hook.
import { View, type ViewStyle } from 'react-native';

import type { LatLng } from '@/data/types';
import { fmtMins, travelTimes } from '@/lib/geo';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from './Icon';
import { Txt } from './ui';

export function TravelBadges({ from, to, style, showCar }: { from: LatLng; to: LatLng; style?: ViewStyle; showCar?: boolean }) {
  const { c } = useTheme();
  const { profile } = useApp();
  const t = travelTimes(from, to);
  const items: { icon: IconName; key: keyof typeof t; mins: number }[] = [
    { icon: 'walk', key: 'walk', mins: t.walk },
    { icon: 'bike', key: 'bike', mins: t.bike },
    { icon: 'bus', key: 'bus', mins: t.bus },
  ];
  if (showCar) items.push({ icon: 'car', key: 'car', mins: t.car });
  return (
    <View
      style={[{ flexDirection: 'row', gap: 10, alignItems: 'center' }, style]}
      accessible
      accessibilityLabel={`Walk ${t.walk} minutes, bike ${t.bike} minutes, bus ${t.bus} minutes`}
    >
      {items.map((i) => {
        const mine = profile.transport === i.key;
        return (
          <View key={i.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Icon name={i.icon} color={mine ? c.ivy : c.textMuted} size={15} />
            <Txt v="caption" color={mine ? c.ivy : c.textMuted} style={mine ? { fontWeight: '700' } : undefined}>
              {fmtMins(i.mins)}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}
