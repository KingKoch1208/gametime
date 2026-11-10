// ATHENS PASSPORT — passport-book UI with stamps and badges.
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StackHeader } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { placeIcon } from '@/components/PlaceCard';
import { ProgressRing } from '@/components/ProgressRing';
import { Paper, Txt } from '@/components/ui';
import { BADGES, badgeProgress } from '@/lib/passport';
import { getPlaces } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { accentFill, fonts, palette } from '@/theme/tokens';

export default function PassportScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { viewer, checkins } = useApp();
  // Every place you could visit is a slot in the book.
  const slots = getPlaces({ viewer, openToMe: true })
    .map((l) => l.item)
    .filter((p) => p.foodKind !== 'truck');
  const count = Object.keys(checkins).length;

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
