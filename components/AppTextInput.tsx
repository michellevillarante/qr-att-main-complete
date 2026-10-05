import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { useTheme } from '@/lib/theme';

type Props = TextInputProps & {
  /** Small inset variant used inside dense cards. */
  compact?: boolean;
};

export default function AppTextInput({ style, compact, onFocus, onBlur, ...rest }: Props) {
  const { colors, radius, mode } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      {...rest}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      selectionColor={colors.primary}
      style={[
        styles.base,
        compact && styles.compact,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.input,
          color: colors.textPrimary,
        },
        style,
        focused && {
          borderColor: colors.primary,
          shadowColor: colors.primary,
          shadowOpacity: mode === 'dark' ? 0.5 : 0.35,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: 2,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  compact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});
