import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius, spacing, typography } from '../../theme/spacing';
import { Icon } from './Icon';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
  onOpenShowcase?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth, onOpenProfile, onOpenShowcase }) => {
  const { colors, role, user } = useTheme();

  const handleRolePress = () => {
    if (user && onOpenProfile) {
      onOpenProfile();
      return;
    }
    onOpenAuth();
  };

  return (
    <View style={[
      styles.header,
      {
        backgroundColor: colors.cardBackground,
        borderBottomColor: colors.cardBorder,
      }
    ]}>
      <View style={styles.leftSection}>
        <TouchableOpacity onLongPress={onOpenShowcase} delayLongPress={700} disabled={!onOpenShowcase}>
          <Text style={[styles.logoBadge, { backgroundColor: colors.primary, color: colors.primaryForeground }]}>AH</Text>
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>ArtisanHub</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {role === 'customer' ? 'Customer (Hirer)' : role === 'artisan' ? 'Artisan Workspace' : 'System Admin'}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleRolePress}
          style={[
            styles.roleButton,
            {
              backgroundColor: user ? colors.primaryLight : colors.primary,
              borderColor: user ? colors.primary : colors.primary,
            }
          ]}
        >
          <Icon
            name={user ? (role === 'customer' ? 'account-outline' : role === 'artisan' ? 'hammer-wrench' : 'chart-box-outline') : 'login-variant'}
            size={16}
            color={user ? colors.primary : colors.primaryForeground}
          />
          <Text style={[styles.roleText, { color: user ? colors.primary : colors.primaryForeground }]}>
            {user ? (role === 'customer' ? 'Customer' : role === 'artisan' ? 'Artisan' : 'Admin') : 'Sign in'}
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  roleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
