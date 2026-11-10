// MAP — Snap Map energy for Athens. Live pins pulse, busy areas glow,
// friends show up as bubbles, and a time slider makes pins appear/disappear.
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileButton } from '@/components/Header';
import { CATEGORY_ICON, Icon, type IconName } from '@/components/Icon';
import { ClusterPin, FriendBubble, Pin, type PinColor } from '@/components/MapPins';
import { placeIcon } from '@/components/PlaceCard';
import { Stamp } from '@/components/Stamp';
import { TravelBadges } from '@/components/TravelBadges';
import { Button, Chip, Txt } from '@/components/ui';
import type { AthensEvent, LatLng, Place } from '@/data/types';
import type { AccessResult } from '@/lib/access';
import { openDirections } from '@/lib/directions';
import { haptic } from '@/lib/feedback';
import { ATHENS_CENTER, distanceKm, fmtDistance, MOCK_ME } from '@/lib/geo';
import { useNow } from '@/lib/hooks';
import { addDays, fmtTime, isOpenAt, openStatus, overlaps, startOfDay, whenLabel, windowRange } from '@/lib/time';
import { getEvents, getFriends, getPlaces, type Listed } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { palette } from '@/theme/tokens';

const { width: SW } = Dimensions.get('window');

type FilterKey = 'events' | 'trails' | 'food' | 'free' | 'open' | 'study';
const FILTERS: { key: FilterKey; label: string; icon: IconName }[] = [
  { key: 'events', label: 'Events', icon: 'ticket' },
  { key: 'trails', label: 'Trails', icon: 'trail' },
  { key: 'food', label: 'Food', icon: 'food' },
  { key: 'free', label: 'Free', icon: 'tag' },
  { key: 'open', label: 'Open now', icon: 'clock' },
  { key: 'study', label: 'Study spots', icon: 'book' },
];

const STOPS = ['Now', 'Tonight', 'This weekend'] as const;

type MapPin = {
  id: string;
  kind: 'event' | 'place' | 'food';
  title: string;
  coords: LatLng;
  color: PinColor;
  icon: IconName;
  live: boolean;
  locked: boolean;
  sub: string;
  free: boolean;
  weight: number;
  acc: AccessResult;
};

const INITIAL: Region = { ...ATHENS_CENTER, latitudeDelta: 0.06, longitudeDelta: 0.06 };

