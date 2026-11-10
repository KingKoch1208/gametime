// PARTNER PORTAL (mock) — what Visit Athens / UGA Rec would see.
// Post an event, see fake analytics, request a clearly-labeled Featured slot.
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StackHeader } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Stamp } from '@/components/Stamp';
import { Button, Chip, Paper, Sheet, Txt } from '@/components/ui';
import { haptic } from '@/lib/feedback';
import { DAY_SHORT, relativeDay } from '@/lib/time';
import { getOrg, getOrgAnalytics } from '@/services/dataService';
import { useApp } from '@/state/AppState';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, palette } from '@/theme/tokens';

const PARTNERS = ['visit-athens', 'uga-rec', 'acc-leisure', 'sustainability', 'farmers-market', 'red-black'];

export default function PartnerPortal() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { featureRequests, requestFeature } = useApp();
  const [orgId, setOrgId] = useState('visit-athens');
  const org = getOrg(orgId)!;
  const a = getOrgAnalytics(orgId);
  const max = Math.max(...a.week);
  const now = new Date();
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
          <Txt v="label">Views per day</Txt>
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
                  {l as string} {Math.round((v as number) * 100)}%
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
                  </View>
                  {r.event.featured ? (
                    <Stamp kind="featured" animate={false} />
                  ) : requested ? (
                    <Stamp kind="pending" text="Featured requested" animate={false} />
                  ) : (
                    <Chip
                      small
                      icon="star"
                      label="Request Featured"
                      onPress={() =>
                        Alert.alert(
                          'Request Featured placement?',
                          'Featured listings get one clearly labeled “Featured” slot on Now and Events for 7 days. Students and locals always see that it’s sponsored. (Demo: no charge.)',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Request',
                              onPress: () => {
                                requestFeature(r.event.id);
                                haptic.success();
                              },
                            },
                          ],
                        )
                      }
                    />
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
    </Paper>
  );
}
