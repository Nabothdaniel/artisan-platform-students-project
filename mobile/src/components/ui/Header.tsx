import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius, spacing, typography } from '../../theme/spacing';
import { Icon } from './Icon';

interface HeaderProps {
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const { colors, isDarkMode, toggleTheme, role, user } = useTheme();

  return (
    <View style={[
      styles.header,
      {
        backgroundColor: colors.cardBackground,
        borderBottomColor: colors.cardBorder,
      }
    ]}>
      <View style={styles.leftSection}>
        <Text style={[styles.logoBadge, { backgroundColor: colors.primary }]}>AH</Text>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>ArtisanHub</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {role === 'customer' ? 'Customer (Hirer)' : role === 'artisan' ? 'Artisan Workspace' : 'System Admin'}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {user ? (
          <View style={[styles.roleButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <Icon name={role === 'customer' ? 'account-outline' : role === 'artisan' ? 'hammer-wrench' : 'chart-box-outline'} size={16} color={colors.primary} />
            <Text style={[styles.roleText, { color: colors.primary }]}>
              {role === 'customer' ? 'Customer' : role === 'artisan' ? 'Artisan' : 'Admin'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenAuth}
            style={[styles.roleButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <Icon name="login-variant" size={16} color={colors.primaryForeground} />
            <Text style={[styles.roleText, { color: colors.primaryForeground }]}>Sign in</Text>
          </TouchableOpacity>
        )}

        {/* Theme Toggle */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleTheme}
          style={[styles.iconButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
        >
          <Icon name={isDarkMode ? 'weather-sunny' : 'weather-night'} size={17} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoBadge: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.base,
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  roleButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  roleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  themeIcon: {
    fontSize: 16,
  }
});
