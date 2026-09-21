import React from 'react';
import { Platform, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { tokens } from '../../../theme/tokens';
import { Text } from './Text';

export type FoundationInputVariant = 'dark' | 'inverse';

export interface InputProps extends TextInputProps {
  variant?: FoundationInputVariant;
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input = React.forwardRef<TextInput, InputProps>(({
  variant = 'dark',
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  placeholderTextColor = tokens.colors.textMuted,
  ...props
}, ref) => {
  const inverse = variant === 'inverse';
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text variant="meta" color={tokens.colors.textMuted}>{label}</Text> : null}
      <View style={[styles.field, inverse ? styles.inverse : styles.dark, props.multiline && styles.multiline, !!error && styles.errored]}>
        {leftIcon}
        <TextInput
          {...props}
          ref={ref}
          placeholderTextColor={placeholderTextColor}
          style={[styles.input, inverse && styles.inverseText, props.multiline && styles.multilineInput, style]}
        />
        {rightIcon}
      </View>
      {error ? <Text variant="meta" color={tokens.colors.danger}>{error}</Text> : null}
    </View>
  );
});
Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: { gap: tokens.spacing[2] },
  field: {
    minHeight: 44,
    borderRadius: tokens.radii.full,
    paddingHorizontal: tokens.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  input: {
    flex: 1,
    paddingVertical: tokens.spacing[2],
    fontFamily: tokens.typography.fontFamily.regular,
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    // The field's own border shows focus; the browser's default ring draws a box inside the pill.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  inverseText: { color: tokens.colors.inverseText },
  // A pill radius on a tall field reads as a blob; multiline drops to the card radius.
  multiline: { borderRadius: tokens.radii.md, alignItems: 'flex-start', paddingVertical: tokens.spacing[2] },
  multilineInput: { minHeight: 72, textAlignVertical: 'top' },
  dark: { backgroundColor: tokens.colors.surfaceRaised, borderWidth: 1, borderColor: tokens.colors.border },
  inverse: { backgroundColor: tokens.colors.inverse, borderWidth: 1, borderColor: tokens.colors.inverse },
  errored: { borderColor: tokens.colors.danger },
});
