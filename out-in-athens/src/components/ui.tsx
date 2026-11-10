// Base UI primitives: text, paper background, buttons, chips, section headers.
import { type ReactNode, useEffect, useState } from 'react';
import {
  Animated,
  ImageBackground,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { haptic } from '@/lib/feedback';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, palette } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';

// ——— Text ———

type Variant = 'hero' | 'display' | 'title' | 'serif' | 'label' | 'labelSm' | 'body' | 'bodySm' | 'bodyBold' | 'caption' | 'italic';

const VARIANTS: Record<Variant, TextStyle> = {
  hero: { fontFamily: fonts.displayBlack, fontSize: 38, lineHeight: 40, letterSpacing: -0.8 },
  display: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.4 },
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, letterSpacing: -0.2 },
  serif: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 22 },
  italic: { fontFamily: fonts.displayItalic, fontSize: 16, lineHeight: 21 },
  label: { fontFamily: fonts.label, fontSize: 13, lineHeight: 16, letterSpacing: 1.2, textTransform: 'uppercase' },
  labelSm: { fontFamily: fonts.labelMed, fontSize: 11, lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase' },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  bodySm: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  bodyBold: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.bodyMed, fontSize: 12, lineHeight: 16 },
};

type TxtProps = TextProps & { v?: Variant; color?: string; muted?: boolean; size?: number; center?: boolean };

export function Txt({ v = 'body', color, muted, size, center, style, ...rest }: TxtProps) {
  const { c, scale } = useTheme();
  const base = VARIANTS[v];
  const fontSize = (size ?? (base.fontSize as number)) * scale;
  const lineHeight = base.lineHeight ? (base.lineHeight as number) * (fontSize / (base.fontSize as number)) : undefined;
  return (
    <Text
      maxFontSizeMultiplier={v === 'hero' || v === 'display' ? 1.4 : 1.8}
      style={[base, { fontSize, lineHeight, color: color ?? (muted ? c.textMuted : c.text) }, center && { textAlign: 'center' }, style]}
      {...rest}
    />
  );
}

// ——— Paper background with grain ———

export function Paper({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { c, dark } = useTheme();
  return (
    <ImageBackground
      source={require('../../assets/paper-grain.png')}
      resizeMode="repeat"
      style={[{ flex: 1, backgroundColor: c.bg }, style]}
      imageStyle={{ opacity: dark ? 0.35 : 0.55 }}
    >
      {children}
    </ImageBackground>
  );
}

// ——— Buttons ———

type BtnProps = Omit<PressableProps, 'children'> & {
  label: string;
  icon?: IconName;
  kind?: 'primary' | 'secondary' | 'ghost' | 'ivy' | 'mustard';
  small?: boolean;
  full?: boolean;
  style?: ViewStyle;
};

export function Button({ label, icon, kind = 'primary', small, full, style, disabled, onPress, ...rest }: BtnProps) {
  const { c } = useTheme();
  const solid = kind === 'primary' || kind === 'ivy' || kind === 'mustard';
  const bg = disabled && solid ? c.surfaceAlt : kind === 'primary' ? c.brickFill : kind === 'ivy' ? c.ivyFill : kind === 'mustard' ? c.mustard : 'transparent';
  const fg = disabled && solid ? c.text : kind === 'secondary' || kind === 'ghost' ? c.text : kind === 'mustard' ? palette.ink : c.onFill;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={(e) => {
        haptic.tap();
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        full && { alignSelf: 'stretch' },
        {
          backgroundColor: bg,
          borderColor: kind === 'ghost' ? 'transparent' : kind === 'secondary' || (disabled && solid) ? c.lineStrong : bg,
          borderStyle: disabled && solid ? 'dashed' : 'solid',
          opacity: disabled && !solid ? 0.5 : 1,
          transform: [{ translateY: pressed ? 1.5 : 0 }],
        },
        kind !== 'ghost' &&
          !disabled &&
          !pressed && { shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: kind === 'secondary' ? 0 : 0.9, shadowRadius: 0 },
        style,
      ]}
      {...rest}
    >
      {icon && <Icon name={icon} color={fg} size={small ? 16 : 19} />}
      <Txt v="label" color={fg} size={small ? 12 : 14}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  active,
  size = 40,
  style,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  size?: number;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      hitSlop={8}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1.5,
          borderColor: c.lineStrong,
          backgroundColor: active ? c.brickFill : c.surface,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Icon name={icon} color={active ? c.onFill : c.text} size={size * 0.5} fill={active && icon === 'bookmark' ? c.onFill : 'none'} />
    </Pressable>
  );
}

// ——— Chips (squared, printed-label style) ———

