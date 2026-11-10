// FOOD — open now, cheap eats, late night, deals by day, trucks, dining halls,
// and a discreet food-resources section.
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { TabHeader } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { EmptyState, FreshStamp, useStampRefresh } from '@/components/misc';
import { PlaceCard } from '@/components/PlaceCard';
import { Stamp } from '@/components/Stamp';
import { Chip, Paper, SectionHeader, Txt } from '@/components/ui';
import type { FoodTag } from '@/data/types';
import { haptic } from '@/lib/feedback';
import { useNow } from '@/lib/hooks';
import { DAY_SHORT, hoursLabel } from '@/lib/time';
import { getDealsForDay, getFoodResources, getPlace, getPlaces, type PlaceFilters } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, palette } from '@/theme/tokens';

type QuickKey = 'open' | 'cheap' | 'late' | 'deals' | 'coffee' | 'sweet' | 'healthy';
const QUICK: { key: QuickKey; label: string }[] = [
  { key: 'open', label: 'Open now' },
  { key: 'cheap', label: 'Cheap eats <$10' },
  { key: 'late', label: 'Late night' },
  { key: 'deals', label: 'Deals today' },
  { key: 'coffee', label: 'Coffee & study' },
  { key: 'sweet', label: 'Sweet stuff' },
  { key: 'healthy', label: 'Healthy' },
];
const DIETARY: { key: FoodTag; label: string }[] = [
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'gf', label: 'Gluten-free' },
  { key: 'halal', label: 'Halal' },
];

