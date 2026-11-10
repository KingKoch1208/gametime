// ATHENS PASSPORT — passport-book UI with stamps and badges.
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StackHeader } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { placeIcon } from '@/components/PlaceCard';
import { ProgressRing } from '@/components/ProgressRing';
import { Paper, Txt } from '@/components/ui';
import { ATHENS_101, BUCKET_GROUPS } from '@/data/athens101';
import { haptic } from '@/lib/feedback';
import { BADGES, badgeProgress } from '@/lib/passport';
import { getPlace, getPlaces } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { accentFill, fonts, palette } from '@/theme/tokens';

export default function PassportScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { viewer, checkins, done101 = [], toggle101 } = useApp();
  // Every place you could visit is a slot in the book.
  const slots = getPlaces({ viewer, openToMe: true })
    .map((l) => l.item)
    .filter((p) => p.foodKind !== 'truck');
  const count = Object.keys(checkins).length;
  const isDone = (id: string, placeId?: string) => (placeId ? !!checkins[placeId] : done101.includes(id));
  const done101Count = ATHENS_101.filter((b) => isDone(b.id, b.placeId)).length;

  return (
    <Paper>
      <StackHeader title="Passport" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Cover */}
        <View style={{ margin: 20, backgroundColor: palette.ivy, padding: 24, borderWidth: 1.5, borderColor: c.lineStrong, alignItems: 'center', gap: 10 }}>
          <View
            style={{ width: 86, height: 86, borderRadius: 43, borderWidth: 2, borderColor: palette.mustard, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="arch" color={palette.mustard} size={46} strokeWidth={1.5} />
          </View>
          <Txt style={{ fontFamily: fonts.label, fontSize: 13, letterSpacing: 4, color: palette.mustard }}>CLASSIC CITY</Txt>
          <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 34, color: palette.mustard, letterSpacing: -0.5 }} accessibilityRole="header">
            Athens Passport
          </Txt>
          <Txt v="bodySm" color="#DCE3DD" center>
            {count} of {slots.length} stamps · check in anywhere to collect
          </Txt>
        </View>

        {/* The Athens 101 */}
        <View style={{ marginHorizontal: 20, marginBottom: 24, borderWidth: 1.5, borderColor: c.lineStrong, backgroundColor: c.surface, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <ProgressRing value={done101Count / ATHENS_101.length} size={52} color={c.ivyFill} icon="list" label="Athens 101" />
            <View style={{ flex: 1 }}>
              <Txt v="title" accessibilityRole="header">
                The Athens 101
              </Txt>
              <Txt v="caption" muted>
                {done101Count} of {ATHENS_101.length} done · grouped like UGA Housing’s “101 Things to Do in Athens” (sample picks)
              </Txt>
            </View>
          </View>
          {BUCKET_GROUPS.map((g) => (
            <View key={g} style={{ marginTop: 14 }}>
              <Txt v="labelSm" muted style={{ marginBottom: 4 }}>
                {g}
              </Txt>
              {ATHENS_101.filter((b) => b.group === g).map((b) => {
                const done = isDone(b.id, b.placeId);
                const place = b.placeId ? getPlace(b.placeId) : undefined;
                return (
                  <Pressable
                    key={b.id}
                    accessibilityRole={place ? 'link' : 'checkbox'}
                    accessibilityState={place ? undefined : { checked: done }}
                    accessibilityLabel={`${b.text}${done ? ', done' : ''}${place && !done ? '. Check in to tick it off' : ''}`}
                    onPress={() => {
                      haptic.tap();
                      if (place) router.push(`/place/${place.id}`);
                      else toggle101(b.id);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, borderBottomWidth: 1, borderColor: c.line }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderWidth: 1.5,
                        borderColor: done ? c.ivy : c.lineStrong,
                        backgroundColor: done ? c.ivyFill : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {done && <Icon name="check" color={palette.paper} size={14} strokeWidth={2.6} />}
                    </View>
                    <Txt v="bodySm" style={{ flex: 1, textDecorationLine: done ? 'line-through' : 'none' }} muted={done}>
                      {b.text}
                    </Txt>
                    {place && !done && (
                      <Txt v="labelSm" color={c.brick}>
                        Check in →
                      </Txt>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* Badges */}
        <View style={{ paddingHorizontal: 20 }}>
          <Txt v="label" style={{ marginBottom: 12 }}>
            Badges
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {BADGES.map((b) => {
              const p = badgeProgress(b, checkins);
              return (
                <View
                  key={b.id}
                  style={{
                    width: '100%',
                    flexDirection: 'row',
                    gap: 10,
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: p.done ? accentFill(c, b.accent) : c.line,
                    padding: 10,
                    backgroundColor: c.surface,
                  }}
                >
                  <ProgressRing value={p.have / p.need} size={52} color={accentFill(c, b.accent)} icon={p.done ? 'star' : 'passport'} label={b.name} />
                  <View style={{ flex: 1 }}>
                    <Txt v="bodyBold" size={14}>
                      {b.name}
                    </Txt>
                    <Txt v="caption" muted>
                      {b.blurb} · {p.have}/{p.need}
                    </Txt>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Pages */}
        <View style={{ margin: 20, backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.lineStrong, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Txt v="labelSm" muted>
              Visas & entries
            </Txt>
            <Txt v="labelSm" muted>
              p. 1–{Math.ceil(slots.length / 9)}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 18 }}>
            {slots.map((p, i) => {
              const at = checkins[p.id];
              const color = accentFill(c, p.accent);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(`/place/${p.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.name}${at ? ', stamped' : ', not yet visited'}`}
                  style={{ width: '31%', alignItems: 'center', gap: 4 }}
                >
                  <View
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: i % 3 === 1 ? 6 : 42,
                      borderWidth: at ? 3 : 1.5,
                      borderStyle: at ? 'solid' : 'dashed',
                      borderColor: at ? color : c.line,
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: [{ rotate: at ? `${((i * 37) % 24) - 12}deg` : '0deg' }],
                      opacity: at ? 0.92 : 1,
                    }}
                  >
                    {at ? (
                      <View style={{ alignItems: 'center' }}>
                        <Icon name={placeIcon(p)} color={color} size={26} />
                        <Txt style={{ fontFamily: fonts.label, fontSize: 8.5, letterSpacing: 0.8, color }} maxFontSizeMultiplier={1}>
                          {new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                        </Txt>
                      </View>
                    ) : (
                      <Icon name={placeIcon(p)} color={c.line} size={26} />
                    )}
                  </View>
                  <Txt v="caption" center numberOfLines={2} muted={!at} size={11}>
                    {p.name}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Paper>
  );
}
