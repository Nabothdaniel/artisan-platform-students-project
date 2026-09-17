import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius, spacing, typography } from '../../theme/spacing';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  leftIcon,
  rightIcon,
  style,
  ...props
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}
      <View style={[
        styles.inputWrapper,
        {
          backgroundColor: colors.inputBackground,
          borderColor: error ? colors.danger : colors.inputBorder,
        }
      ]}>
        {leftIcon}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { color: colors.textPrimary },
            style
          ]}
          {...props}
        />
        {rightIcon}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    height: '100%',
  },
  error: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  }
});
