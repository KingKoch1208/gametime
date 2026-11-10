// PARTNER PORTAL (mock) — what Visit Athens / UGA Rec would see.
// Post an event, see fake analytics, request a clearly-labeled Featured slot.
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/BottomSheet';
import { StackHeader } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Stamp } from '@/components/Stamp';
import { Button, Chip, Paper, Sheet, Txt } from '@/components/ui';
import { haptic } from '@/lib/feedback';
import { toast } from '@/lib/toast';
import { DAY_SHORT, relativeDay } from '@/lib/time';
import { getOrg, getOrgAnalytics, now as clockNow } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, palette } from '@/theme/tokens';

const PARTNERS = ['visit-athens', 'uga-rec', 'acc-leisure', 'sustainability', 'farmers-market', 'red-black'];

export default function PartnerPortal() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { featureRequests, requestFeature } = useApp();
  const [orgId, setOrgId] = useState('visit-athens');
  const [featureFor, setFeatureFor] = useState<string | null>(null);
  const org = getOrg(orgId)!;
  const a = getOrgAnalytics(orgId);
  const max = Math.max(...a.week);
  const now = clockNow();
  const days = Array.from({ length: 7 }, (_, i) => DAY_SHORT[(now.getDay() - 6 + i + 7) % 7]);

  return (
    <Paper>
      <StackHeader title="Partner Portal · demo" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        <Txt v="labelSm" muted>
          Viewing as
        </Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
          {PARTNERS.map((id) => (
            <Chip key={id} small label={getOrg(id)!.name} active={orgId === id} onPress={() => setOrgId(id)} accent="ink" />
          ))}
        </ScrollView>
        <Txt v="display" style={{ marginTop: 6 }}>
          {org.name}
        </Txt>
        <Txt v="bodySm" muted>
          Last 7 days · sample analytics
        </Txt>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          {[
            ['Views', a.totals.views],
            ['Saves', a.totals.saves],
            ['Going', a.totals.going],
          ].map(([l, v]) => (
            <Sheet key={l} style={{ flex: 1, padding: 12 }}>
              <Txt v="labelSm" muted>
                {l}
              </Txt>
              <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 24, color: c.text }} maxFontSizeMultiplier={1.1} numberOfLines={1} adjustsFontSizeToFit>
                {Number(v).toLocaleString()}
              </Txt>
            </Sheet>
          ))}
        </View>

        <Sheet style={{ padding: 14, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt v="label">Views per day</Txt>
            <Stamp kind="pending" text="Sample data" animate={false} />
          </View>
          <Txt v="caption" muted style={{ marginTop: 4 }}>
            Peak {max.toLocaleString()} views
          </Txt>
          <View
            style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 120, marginTop: 12 }}
            accessible
            accessibilityLabel={`Views per day: ${a.week.join(', ')}`}
          >
            {a.week.map((v, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <View style={{ width: '100%', height: (v / max) * 96, backgroundColor: i === 6 ? c.brickFill : c.ivyFill }} />
                <Txt v="labelSm" size={9} muted>
                  {days[i]}
                </Txt>
              </View>
            ))}
          </View>
        </Sheet>

        <Sheet style={{ padding: 14, marginTop: 12 }}>
          <Txt v="label">Who’s looking</Txt>
          <View style={{ flexDirection: 'row', height: 14, marginTop: 10, borderWidth: 1.5, borderColor: c.lineStrong }}>
            <View style={{ flex: a.audience.students, backgroundColor: palette.brick }} />
            <View style={{ flex: a.audience.locals, backgroundColor: palette.ivy }} />
            <View style={{ flex: a.audience.visitors, backgroundColor: palette.mustard }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
            {[
              ['Students', a.audience.students, palette.brick],
              ['Locals', a.audience.locals, palette.ivy],
              ['Visitors', a.audience.visitors, palette.mustard],
            ].map(([l, v, col]) => (
              <View key={l as string} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, backgroundColor: col as string }} />
                <Txt v="caption">
                  {l as string} {v as number}%
                </Txt>
              </View>
            ))}
          </View>
        </Sheet>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Button
            icon="plus"
            label="Post an event"
            onPress={() => router.push({ pathname: '/submit', params: { partner: org.name } })}
            style={{ flex: 1 }}
            small
          />
        </View>

        <Txt v="label" style={{ marginTop: 22, marginBottom: 8 }}>
          Your listings
        </Txt>
        {a.rows.length ? (
          a.rows.map((r) => {
            const requested = featureRequests.includes(r.event.id);
            return (
              <View key={r.event.id} style={{ borderBottomWidth: 1, borderColor: c.line, paddingVertical: 10, gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Txt v="bodyBold" numberOfLines={1}>
                      {r.event.title}
                    </Txt>
                    <Txt v="caption" muted>
                      {relativeDay(r.event.start, now)} · {r.views.toLocaleString()} views · {r.saves} saves · {r.going} going
                    </Txt>
                    <Txt v="caption" color={c.ivy}>
                      {Math.round(r.carFree * 100)}% of directions by walk, bike or bus
                    </Txt>
                  </View>
                  {r.event.featured ? (
                    <Stamp kind="featured" animate={false} />
                  ) : requested ? (
                    <Stamp kind="pending" text="Featured requested" animate={false} />
                  ) : (
                    <Chip small icon="star" label="Request Featured" onPress={() => setFeatureFor(r.event.id)} />
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <Txt v="bodySm" muted>
            No upcoming listings.
          </Txt>
        )}

        <View style={{ marginTop: 22, flexDirection: 'row', gap: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.line, padding: 12 }}>
          <Icon name="info" color={c.textMuted} size={18} />
          <Txt v="caption" muted style={{ flex: 1 }}>
            Sponsorship model: one Featured slot per feed, always labeled, never mixed into “I’m bored” rankings. Partners post with a verified badge; their
            events skip the student-submission review queue.
          </Txt>
        </View>
      </ScrollView>

      <BottomSheet visible={!!featureFor} onClose={() => setFeatureFor(null)} title="Request Featured" heightPct={0.62}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}>
          <Txt v="bodySm" muted>
            One clearly labeled “Featured” slot on Now and Events. Never placed in “I’m bored”. Everyone sees who paid for it.
          </Txt>
          <Stamp kind="pending" text="Sample pricing" animate={false} />
          {TIERS.map((t) => (
            <Sheet
              key={t.id}
              style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              label={`${t.name}, ${t.price}`}
              onPress={() => {
                if (featureFor) requestFeature(featureFor);
                haptic.success();
                setFeatureFor(null);
                toast(`${t.name} requested. The Out in Athens team will confirm by email (demo).`);
              }}
            >
              <View style={{ flex: 1 }}>
                <Txt v="bodyBold">{t.name}</Txt>
                <Txt v="caption" muted>
                  {t.detail}
                </Txt>
              </View>
              <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 20, color: c.text }}>{t.price}</Txt>
            </Sheet>
          ))}
        </ScrollView>
      </BottomSheet>
    </Paper>
  );
}

const TIERS = [
  { id: 'weekend', name: 'Weekend slot', detail: 'Fri 5pm – Sun midnight', price: '$40' },
  { id: 'week', name: 'Week slot', detail: '7 days, Now + Events', price: '$90' },
  { id: 'month', name: 'Month of Saturdays', detail: '4 weekend slots', price: '$140' },
];
