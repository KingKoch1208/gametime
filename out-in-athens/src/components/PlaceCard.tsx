// Place cards are flyers taped to a pole: a halftone "photo", a strip of tape,
// hours, cost, access stamp and car-free travel badges.
import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import type { Accent, Place } from '@/data/types';
import type { AccessResult } from '@/lib/access';
import { haptic } from '@/lib/feedback';
import { MOCK_ME } from '@/lib/geo';
import { openStatus } from '@/lib/time';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { accentFill, onAccent } from '@/theme/tokens';
import { CATEGORY_ICON, Icon, type IconName } from './Icon';
import { Stamp } from './Stamp';
import { TravelBadges } from './TravelBadges';
import { Txt } from './ui';

export function placeIcon(p: Place): IconName {
  if (p.kind === 'food') return CATEGORY_ICON[p.foodKind ?? 'restaurant'] ?? 'food';
  return CATEGORY_ICON[p.exploreCategories[0]] ?? 'pin';
}

/** Placeholder "photo": halftone print in the place's accent color. */
export function PhotoBlock({
  accent,
  icon,
  height = 110,
  label,
  style,
  seed = 0,
}: {
  accent: Accent;
  icon: IconName;
  height?: number;
  label?: string;
  style?: ViewStyle;
  seed?: number;
}) {
  const { c } = useTheme();
  const fill = accentFill(c, accent);
  const fg = onAccent(accent);
  const pid = `ht-${accent}-${seed}`;
  return (
    <View style={[{ height, backgroundColor: fill, overflow: 'hidden' }, style]} accessible={false}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id={pid} patternUnits="userSpaceOnUse" width={7} height={7} patternTransform={`rotate(${20 + (seed % 4) * 10})`}>
            <Circle cx={3.5} cy={3.5} r={1.3} fill={fg} opacity={0.22} />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${pid})`} />
        <Circle cx={`${70 + (seed % 3) * 8}%`} cy="25%" r={height * 0.55} fill={fg} opacity={0.08} />
      </Svg>
      <View style={{ position: 'absolute', right: 12, bottom: 10 }}>
        <Icon name={icon} color={fg} size={Math.min(56, height * 0.45)} strokeWidth={1.4} />
      </View>
      {label && (
        <View style={{ position: 'absolute', left: 10, bottom: 8 }}>
          <Txt v="labelSm" color={fg}>
            {label}
          </Txt>
        </View>
      )}
    </View>
  );
}

export function Tape({ rotate = -4, style }: { rotate?: number; style?: ViewStyle }) {
  const { c } = useTheme();
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: -9,
          alignSelf: 'center',
          width: 64,
          height: 20,
          backgroundColor: c.mustard,
          opacity: 0.55,
          transform: [{ rotate: `${rotate}deg` }],
          zIndex: 2,
        },
        style,
      ]}
    />
  );
}

type Props = { place: Place; acc: AccessResult; km?: number; width?: number; now?: Date; compact?: boolean };

function PlaceCardImpl({ place: p, acc, width, now = new Date(), compact }: Props) {
  const { c } = useTheme();
  const { savedPlaces, toggleSavedPlace, checkins } = useApp();
  const saved = savedPlaces.includes(p.id);
  const locked = !acc.canAttend;
  const status = openStatus(p.hours, now);
  const seed = p.id.length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${p.name}. ${status.label}. ${p.cost === 0 ? 'Free' : (p.costNote ?? `About $${p.avgPrice ?? p.cost}`)}${locked ? `. Locked: ${acc.lockReason}` : ''}`}
      onPress={() => router.push(`/place/${p.id}`)}
      style={({ pressed }) => [{ width, transform: [{ scale: pressed ? 0.985 : 1 }, { rotate: `${((seed % 3) - 1) * 0.4}deg` }] }]}
    >
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.lineStrong, opacity: locked ? 0.55 : 1 }]}>
        <Tape rotate={(seed % 2 ? -1 : 1) * 4} />
        <PhotoBlock accent={locked ? 'ink' : p.accent} icon={placeIcon(p)} height={compact ? 84 : 112} seed={seed} label={`${p.photoCount} photos`} />
        <View style={{ padding: 12, gap: 4 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Txt v="serif" numberOfLines={1}>
                {p.name}
              </Txt>
              <Txt v="bodySm" muted numberOfLines={1}>
                <Txt v="bodySm" color={status.open ? c.ivy : c.brick} style={{ fontWeight: '700' }}>
                  {status.open ? '● ' : '○ '}
                  {status.label}
                </Txt>
                {' · '}
                {p.cost === 0 ? (p.costNote ?? 'Free') : p.costNote ?? `~$${p.avgPrice ?? p.cost}`}
              </Txt>
            </View>
            {!locked && (
              <Pressable
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={saved ? `Unsave ${p.name}` : `Save ${p.name}`}
                onPress={() => {
                  const on = toggleSavedPlace(p.id);
                  if (on) haptic.success();
                  else haptic.tap();
                }}
              >
                <Icon name="bookmark" color={saved ? c.brick : c.text} fill={saved ? c.brick : 'none'} size={22} />
              </Pressable>
            )}
          </View>
          {!compact && (
            <Txt v="caption" muted numberOfLines={1}>
              Good for: {p.goodFor.join(', ')}
            </Txt>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4, alignItems: 'center' }}>
            <Stamp kind={acc.stamp} text={acc.stamp === 'lock' ? acc.lockReason : undefined} animate={false} />
            {acc.perk && <Stamp kind="perk" animate={false} />}
            {checkins[p.id] && <Stamp kind="verified" text="Stamped" animate={false} />}
          </View>
          {!compact && !locked && <TravelBadges to={p.coords} from={MOCK_ME} style={{ marginTop: 6 }} />}
        </View>
      </View>
    </Pressable>
  );
}

export const PlaceCard = memo(PlaceCardImpl);

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: 2, overflow: 'visible' },
});
