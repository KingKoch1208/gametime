// EVENTS — category sections, filter sheet, list ↔ calendar-strip toggle.
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { TabHeader } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { EmptyState, FreshStamp, useStampRefresh } from '@/components/misc';
import { TicketCard, TicketSkeleton } from '@/components/TicketCard';
import { Button, Chip, IconButton, Paper, Segmented, ToggleRow, Txt } from '@/components/ui';
import type { EventCategory } from '@/data/types';
import { useNow } from '@/lib/hooks';
import { addDays, DAY_SHORT, MONTH_SHORT, sameDay, startOfDay, type TimeWindow } from '@/lib/time';
import { type EventFilters, getEvents } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

const CATS: { key: EventCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'concerts', label: 'Concerts' },
  { key: 'sports', label: 'Sports' },
  { key: 'shows', label: 'Shows & Movies' },
  { key: 'campus', label: 'Campus' },
  { key: 'community', label: 'Community' },
  { key: 'outdoors', label: 'Outdoors' },
  { key: 'arts', label: 'Arts' },
  { key: 'volunteer', label: 'Volunteer' },
];

type F = {
  freeOnly: boolean;
  openToMe: boolean;
  walkable: boolean;
  setting: 'any' | 'indoor' | 'outdoor';
  allAges: boolean;
  soberFriendly: boolean;
  accessible: boolean;
  petFriendly: boolean;
  carFree: boolean;
  maxPrice: 'any' | '0' | '10' | '25';
  window: TimeWindow;
};

const DEFAULT_F: F = {
  freeOnly: false,
  openToMe: false,
  walkable: false,
  setting: 'any',
  allAges: false,
  soberFriendly: false,
  accessible: false,
  petFriendly: false,
  carFree: false,
  maxPrice: 'any',
  window: 'twoWeeks',
};

