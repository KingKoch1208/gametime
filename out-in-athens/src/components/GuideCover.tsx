// Curated guides look like zine / magazine covers.
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { Guide } from '@/data/types';
import { useTheme } from '@/theme/ThemeProvider';
import { accentFill, fonts, onAccent } from '@/theme/tokens';
import { Txt } from './ui';

export function GuideCover({ guide: g, width = 168, height = 220 }: { guide: Guide; width?: number; height?: number }) {
  const { c } = useTheme();
  const fill = accentFill(c, g.accent);
  const fg = onAccent(g.accent);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Guide: ${g.title}. ${g.kicker}`}
      onPress={() => router.push(`/guide/${g.id}`)}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}
    >
      <View style={{ width, height, backgroundColor: fill, borderWidth: 1.5, borderColor: c.lineStrong, padding: 12, justifyContent: 'space-between', overflow: 'hidden' }}>
        <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
          <Path d={`M-10 ${height * 0.72} Q ${width * 0.5} ${height * 0.5} ${width + 10} ${height * 0.8}`} stroke={fg} strokeOpacity={0.18} strokeWidth={26} fill="none" />
        </Svg>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt style={{ fontFamily: fonts.label, fontSize: 10, letterSpacing: 1.5, color: fg }}>OUT IN ATHENS</Txt>
          <Txt style={{ fontFamily: fonts.label, fontSize: 10, letterSpacing: 1.5, color: fg }}>GUIDE</Txt>
        </View>
        <View>
          <Txt style={{ fontFamily: fonts.displayBlack, fontSize: 24, lineHeight: 25, color: fg, letterSpacing: -0.5 }} maxFontSizeMultiplier={1.2}>
            {g.title}
          </Txt>
          <Txt style={{ fontFamily: fonts.displayItalic, fontSize: 13, lineHeight: 17, color: fg, marginTop: 6, opacity: 0.9 }} numberOfLines={2}>
            {g.kicker}
          </Txt>
          <Txt style={{ fontFamily: fonts.label, fontSize: 10, letterSpacing: 1.2, color: fg, marginTop: 8 }}>{g.items.length} STOPS →</Txt>
        </View>
      </View>
    </Pressable>
  );
}