export default function MapScreen() {
  const { c, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { viewer, prefs, profile } = useApp();
  const now = useNow();
  const mapRef = useRef<MapView>(null);
  const [filters, setFilters] = useState<FilterKey[]>([]);
  const [stop, setStop] = useState(0);
  const [region, setRegion] = useState<Region>(INITIAL);
  const [selected, setSelected] = useState<string | null>(null);

  // Sample time for "is this place open" at each slider stop.
  const sampleTime = useMemo(() => {
    if (stop === 0) return now;
    if (stop === 1) {
      const t = startOfDay(now);
      t.setHours(Math.max(20, now.getHours()), 0, 0, 0);
      return t;
    }
    const sat = addDays(startOfDay(now), (6 - now.getDay() + 7) % 7);
    sat.setHours(13, 0, 0, 0);
    return sat;
  }, [stop, now]);

  const pins = useMemo<MapPin[]>(() => {
    const has = (k: FilterKey) => filters.includes(k);
    const kindFilters = filters.filter((f) => f === 'events' || f === 'trails' || f === 'food' || f === 'study');
    const want = (kind: 'event' | 'trail' | 'food' | 'study' | 'other') =>
      kindFilters.length === 0 ||
      (kind === 'event' && has('events')) ||
      (kind === 'trail' && has('trails')) ||
      (kind === 'food' && has('food')) ||
      (kind === 'study' && has('study'));

    const out: MapPin[] = [];
    const range = stop === 0 ? windowRange('now', now) : stop === 1 ? windowRange('tonight', now) : windowRange('weekend', now);

    if (want('event')) {
      getEvents({ viewer })
        .filter((l) => !l.item.isAway && overlaps(l.item.start, l.item.end, range))
        .forEach((l: Listed<AthensEvent>) => {
          const e = l.item;
          const live = stop === 0 && l.live;
          if (has('free') && e.price > 0) return;
          if (has('open') && !live) return;
          out.push({
            id: `e:${e.id}`,
            kind: 'event',
            title: e.title,
            coords: e.coords,
            color: 'brick',
            icon: CATEGORY_ICON[e.category],
            live,
            locked: !l.acc.canAttend,
            sub: `${whenLabel(e.start, e.end, now)} · ${e.venue}`,
            free: e.price === 0,
            weight: e.going,
            acc: l.acc,
          });
        });
    }

    getPlaces({ viewer }).forEach((l: Listed<Place>) => {
      const p = l.item;
      const isFood = p.kind === 'food';
      const isTrail = p.exploreCategories.some((x) => x === 'trails' || x === 'scenic');
      const isStudy = p.exploreCategories.includes('study') || !!p.foodTags?.includes('coffee');
      const kind = isFood ? 'food' : isTrail ? 'trail' : isStudy ? 'study' : 'other';
      const ok = want(kind) || (isStudy && has('study')) || (isFood && has('food'));
      if (!ok) return;
      if (kindFilters.length === 0 && !has('free') && !has('open') && p.foodKind === 'dining_hall' && viewer.mode !== 'student') return;
      const open = isOpenAt(p.hours, sampleTime);
      if (!open && stop > 0) return; // time slider: only what's open then
      if (has('open') && !open) return;
      if (has('free') && p.cost > 0) return;
      out.push({
        id: `p:${p.id}`,
        kind: isFood ? 'food' : 'place',
        title: p.name,
        coords: p.coords,
        color: isFood ? 'mustard' : 'ivy',
        icon: placeIcon(p),
        live: false,
        locked: !l.acc.canAttend,
        sub: `${openStatus(p.hours, sampleTime).label} · ${p.neighborhood}`,
        free: p.cost === 0,
        weight: 0,
        acc: l.acc,
      });
    });
    return out;
  }, [filters, stop, viewer, now, sampleTime]);

  // Heat glow: live / busy events, weighted by "going" + friends nearby.
  const heat = useMemo(() => {
    const evs = pins.filter((p) => p.kind === 'event' && !p.locked);
    const spots = evs.map((p) => ({ coords: p.coords, w: p.weight + (p.live ? 120 : 0) }));
    getFriends()
      .filter((f) => f.sharing)
      .forEach((f) => spots.push({ coords: f.coords, w: 40 }));
    return spots.filter((s) => s.w > 60).map((s, i) => ({ ...s, key: i, r: 160 + Math.min(320, s.w) }));
  }, [pins]);

  // Simple grid clustering when zoomed out.
  const clusters = useMemo(() => {
    const zoomedOut = region.latitudeDelta > 0.028;
    if (!zoomedOut) return pins.map((p) => ({ type: 'pin' as const, pin: p }));
    const cell = region.latitudeDelta / 9;
    const groups = new Map<string, MapPin[]>();
    pins.forEach((p) => {
      if (p.id === selected) {
        groups.set(p.id, [p]);
        return;
      }
      const key = `${Math.floor(p.coords.latitude / cell)}:${Math.floor(p.coords.longitude / cell)}`;
      groups.set(key, [...(groups.get(key) ?? []), p]);
    });
    return Array.from(groups.entries()).map(([key, g]) => {
      if (g.length === 1) return { type: 'pin' as const, pin: g[0] };
      const lat = g.reduce((s, p) => s + p.coords.latitude, 0) / g.length;
      const lng = g.reduce((s, p) => s + p.coords.longitude, 0) / g.length;
      const counts = { brick: 0, ivy: 0, mustard: 0, locked: 0 } as Record<PinColor, number>;
      g.forEach((p) => counts[p.color]++);
      const color = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as PinColor) ?? 'brick';
      return { type: 'cluster' as const, key, coords: { latitude: lat, longitude: lng }, count: g.length, color };
    });
  }, [pins, region.latitudeDelta, selected]);

  // Bottom sheet: selected pin + nearby pins to swipe through.
  const sheetPins = useMemo(() => {
    const sel = pins.find((p) => p.id === selected);
    if (!sel) return [];
    return [...pins].sort((a, b) => distanceKm(sel.coords, a.coords) - distanceKm(sel.coords, b.coords)).slice(0, 10);
  }, [pins, selected]);

  useEffect(() => {
    if (selected && !pins.find((p) => p.id === selected)) setSelected(null);
  }, [pins, selected]);

  const focus = useCallback((p: MapPin) => {
    mapRef.current?.animateToRegion({ latitude: p.coords.latitude - 0.004, longitude: p.coords.longitude, latitudeDelta: 0.018, longitudeDelta: 0.018 }, 350);
  }, []);

  const toggleFilter = (k: FilterKey) => setFilters((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]));

  const friends = getFriends().filter((f) => f.sharing);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL}
        onRegionChangeComplete={setRegion}
        showsPointsOfInterests={false}
        showsCompass={false}
        pitchEnabled={false}
        userInterfaceStyle={dark ? 'dark' : 'light'}
        onPress={() => setSelected(null)}
        accessibilityLabel="Map of Athens"
      >
        {heat.map((h) => (
          <Circle key={`h1-${h.key}`} center={h.coords} radius={h.r} fillColor="rgba(166,58,43,0.10)" strokeColor="rgba(0,0,0,0)" />
        ))}
        {heat.map((h) => (
          <Circle key={`h2-${h.key}`} center={h.coords} radius={h.r * 0.5} fillColor="rgba(217,166,46,0.16)" strokeColor="rgba(0,0,0,0)" />
        ))}

        {clusters.map((cl) =>
          cl.type === 'cluster' ? (
            <Marker
              key={cl.key}
              coordinate={cl.coords}
              onPress={(e) => {
                e.stopPropagation();
                haptic.tap();
                mapRef.current?.animateToRegion({ ...cl.coords, latitudeDelta: region.latitudeDelta / 3, longitudeDelta: region.longitudeDelta / 3 }, 350);
              }}
              accessibilityLabel={`${cl.count} places, tap to zoom in`}
            >
              <ClusterPin count={cl.count} color={cl.color} />
            </Marker>
          ) : (
            <Marker
              key={cl.pin.id}
              coordinate={cl.pin.coords}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={(e) => {
                e.stopPropagation();
                haptic.tap();
                setSelected(cl.pin.id);
                focus(cl.pin);
              }}
              accessibilityLabel={`${cl.pin.title}${cl.pin.live ? ', happening now' : ''}`}
              zIndex={cl.pin.id === selected ? 10 : cl.pin.live ? 5 : 1}
            >
              <Pin icon={cl.pin.icon} color={cl.pin.color} live={cl.pin.live} selected={cl.pin.id === selected} locked={cl.pin.locked} />
            </Marker>
          ),
        )}

        {stop === 0 &&
          friends.map((f) => (
            <Marker key={f.id} coordinate={f.coords} anchor={{ x: 0.5, y: 1 }} title={f.name} description={f.status} zIndex={20}>
              <FriendBubble initials={f.initials} color={f.color} />
            </Marker>
          ))}

        <Marker
          coordinate={MOCK_ME}
          anchor={{ x: 0.5, y: 1 }}
          title={prefs.ghostMode ? 'You (Ghost Mode)' : 'You'}
          description={prefs.ghostMode ? 'Friends can’t see you right now.' : 'Friends who follow you can see this.'}
          zIndex={30}
        >
          <FriendBubble initials={profile.name ? profile.name[0].toUpperCase() : 'ME'} color={palette.ink} ghost={prefs.ghostMode} />
        </Marker>
      </MapView>

      {/* Floating top: filter chips + avatar */}
      <View style={{ position: 'absolute', top: insets.top + 6, left: 0, right: 0 }} pointerEvents="box-none">
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 }} pointerEvents="box-none">
          <View style={{ flex: 1, backgroundColor: c.bg, borderWidth: 1.5, borderColor: c.lineStrong, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="flame" color={c.brick} size={18} />
            <Txt v="label" numberOfLines={1} style={{ flex: 1 }}>
              {pins.filter((p) => p.live).length} live · {pins.length} on the map
            </Txt>
          </View>
          <ProfileButton />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 14, paddingTop: 10 }}>
          {FILTERS.map((f) => (
            <View key={f.key} style={{ backgroundColor: filters.includes(f.key) ? 'transparent' : c.bg }}>
              <Chip label={f.label} icon={f.icon} active={filters.includes(f.key)} onPress={() => toggleFilter(f.key)} accent="ink" />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Re-center */}
      {!selected && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Re-center on me"
          onPress={() => {
            haptic.tap();
            mapRef.current?.animateToRegion({ ...MOCK_ME, latitudeDelta: 0.025, longitudeDelta: 0.025 }, 400);
          }}
          style={{ position: 'absolute', right: 14, bottom: 112, width: 48, height: 48, borderRadius: 24, backgroundColor: c.bg, borderWidth: 1.5, borderColor: c.lineStrong, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="locate" color={c.text} size={24} />
        </Pressable>
      )}

      {/* Time slider */}
      {!selected && <TimeSlider stop={stop} onChange={setStop} />}

      {/* Pin sheet */}
      {selected && sheetPins.length > 0 && (
        <PinSheet
          pins={sheetPins}
          onClose={() => setSelected(null)}
          onFocus={(p) => {
            setSelected(p.id);
            focus(p);
          }}
          transport={profile.transport}
          now={now}
        />
      )}
    </View>
  );
}

// ——— Time slider: drag now → tonight → this weekend ———

function TimeSlider({ stop, onChange }: { stop: number; onChange: (s: number) => void }) {
  const { c } = useTheme();
  const trackW = SW - 28 - 32;
  const x = useRef(new Animated.Value((stop / 2) * trackW)).current;
  const stopRef = useRef(stop);
  stopRef.current = stop;
  const startX = useRef(0);

  useEffect(() => {
    Animated.spring(x, { toValue: (stop / 2) * trackW, useNativeDriver: false, bounciness: 8 }).start();
  }, [stop, trackW, x]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startX.current = (stopRef.current / 2) * trackW;
      },
      onPanResponderMove: (_, g) => {
        const nx = Math.max(0, Math.min(trackW, startX.current + g.dx));
        x.setValue(nx);
        const s = Math.round((nx / trackW) * 2);
        if (s !== stopRef.current) {
          haptic.tap();
          onChange(s);
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(x, { toValue: (stopRef.current / 2) * trackW, useNativeDriver: false, bounciness: 10 }).start();
      },
    }),
  ).current;

  return (
    <View
      style={{ position: 'absolute', left: 14, right: 14, bottom: 14, backgroundColor: c.bg, borderWidth: 1.5, borderColor: c.lineStrong, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Time"
      accessibilityValue={{ text: STOPS[stop] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(Math.max(0, Math.min(2, stop + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        {STOPS.map((s, i) => (
          <Pressable key={s} onPress={() => onChange(i)} hitSlop={8}>
            <Txt v="labelSm" color={i === stop ? c.brick : c.textMuted}>
              {s}
            </Txt>
          </Pressable>
        ))}
      </View>
      <View style={{ height: 24, justifyContent: 'center' }} {...pan.panHandlers}>
        <View style={{ height: 3, backgroundColor: c.line }} />
        <View style={{ position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
          {STOPS.map((s) => (
            <View key={s} style={{ width: 2, height: 12, backgroundColor: c.lineStrong }} />
          ))}
        </View>
        <Animated.View
          style={{
            position: 'absolute',
            left: -12,
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: c.brickFill,
            borderWidth: 2.5,
            borderColor: c.bg,
            transform: [{ translateX: x }],
            shadowColor: palette.ink,
            shadowOpacity: 0.4,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
          }}
        />
      </View>
    </View>
  );
}

// ——— Draggable pin sheet; swipe sideways for nearby pins ———

function PinSheet({
  pins,
  onClose,
  onFocus,
  transport,
  now,
}: {
  pins: MapPin[];
  onClose: () => void;
  onFocus: (p: MapPin) => void;
  transport: 'walk' | 'bike' | 'car' | 'bus';
  now: Date;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(320)).current;
  const listRef = useRef<FlatList<MapPin>>(null);
  const cardW = SW - 28;

  useEffect(() => {
    Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 8, speed: 14 }).start();
  }, [y]);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [pins[0]?.id]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderMove: (_, g) => y.setValue(Math.max(-30, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 90 || g.vy > 1) Animated.timing(y, { toValue: 360, duration: 180, useNativeDriver: true }).start(onClose);
        else Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 10 }).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      {...pan.panHandlers}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: 12, transform: [{ translateY: y }] }}
    >
      <View style={{ alignItems: 'center', paddingVertical: 6 }}>
        <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: c.bg, borderWidth: 1, borderColor: c.lineStrong }} />
      </View>
      <FlatList
        ref={listRef}
        horizontal
        data={pins}
        keyExtractor={(p) => p.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardW + 10}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 14, gap: 10 }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / (cardW + 10));
          const p = pins[i];
          if (p && i > 0) {
            haptic.tap();
            onFocus(p);
          }
        }}
        renderItem={({ item: p, index }) => (
          <View style={{ width: cardW, backgroundColor: c.bg, borderWidth: 1.5, borderColor: c.lineStrong, padding: 14, gap: 6, opacity: p.locked ? 0.7 : 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pin icon={p.icon} color={p.color} live={false} locked={p.locked} />
              <View style={{ flex: 1, marginLeft: -18 }}>
                <Txt v="labelSm" color={c.brick}>
                  {index === 0 ? 'Selected' : `Nearby · ${fmtDistance(distanceKm(pins[0].coords, p.coords))} away`}
                </Txt>
                <Txt v="serif" numberOfLines={1}>
                  {p.title}
                </Txt>
                <Txt v="bodySm" muted numberOfLines={1}>
                  {p.sub}
                </Txt>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              {p.live && <Stamp kind="live" animate={false} />}
              <Stamp kind={p.acc.stamp} text={p.locked ? p.acc.lockReason : undefined} animate={false} />
              {p.acc.perk && <Stamp kind="perk" animate={false} />}
            </View>
            {!p.locked && <TravelBadges from={MOCK_ME} to={p.coords} showCar />}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6, marginBottom: Math.max(0, insets.bottom - 20) }}>
              <Button
                small
                kind="secondary"
                label="Details"
                onPress={() => router.push(p.kind === 'event' ? `/event/${p.id.slice(2)}` : `/place/${p.id.slice(2)}`)}
                style={{ flex: 1 }}
              />
              {!p.locked && <Button small label="Let’s go" icon="directions" onPress={() => openDirections(p.coords, p.title, transport)} style={{ flex: 1 }} />}
            </View>
            {index === 0 && pins.length > 1 && (
              <Txt v="caption" muted center>
                Swipe for {pins.length - 1} more nearby · {fmtTime(now)}
              </Txt>
            )}
          </View>
        )}
      />
    </Animated.View>
  );
}
