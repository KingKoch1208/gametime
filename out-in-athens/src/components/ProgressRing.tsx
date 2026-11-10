import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Txt } from './ui';

export function ProgressRing({ value, size = 64, color, icon, label }: { value: number; size?: number; color: string; icon?: IconName; label?: string }) {
  const { c } = useTheme();
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessible
      accessibilityLabel={`${label ?? ''} ${Math.round(v * 100)} percent`}
    >
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.line} strokeWidth={stroke} fill="none" strokeDasharray="3 4" />
        {v > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${circ * v} ${circ}`}
            strokeLinecap="round"
          />
        )}
      </Svg>
      {icon ? (
        <Icon name={icon} color={v >= 1 ? color : c.textMuted} size={size * 0.4} />
      ) : (
        <Txt style={{ fontFamily: fonts.label, fontSize: size * 0.22, color: c.text }}>{Math.round(v * 100)}%</Txt>
      )}
    </View>
  );
}
