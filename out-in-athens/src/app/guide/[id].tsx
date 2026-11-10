// GUIDE — editorial, magazine-style collection page.
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StackHeader } from '@/components/Header';
import { CATEGORY_ICON, Icon } from '@/components/Icon';
import { EmptyState } from '@/components/misc';
import { PhotoBlock, placeIcon } from '@/components/PlaceCard';
import { Stamp } from '@/components/Stamp';
import { Paper, Squiggle, Txt } from '@/components/ui';
import { accessFor, recommendable } from '@/lib/access';
import { whenLabel, openStatus } from '@/lib/time';
import { getEvent, getGuide, getPlace, now as clockNow } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { accentFill, fonts, onAccent } from '@/theme/tokens';

export default function GuideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const g = getGuide(id);
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { viewer } = useApp();
  if (!g) return <EmptyState title="Guide not found" />;
  const fill = accentFill(c, g.accent);
  const fg = onAccent(g.accent);
  const now = clockNow();

  // Resolve items, and drop anything this viewer can't get into.
  const items = g.items
    .map((it) => {
      if (it.refType === 'event') {
        const e = getEvent(it.refId);
        if (!e || e.end < now) return null;
        const acc = accessFor(e, viewer);
        return recommendable(acc)
          ? {
              it,
              title: e.title,
              sub: `${whenLabel(e.start, e.end, now)} · ${e.venue}`,
              accent: e.accent,
              icon: CATEGORY_ICON[e.category],
              acc,
              href: `/event/${e.id}`,
            }
          : null;
      }
      const p = getPlace(it.refId);
      if (!p) return null;
      const acc = accessFor(p, viewer);
      return recommendable(acc)
        ? { it, title: p.name, sub: `${openStatus(p.hours, now).label} · ${p.neighborhood}`, accent: p.accent, icon: placeIcon(p), acc, href: `/place/${p.id}` }
        : null;
    })
    .filter(Boolean);

  return (
    <Paper>
      <StackHeader title="Guide" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={{ backgroundColor: fill, padding: 22, paddingTop: 28 }}>
          <Txt style={{ fontFamily: fonts.label, fontSize: 12, letterSpacing: 2, color: fg }}>OUT IN ATHENS · GUIDE</Txt>
          <Txt
            style={{ fontFamily: fonts.displayBlack, fontSize: 46, lineHeight: 46, color: fg, letterSpacing: -1.2, marginTop: 14 }}
            accessibilityRole="header"
            maxFontSizeMultiplier={1.3}
          >
            {g.title}
          </Txt>
          <Txt style={{ fontFamily: fonts.displayItalic, fontSize: 19, color: fg, marginTop: 10 }}>{g.kicker}</Txt>
        </View>
        <View style={{ padding: 20 }}>
          <Txt v="serif" style={{ fontSize: 19, lineHeight: 27 }}>
            <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 44, lineHeight: 44, color: c.brick }}>{g.intro[0]}</Txt>
            {g.intro.slice(1)}
          </Txt>
          <Squiggle color={c.mustard} width={160} />
        </View>
        <View style={{ paddingHorizontal: 20, gap: 26 }}>
          {items.map((x, i) => (
            <Pressable
              key={x!.it.refId}
              onPress={() => router.push(x!.href)}
              accessibilityRole="button"
              accessibilityLabel={`Stop ${i + 1}: ${x!.title}. ${x!.it.note}`}
            >
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 52, lineHeight: 54, color: c.brick, width: 44 }} maxFontSizeMultiplier={1}>
                  {i + 1}
                </Txt>
                <View style={{ flex: 1 }}>
                  <PhotoBlock accent={x!.accent} icon={x!.icon} height={120} seed={i + 3} />
                  <Txt v="title" style={{ marginTop: 10 }}>
                    {x!.title}
                  </Txt>
                  <Txt v="caption" muted>
                    {x!.sub}
                  </Txt>
                  <Txt v="italic" style={{ marginTop: 6 }}>
                    “{x!.it.note}”
                  </Txt>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, alignItems: 'center' }}>
                    <Stamp kind={x!.acc.stamp} animate={false} />
                    {x!.acc.perk && <Stamp kind="perk" animate={false} />}
                    <View style={{ flex: 1 }} />
                    <Icon name="chevronRight" color={c.textMuted} size={18} />
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
          {items.length < g.items.length && (
            <Txt v="caption" muted>
              {g.items.length - items.length} stop{g.items.length - items.length > 1 ? 's' : ''} hidden: already over or not open to you in your current Access
              Mode.
            </Txt>
          )}
        </View>
      </ScrollView>
    </Paper>
  );
}
