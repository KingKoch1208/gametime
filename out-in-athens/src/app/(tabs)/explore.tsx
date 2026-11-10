// EXPLORE — always-available stuff: trails, museums, study spots, courts…
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';

import { GuideCover } from '@/components/GuideCover';
import { TabHeader } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { CATEGORY_ICON, Icon } from '@/components/Icon';
import { EmptyState, FreshStamp, useStampRefresh } from '@/components/misc';
import { PlaceCard } from '@/components/PlaceCard';
import { Chip, Paper, SectionHeader, Txt } from '@/components/ui';
import type { ExploreCategory } from '@/data/types';
import { useNow } from '@/lib/hooks';
import { getGuides, getPlaces } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { palette } from '@/theme/tokens';
import { BADGES, badgeProgress } from '@/lib/passport';

const CATS: { key: ExploreCategory; label: string }[] = [
  { key: 'trails', label: 'Trails & parks' },
  { key: 'museums', label: 'Museums & galleries' },
  { key: 'study', label: 'Libraries & study' },
  { key: 'courts', label: 'Courts & fields' },
  { key: 'gyms', label: 'Gyms & rec' },
  { key: 'records', label: 'Records & thrift' },
  { key: 'scenic', label: 'Scenic spots' },
  { key: 'volunteer', label: 'Volunteer spots' },
  { key: 'free', label: 'Free stuff' },
];

export default function ExploreScreen() {
  const { c } = useTheme();
  const { viewer, checkins } = useApp();
  const now = useNow();
  const [cat, setCat] = useState<ExploreCategory | null>(null);
  const [q, setQ] = useState('');
  const [carFree, setCarFree] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [tick, setTick] = useState(0);
  const { control, stampKey } = useStampRefresh(() => setTick((t) => t + 1));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const places = useMemo(() => getPlaces({ viewer, kind: 'place', category: cat, carFree, openNow, query: q }), [viewer, cat, carFree, openNow, tick, q]);
  const stamps = Object.keys(checkins).length;
  const nextBadge = BADGES.map((b) => ({ b, p: badgeProgress(b, checkins) })).find((x) => x.p.have < x.p.need);

  return (
    <Paper>
      <FreshStamp stampKey={stampKey} />
      <FlatList
        data={places}
        keyExtractor={(l) => l.item.id}
        refreshControl={control}
        contentContainerStyle={{ paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View style={{ height: 22 }} />}
        ListHeaderComponent={
          <View>
            <TabHeader
              title="Explore"
              subtitle={
                <Txt v="bodySm" muted style={{ marginTop: 2 }}>
                  The always-there stuff. Trails, museums, courts, quiet corners.
                </Txt>
              }
            />
            <SearchBar value={q} onChange={setQ} placeholder="Search places, neighborhoods…" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8, marginTop: 18 }}>
              {CATS.map((ct, i) => {
                const on = cat === ct.key;
                return (
                  <Pressable
                    key={ct.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={ct.label}
                    onPress={() => setCat(on ? null : ct.key)}
                    style={({ pressed }) => ({
                      width: '31.6%',
                      aspectRatio: 1,
                      borderWidth: 1.5,
                      borderColor: c.lineStrong,
                      backgroundColor: on ? c.ivyFill : c.surface,
                      padding: 10,
                      justifyContent: 'space-between',
                      transform: [{ rotate: on ? `${i % 2 ? 1.5 : -1.5}deg` : '0deg' }, { scale: pressed ? 0.96 : 1 }],
                    })}
                  >
                    <Icon name={CATEGORY_ICON[ct.key]} color={on ? palette.paper : c.text} size={30} strokeWidth={1.6} />
                    <Txt v="labelSm" color={on ? palette.paper : c.text} numberOfLines={2}>
                      {ct.label}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => router.push('/passport')}
              accessibilityRole="button"
              accessibilityLabel={`Athens Passport. ${stamps} stamps.`}
              style={{
                marginHorizontal: 20,
                marginTop: 20,
                backgroundColor: palette.ivy,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                borderWidth: 1.5,
                borderColor: c.lineStrong,
              }}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  borderWidth: 2,
                  borderColor: palette.mustard,
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ rotate: '-8deg' }],
                }}
              >
                <Icon name="passport" color={palette.mustard} size={28} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="label" color={palette.mustard}>
                  Athens Passport
                </Txt>
                <Txt v="title" color={palette.paper}>
                  {stamps} stamp{stamps === 1 ? '' : 's'} collected
                </Txt>
                {nextBadge && (
                  <Txt v="caption" color="#CFD8D0">
                    {nextBadge.p.need - nextBadge.p.have} more for “{nextBadge.b.name}”
                  </Txt>
                )}
              </View>
              <Icon name="chevronRight" color={palette.paper} size={22} />
            </Pressable>

            <SectionHeader title="Curated guides" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {getGuides(viewer.mode).map((g) => (
                <GuideCover key={g.id} guide={g} />
              ))}
            </ScrollView>

            <SectionHeader title={cat ? CATS.find((x) => x.key === cat)!.label : 'All spots'} />
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 }}>
              <Chip small icon="clock" label="Open now" active={openNow} onPress={() => setOpenNow(!openNow)} accent="ivy" />
              <Chip small icon="bike" label="Car-free picks" active={carFree} onPress={() => setCarFree(!carFree)} accent="ivy" />
            </View>
          </View>
        }
        renderItem={({ item: l }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <PlaceCard place={l.item} acc={l.acc} km={l.km} now={now} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="trail" title="Nothing open in this corner right now." body="Most trails close at dusk. The Arch is open 24/7, though." />
        }
      />
    </Paper>
  );
}
