import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from './Icon';
import { Txt } from './ui';

export function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
      <Icon name={icon} color={c.textMuted} size={20} />
      <View style={{ flex: 1 }}>
        <Txt v="labelSm" muted>
          {label}
        </Txt>
        <Txt v="body">{value}</Txt>
      </View>
    </View>
  );
}

export function Pill({ icon, text }: { icon: IconName; text: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: c.line, paddingHorizontal: 8, paddingVertical: 4 }}>
      <Icon name={icon} color={c.text} size={14} />
      <Txt v="caption">{text}</Txt>
    </View>
  );
}