export default function FoodScreen() {
  const { c } = useTheme();
  const { viewer, prefs, setPrefs } = useApp();
  const now = useNow();
  const [quick, setQuick] = useState<QuickKey[]>([]);
  const [diet, setDiet] = useState<FoodTag[]>([]);
  const [showDiet, setShowDiet] = useState(false);
  const [dealDay, setDealDay] = useState(now.getDay());
  const [tick, setTick] = useState(0);
  const { control, stampKey } = useStampRefresh(() => setTick((t) => t + 1));

  const has = (k: QuickKey) => quick.includes(k);
  const toggle = (k: QuickKey) => setQuick((q) => (q.includes(k) ? q.filter((x) => x !== k) : [...q, k]));
  const filtering = quick.length > 0 || diet.length > 0;

  const results = useMemo(() => {
    const tags: FoodTag[] = [...diet];
    if (has('late')) tags.push('late');
    if (has('coffee')) tags.push('coffee');
    if (has('sweet')) tags.push('sweet');
    if (has('healthy')) tags.push('healthy');
    const f: PlaceFilters = { viewer, kind: 'food', foodTags: tags, openNow: has('open'), maxPrice: has('cheap') ? 10 : undefined };
    let r = getPlaces(f);
    if (has('deals')) r = r.filter((l) => l.item.deals?.some((d) => d.day === now.getDay()));
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quick, diet, viewer, tick]);

  const deals = getDealsForDay(dealDay, viewer);
  const trucks = getPlaces({ viewer, kind: 'food', foodKind: 'truck' });
  const halls = getPlaces({ viewer, kind: 'food', foodKind: 'dining_hall' });
  const restaurants = getPlaces({ viewer, kind: 'food' }).filter((l) => l.item.foodKind === 'restaurant' || l.item.foodKind === 'cafe');
  const market = getPlace('athens-farmers-market');
  const resources = getFoodResources(viewer);

  return (
    <Paper>
      <FreshStamp stampKey={stampKey} />
      <ScrollView refreshControl={control} contentContainerStyle={{ paddingBottom: 40 }}>
        <TabHeader
          title="Food"
          subtitle={
            <Txt v="bodySm" muted style={{ marginTop: 2 }}>
              Cheap, late, local. Hours and deals are sample data.
            </Txt>
          }
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 16 }}>
          {QUICK.map((q) => (
            <Chip key={q.key} label={q.label} active={has(q.key)} onPress={() => toggle(q.key)} />
          ))}
          <Chip
            label={diet.length ? `Dietary · ${diet.length}` : 'Dietary'}
            icon="leaf"
            active={showDiet || diet.length > 0}
            onPress={() => setShowDiet(!showDiet)}
            accent="ivy"
          />
        </ScrollView>
        {showDiet && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingTop: 10 }}>
            {DIETARY.map((d) => (
              <Chip
                key={d.key}
                small
                label={d.label}
                accent="ivy"
                active={diet.includes(d.key)}
                onPress={() => setDiet((x) => (x.includes(d.key) ? x.filter((y) => y !== d.key) : [...x, d.key]))}
              />
            ))}
          </View>
        )}

        {filtering ? (
          <>
            <SectionHeader title="Results" kicker={`${results.length} spots`} />
            <View style={{ paddingHorizontal: 20, gap: 22 }}>
              {results.length ? (
                results.map((l) => <PlaceCard key={l.item.id} place={l.item} acc={l.acc} km={l.km} now={now} />)
              ) : (
                <EmptyState icon="food" title="Nothing matches that combo." body="Nothing open this late? The Waffle House on Broad never closes, though." />
              )}
            </View>
          </>
        ) : (
          <>
            {/* Deals by day */}
            <SectionHeader title="Deals by day" kicker="Clip ’em" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}>
              {Array.from({ length: 7 }, (_, i) => (now.getDay() + i) % 7).map((d) => {
                const on = d === dealDay;
                return (
                  <Pressable
                    key={d}
                    onPress={() => {
                      haptic.tap();
                      setDealDay(d);
                    }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={d === now.getDay() ? 'Today' : DAY_SHORT[d]}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderWidth: 1.5,
                      borderColor: c.lineStrong,
                      backgroundColor: on ? c.mustard : c.surface,
                    }}
                  >
                    <Txt v="label" color={on ? palette.ink : c.text}>
                      {d === now.getDay() ? 'Today' : DAY_SHORT[d]}
                    </Txt>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={{ paddingHorizontal: 20, gap: 10, marginTop: 12 }}>
              {deals.length ? (
                deals.map((d) => (
                  <Pressable
                    key={d.place.id + d.text}
                    onPress={() => router.push(`/place/${d.place.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`${d.place.name}: ${d.text}`}
                    style={{
                      flexDirection: 'row',
                      borderWidth: 1.5,
                      borderStyle: 'dashed',
                      borderColor: c.lineStrong,
                      backgroundColor: c.surface,
                      opacity: d.acc.canAttend ? 1 : 0.5,
                    }}
                  >
                    <View style={{ width: 8, backgroundColor: c.mustard }} />
                    <View style={{ flex: 1, padding: 12 }}>
                      <Txt v="labelSm" color={c.brick}>
                        {d.place.name}
                      </Txt>
                      <Txt v="serif">{d.text.replace(/^\w+day: /, '')}</Txt>
                    </View>
                    <View style={{ justifyContent: 'center', paddingRight: 12 }}>
                      <Icon name="tag" color={c.textMuted} size={20} />
                    </View>
                  </Pressable>
                ))
              ) : (
                <Txt v="bodySm" muted>
                  No deals listed for {DAY_SHORT[dealDay]}. Try Tuesday, everyone loves Tuesday.
                </Txt>
              )}
            </View>

            {/* Farmers market */}
            {market && (
              <>
                <SectionHeader title="Farmers market" kicker="Saturdays + Wednesdays" />
                <Pressable
                  onPress={() => router.push(`/place/${market.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${market.name}. ${market.season}`}
                  style={{ marginHorizontal: 20, backgroundColor: palette.ivy, padding: 18, borderWidth: 1.5, borderColor: c.lineStrong }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Icon name="basket" color={palette.mustard} size={36} />
                    <Stamp kind="free" text="SNAP doubled" rotate={6} />
                  </View>
                  <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 28, color: palette.paper, marginTop: 10 }}>{market.name}</Txt>
                  <Txt v="body" color="#DCE3DD" style={{ marginTop: 4 }}>
                    Sat 8am–noon at Bishop Park · Wed 4–7pm downtown
                  </Txt>
                  <Txt v="caption" color="#DCE3DD" style={{ marginTop: 6 }}>
                    Season: {market.season} · Today: {hoursLabel(market.hours, now)}
                  </Txt>
                </Pressable>
              </>
            )}

            {/* Trucks */}
            <SectionHeader title="Food trucks" kicker="Spotted today" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingTop: 8 }}>
              {trucks.map((l) => (
                <View key={l.item.id} style={{ width: 240 }}>
                  <PlaceCard place={l.item} acc={l.acc} km={l.km} now={now} compact />
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 8 }}>
                    <Icon name="pin" color={c.brick} size={15} />
                    <Txt v="caption" color={c.brick} style={{ flex: 1 }}>
                      {l.item.spottedToday}
                    </Txt>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Dining halls */}
            <SectionHeader title="Dining halls" kicker="UGA meal plan" />
            {halls.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingTop: 8 }}>
                {halls.map((l) => (
                  <PlaceCard key={l.item.id} place={l.item} acc={l.acc} km={l.km} now={now} width={240} compact />
                ))}
              </ScrollView>
            ) : (
              <Pressable
                onPress={() => setPrefs({ showUgaOnly: true })}
                accessibilityRole="button"
                style={{ marginHorizontal: 20, flexDirection: 'row', gap: 8, alignItems: 'center' }}
              >
                <Icon name="lock" color={c.textMuted} size={16} />
                <Txt v="bodySm" muted style={{ flex: 1 }}>
                  Dining halls need a UGA ID, so they’re hidden in {viewer.mode === 'local' ? 'Local' : 'Visitor'} mode.{' '}
                  <Txt v="bodySm" color={c.brick}>
                    {prefs.showUgaOnly ? '' : 'Show them anyway (locked)'}
                  </Txt>
                </Txt>
              </Pressable>
            )}

            {/* Restaurants & cafes */}
            <SectionHeader title="Restaurants & cafes" kicker="Closest first" />
            <View style={{ paddingHorizontal: 20, gap: 22, paddingTop: 6 }}>
              {restaurants.map((l) => (
                <PlaceCard key={l.item.id} place={l.item} acc={l.acc} km={l.km} now={now} />
              ))}
            </View>
          </>
        )}

        {/* Food resources — calm, plain, no stigma */}
        <View style={{ marginHorizontal: 20, marginTop: 32, paddingTop: 18, borderTopWidth: 1.5, borderColor: c.line }}>
          <Txt v="label">Food resources</Txt>
          <Txt v="bodySm" muted style={{ marginTop: 4, marginBottom: 12 }}>
            Groceries and meals, free. Everybody needs a hand sometimes.
          </Txt>
          {resources.map(({ item: r, acc }) => (
            <View
              key={r.id}
              style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: c.line, flexDirection: 'row', gap: 10 }}
              accessible
              accessibilityLabel={`${r.name}. ${r.detail}. ${r.hours}.${acc.canAttend ? '' : ' UGA ID required.'}`}
            >
              <Icon name={r.access === 'uga_id' ? 'arch' : 'heart'} color={c.ivy} size={20} />
              <View style={{ flex: 1 }}>
                <Txt v="bodyBold">{r.name}</Txt>
                <Txt v="bodySm" muted>
                  {r.detail}
                </Txt>
                <Txt v="caption" muted style={{ marginTop: 2 }}>
                  {r.hours}
                  {r.access === 'uga_id' ? ' · UGA students' : ' · Open to everyone'}
                </Txt>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Paper>
  );
}
