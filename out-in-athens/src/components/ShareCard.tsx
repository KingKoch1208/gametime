// Poster-style share card (9:16) for Instagram stories. Rendered off-screen,
// captured with react-native-view-shot, then handed to the iOS share sheet.
import * as Sharing from 'expo-sharing';
import type { ComponentRef, Ref, RefObject } from 'react';
import { Share, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import type { AthensEvent } from '@/data/types';
import { DAY_LONG, fmtTime, MONTH_SHORT } from '@/lib/time';
import { fonts, onAccent, palette } from '@/theme/tokens';
import { CATEGORY_ICON, Icon } from './Icon';
import { Txt } from './ui';

export const SHARE_W = 360;
export const SHARE_H = 640;

export type ViewRef = ComponentRef<typeof View>;

export function ShareCard({ event: e, ref }: { event: AthensEvent; ref?: Ref<ViewRef> }) {
  const bg = e.accent === 'ivy' ? palette.ivy : e.accent === 'mustard' ? palette.mustard : e.accent === 'ink' ? palette.ink : palette.brick;
  const fg = onAccent(e.accent);
  return (
    <View ref={ref} collapsable={false} style={{ width: SHARE_W, height: SHARE_H, backgroundColor: palette.paper, padding: 18 }}>
      <View style={{ flex: 1, backgroundColor: bg, padding: 22, justifyContent: 'space-between', overflow: 'hidden' }}>
        <Svg width={SHARE_W} height={SHARE_H} style={{ position: 'absolute', left: 0, top: 0 }}>
          <Defs>
            <Pattern id="sc" patternUnits="userSpaceOnUse" width={8} height={8} patternTransform="rotate(30)">
              <Circle cx={4} cy={4} r={1.5} fill={fg} opacity={0.18} />
            </Pattern>
          </Defs>
          <Rect x={0} y={0} width={SHARE_W} height={SHARE_H} fill="url(#sc)" />
          <Circle cx={SHARE_W * 0.85} cy={SHARE_H * 0.2} r={150} fill={fg} opacity={0.07} />
        </Svg>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Txt style={{ fontFamily: fonts.label, fontSize: 13, letterSpacing: 2, color: fg }} maxFontSizeMultiplier={1}>
            {e.category.toUpperCase()}
          </Txt>
          <View style={{ borderWidth: 2.5, borderColor: fg, padding: 3, transform: [{ rotate: '6deg' }] }}>
            <View style={{ borderWidth: 1, borderColor: fg, paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center' }}>
              <Txt style={{ fontFamily: fonts.label, fontSize: 13, color: fg, letterSpacing: 1.5 }} maxFontSizeMultiplier={1}>
                {MONTH_SHORT[e.start.getMonth()].toUpperCase()}
              </Txt>
              <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 44, lineHeight: 46, color: fg }} maxFontSizeMultiplier={1}>
                {e.start.getDate()}
              </Txt>
            </View>
          </View>
        </View>
        <View>
          <Icon name={CATEGORY_ICON[e.category]} color={fg} size={54} strokeWidth={1.4} />
          <Txt
            style={{ fontFamily: fonts.displayBlack, fontSize: 46, lineHeight: 46, color: fg, letterSpacing: -1.2, marginTop: 10 }}
            maxFontSizeMultiplier={1}
          >
            {e.title}
          </Txt>
          <Txt style={{ fontFamily: fonts.displayItalic, fontSize: 18, color: fg, marginTop: 10 }} maxFontSizeMultiplier={1}>
            {DAY_LONG[e.start.getDay()]} · {fmtTime(e.start)} · {e.venue}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <View style={{ borderWidth: 2, borderColor: fg, paddingHorizontal: 8, paddingVertical: 2, transform: [{ rotate: '-3deg' }] }}>
              <Txt style={{ fontFamily: fonts.label, fontSize: 14, color: fg, letterSpacing: 1.2 }} maxFontSizeMultiplier={1}>
                {e.price === 0 ? 'FREE' : `$${e.price}`}
              </Txt>
            </View>
            {e.access === 'open' && (
              <View style={{ borderWidth: 2, borderColor: fg, paddingHorizontal: 8, paddingVertical: 2, transform: [{ rotate: '2deg' }] }}>
                <Txt style={{ fontFamily: fonts.label, fontSize: 14, color: fg, letterSpacing: 1.2 }} maxFontSizeMultiplier={1}>
                  OPEN TO ALL
                </Txt>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 }}>
        <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 20, color: palette.ink }} maxFontSizeMultiplier={1}>
          Out in Athens
        </Txt>
        <Txt style={{ fontFamily: fonts.label, fontSize: 11, letterSpacing: 1.5, color: palette.brick }} maxFontSizeMultiplier={1}>
          MORE THAN THE BARS
        </Txt>
      </View>
    </View>
  );
}

export async function shareEventCard(ref: RefObject<ViewRef | null>, e: AthensEvent) {
  try {
    if (!ref.current) throw new Error('no view');
    const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: e.title });
      return;
    }
    throw new Error('sharing unavailable');
  } catch {
    try {
      await Share.share({ message: `${e.title} — ${DAY_LONG[e.start.getDay()]} ${fmtTime(e.start)} at ${e.venue}. Found on Out in Athens.` });
    } catch {
      // Sharing isn't available here (e.g. the web preview).
    }
  }
}