export function Chip({
  label,
  active,
  onPress,
  icon,
  accent = 'brick',
  small,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  accent?: 'brick' | 'ivy' | 'ink';
  small?: boolean;
}) {
  const { c } = useTheme();
  const fill = accent === 'ivy' ? c.ivyFill : accent === 'ink' ? c.text : c.brickFill;
  const fg = active ? (accent === 'ink' ? c.bg : c.onFill) : c.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      // Visual height ~22–23pt; the slop brings the tap target to at least 44pt.
      hitSlop={{ top: small ? 12 : 11, bottom: small ? 12 : 11, left: 2, right: 2 }}
      onPress={() => {
        haptic.tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.chip,
        small && { paddingVertical: 4, paddingHorizontal: 8 },
        { borderColor: active ? fill : c.lineStrong, backgroundColor: active ? fill : 'transparent', opacity: pressed ? 0.75 : 1 },
      ]}
    >
      {icon && <Icon name={icon} color={fg} size={small ? 13 : 15} />}
      <Txt v="labelSm" color={fg} size={small ? 10.5 : 12}>
        {label}
      </Txt>
    </Pressable>
  );
}

// ——— Section header with hand-drawn underline ———

export function SectionHeader({ title, kicker, action, onAction }: { title: string; kicker?: string; action?: string; onAction?: () => void }) {
  const { c } = useTheme();
  return (
    <View style={styles.sectionHeader} accessibilityRole="header">
      <View style={{ flex: 1 }}>
        {kicker && (
          <Txt v="labelSm" color={c.brick} style={{ marginBottom: 2 }}>
            {kicker}
          </Txt>
        )}
        {/* No squiggle here: it's saved for screen titles so it means "you are here". */}
        <Txt v="title">{title}</Txt>
      </View>
      {action && (
        <Pressable onPress={onAction} hitSlop={{ top: 15, bottom: 15, left: 8, right: 8 }} accessibilityRole="link" accessibilityLabel={`${action}: ${title}`}>
          <Txt v="labelSm" color={c.brick}>
            {action} →
          </Txt>
        </Pressable>
      )}
    </View>
  );
}

export function Squiggle({ color, width = 120 }: { color: string; width?: number }) {
  // A marker underline, slightly uneven on purpose.
  const w = width;
  const d = `M2 5 C ${w * 0.2} 1, ${w * 0.35} 8, ${w * 0.5} 4 S ${w * 0.8} 2, ${w - 2} 5`;
  return (
    <Svg width={w} height={9} style={{ marginTop: 1 }}>
      <Path d={d} stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

// ——— Divider (dashed, like a tear line) ———

export function TearLine({ style }: { style?: ViewStyle }) {
  const { c } = useTheme();
  return <View style={[{ borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: c.line, marginVertical: 12 }, style]} />;
}

// ——— Toggle row (settings / filters) ———

export function ToggleRow({
  label,
  hint,
  value,
  onChange,
  icon,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: IconName;
}) {
  const { c, reduceMotion } = useTheme();
  const x = useState(() => new Animated.Value(value ? 1 : 0))[0];
  useEffect(() => {
    if (reduceMotion) x.setValue(value ? 1 : 0);
    else Animated.spring(x, { toValue: value ? 1 : 0, useNativeDriver: true, bounciness: 10, speed: 20 }).start();
  }, [value, reduceMotion, x]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: value }}
      onPress={() => {
        haptic.tap();
        onChange(!value);
      }}
      style={styles.toggleRow}
    >
      {icon && <Icon name={icon} color={c.text} size={20} />}
      <View style={{ flex: 1 }}>
        <Txt v="bodyBold">{label}</Txt>
        {hint && (
          <Txt v="bodySm" muted>
            {hint}
          </Txt>
        )}
      </View>
      <View style={[styles.track, { borderColor: c.lineStrong, backgroundColor: value ? c.ivyFill : 'transparent' }]}>
        <Animated.View
          style={[
            styles.knob,
            { backgroundColor: value ? c.onFill : c.text, transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [2, 20] }) }] },
          ]}
        />
      </View>
    </Pressable>
  );
}

// ——— Segmented control ———

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const { c } = useTheme();
  return (
    <View style={[styles.segment, { borderColor: c.lineStrong }]} accessibilityRole="tablist">
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            onPress={() => {
              haptic.tap();
              onChange(o.value);
            }}
            style={[styles.segmentItem, i > 0 && { borderLeftWidth: 1.5, borderColor: c.lineStrong }, on && { backgroundColor: c.text }]}
          >
            <Txt v="labelSm" color={on ? c.bg : c.text} center numberOfLines={1}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

// ——— Card shell: printed sheet with an offset ink shadow ———

export function Sheet({ children, style, onPress, label }: { children: ReactNode; style?: ViewStyle; onPress?: () => void; label?: string }) {
  const { c } = useTheme();
  const body = <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.lineStrong }, style]}>{children}</View>;
  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.985 : 1 }] })}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderRadius: 3,
  },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, marginTop: 28, marginBottom: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  track: { width: 46, height: 28, borderRadius: 14, borderWidth: 1.5, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10 },
  segment: { flexDirection: 'row', borderWidth: 1.5, borderRadius: 3, overflow: 'hidden' },
  segmentItem: { flex: 1, paddingVertical: 9, paddingHorizontal: 6, alignItems: 'center' },
  sheet: { borderWidth: 1.5, borderRadius: 3 },
});