export default function EventsScreen() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ free?: string; cat?: string }>();
  const { viewer, prefs, setPrefs, profile } = useApp();
  const now = useNow();
  const [cat, setCat] = useState<EventCategory | 'all'>('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [day, setDay] = useState<Date>(startOfDay(now));
  const [f, setF] = useState<F>(DEFAULT_F);
  const [sheet, setSheet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const { control, stampKey } = useStampRefresh(() => setTick((t) => t + 1));

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (params.free) setF((x) => ({ ...x, freeOnly: true, window: 'week' }));
    if (params.cat) setCat(params.cat as EventCategory);
  }, [params.free, params.cat]);

  const query: EventFilters = {
    viewer,
    categories: cat === 'all' ? undefined : [cat],
    window: view === 'calendar' ? undefined : f.window,
    day: view === 'calendar' ? day : undefined,
    freeOnly: f.freeOnly,
    openToMe: f.openToMe,
    walkable: f.walkable,
    setting: f.setting === 'any' ? null : f.setting,
    allAges: f.allAges,
    soberFriendly: f.soberFriendly,
    accessible: f.accessible,
    petFriendly: f.petFriendly,
    carFree: f.carFree,
    maxPrice: f.maxPrice === 'any' ? null : Number(f.maxPrice),
    includeAway: cat === 'sports',
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const list = useMemo(() => getEvents(query), [JSON.stringify({ ...query, viewer: undefined, day: query.day?.toDateString() }), viewer, tick]);

  const activeCount = Object.entries(f).filter(([k, v]) => v !== (DEFAULT_F as Record<string, unknown>)[k]).length;
  const days = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(now), i));
  const hiddenUga = viewer.mode !== 'student' && !prefs.showUgaOnly;

  return (
    <Paper>
      <FreshStamp stampKey={stampKey} />
      <FlatList
        data={loading ? [] : list}
        keyExtractor={(l) => l.item.id}
        refreshControl={control}
        contentContainerStyle={{ paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListHeaderComponent={
          <View>
            <TabHeader
              title="Events"
              right={<IconButton icon={view === 'list' ? 'calendar' : 'list'} label={view === 'list' ? 'Show calendar strip' : 'Show list'} onPress={() => setView((v) => (v === 'list' ? 'calendar' : 'list'))} />}
              subtitle={
                <Txt v="bodySm" muted style={{ marginTop: 2 }}>
                  {list.length} things over the next two weeks, filtered for {profile.mode === 'student' ? 'a UGA student' : profile.mode === 'local' ? 'an Athens local' : 'a visitor'}.
                </Txt>
              }
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 16 }}>
              {CATS.map((ct) => (
                <Chip key={ct.key} label={ct.label} active={cat === ct.key} onPress={() => setCat(ct.key)} />
              ))}
            </ScrollView>

            {view === 'calendar' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 14 }}>
                {days.map((d) => {
                  const on = sameDay(d, day);
                  const n = getEvents({ ...query, day: d, window: undefined }).length;
                  return (
                    <Pressable
                      key={d.toISOString()}
                      onPress={() => setDay(d)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${DAY_SHORT[d.getDay()]} ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${n} events`}
                      style={{ width: 56, paddingVertical: 8, alignItems: 'center', borderWidth: 1.5, borderColor: c.lineStrong, backgroundColor: on ? c.text : c.surface }}
                    >
                      <Txt v="labelSm" color={on ? c.bg : c.textMuted}>
                        {sameDay(d, now) ? 'Today' : DAY_SHORT[d.getDay()]}
                      </Txt>
                      <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 22, color: on ? c.bg : c.text }} maxFontSizeMultiplier={1.2}>
                        {d.getDate()}
                      </Txt>
                      <View style={{ flexDirection: 'row', gap: 2, height: 5 }}>
                        {Array.from({ length: Math.min(n, 4) }).map((_, i) => (
                          <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: on ? c.mustard : c.brick }} />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 }}>
              <Button small kind="secondary" icon="sliders" label={activeCount ? `Filters · ${activeCount}` : 'Filters'} onPress={() => setSheet(true)} />
              <Chip small label="Free" active={f.freeOnly} onPress={() => setF({ ...f, freeOnly: !f.freeOnly })} accent="ivy" />
              <Chip small label="Open to me" active={f.openToMe} onPress={() => setF({ ...f, openToMe: !f.openToMe })} accent="ivy" />
              <Chip small label="Sober-friendly" active={f.soberFriendly} onPress={() => setF({ ...f, soberFriendly: !f.soberFriendly })} accent="ivy" />
            </View>
            {hiddenUga && (
              <Pressable
                onPress={() => setPrefs({ showUgaOnly: true })}
                accessibilityRole="button"
                accessibilityLabel="Some UGA-only events are hidden. Tap to show them greyed out."
                style={{ marginHorizontal: 20, marginBottom: 14, flexDirection: 'row', gap: 8, alignItems: 'center' }}
              >
                <Icon name="lock" color={c.textMuted} size={15} />
                <Txt v="caption" muted style={{ flex: 1 }}>
                  UGA-ID-only events are hidden. <Txt v="caption" color={c.brick}>Show them (locked)</Txt>
                </Txt>
              </Pressable>
            )}
            {loading && (
              <View style={{ paddingHorizontal: 20, gap: 14 }}>
                <TicketSkeleton />
                <TicketSkeleton />
                <TicketSkeleton />
              </View>
            )}
          </View>
        }
        renderItem={({ item: l }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <TicketCard event={l.item} acc={l.acc} km={l.km} live={l.live} now={now} />
            {l.item.watchPartyIds && (
              <Txt v="caption" color={c.brick} style={{ marginTop: 6, marginLeft: 4 }}>
                Away game · {l.item.watchPartyIds.length} watch parties in Athens →
              </Txt>
            )}
          </View>
        )}
        ListEmptyComponent={
          loading ? undefined : (
            <EmptyState
              icon="ticket"
              title="Nothing matches. Yet."
              body={view === 'calendar' ? 'Slow day on the poles. Try another day, or loosen the filters.' : 'Too many filters? Even the 40 Watt takes a night off sometimes.'}
            />
          )
        }
      />

      <BottomSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title="Filter events"
        footer={
          <View style={{ flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1.5, borderColor: c.line }}>
            <Button kind="secondary" label="Reset" onPress={() => setF(DEFAULT_F)} style={{ flex: 1 }} />
            <Button label={`Show ${list.length}`} onPress={() => setSheet(false)} style={{ flex: 2 }} />
          </View>
        }
      >
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Txt v="label" style={{ marginTop: 8, marginBottom: 8 }}>
            When
          </Txt>
          <Segmented
            value={f.window}
            onChange={(window) => setF({ ...f, window })}
            options={[
              { value: 'tonight', label: 'Tonight' },
              { value: 'weekend', label: 'Weekend' },
              { value: 'week', label: 'Week' },
              { value: 'twoWeeks', label: '2 wks' },
            ]}
          />
          <Txt v="label" style={{ marginTop: 18, marginBottom: 8 }}>
            Price
          </Txt>
          <Segmented
            value={f.maxPrice}
            onChange={(maxPrice) => setF({ ...f, maxPrice, freeOnly: maxPrice === '0' })}
            options={[
              { value: '0', label: 'Free' },
              { value: '10', label: '≤ $10' },
              { value: '25', label: '≤ $25' },
              { value: 'any', label: 'Any' },
            ]}
          />
          <Txt v="label" style={{ marginTop: 18, marginBottom: 8 }}>
            Setting
          </Txt>
          <Segmented
            value={f.setting}
            onChange={(setting) => setF({ ...f, setting })}
            options={[
              { value: 'any', label: 'Either' },
              { value: 'indoor', label: 'Indoor' },
              { value: 'outdoor', label: 'Outdoor' },
            ]}
          />
          <View style={{ marginTop: 10 }}>
            <ToggleRow icon="lock" label="Open to me" hint="Hide anything I can't get into" value={f.openToMe} onChange={(openToMe) => setF({ ...f, openToMe })} />
            <ToggleRow icon="tag" label="Free only" value={f.freeOnly} onChange={(freeOnly) => setF({ ...f, freeOnly })} />
            <ToggleRow icon="walk" label="Walkable" hint="Within ~20 minutes on foot" value={f.walkable} onChange={(walkable) => setF({ ...f, walkable })} />
            <ToggleRow icon="bike" label="Car-free picks" hint="Easy by foot, bike or bus" value={f.carFree} onChange={(carFree) => setF({ ...f, carFree })} />
            <ToggleRow icon="family" label="All-ages" value={f.allAges} onChange={(allAges) => setF({ ...f, allAges })} />
            <ToggleRow icon="coffee" label="Sober-friendly" hint="Not built around a bar" value={f.soberFriendly} onChange={(soberFriendly) => setF({ ...f, soberFriendly })} />
            <ToggleRow icon="accessible" label="Accessible venue" value={f.accessible} onChange={(accessible) => setF({ ...f, accessible })} />
            <ToggleRow icon="paw" label="Pet-friendly" value={f.petFriendly} onChange={(petFriendly) => setF({ ...f, petFriendly })} />
            {viewer.mode !== 'student' && (
              <ToggleRow icon="lock" label="Show UGA-only stuff" hint="Shown greyed out with a lock" value={prefs.showUgaOnly} onChange={(showUgaOnly) => setPrefs({ showUgaOnly })} />
            )}
          </View>
        </ScrollView>
      </BottomSheet>
    </Paper>
  );
}
