import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme, UserRole } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { Badge, Sheet, Text, useToast, Pressable } from '../../components/ui/foundation';
import { Icon, IconName } from '../../components/ui/Icon';
import { api } from '../../services/api';
import { SAMPLE_ACCOUNTS } from '../auth/demoAccounts';

interface RoleSwitcherSheetProps {
  visible: boolean;
  onClose: () => void;
}

const ROLES: { role: UserRole; label: string; description: string; icon: IconName }[] = [
  { role: 'customer', label: 'Customer', description: 'Find artisans, post jobs and accept bids.', icon: 'account-outline' },
  { role: 'artisan', label: 'Artisan', description: 'Get verified and quote on open jobs.', icon: 'hammer-wrench' },
  { role: 'admin', label: 'Admin', description: 'Review KYC submissions and the audit log.', icon: 'chart-box-outline' },
];

/**
 * Every role's screens call the API with that role's token, so switching role
 * means switching account: it signs in to the role's seeded demo account.
 */
export const RoleSwitcherSheet: React.FC<RoleSwitcherSheetProps> = ({ visible, onClose }) => {
  const { role, user, loginSession } = useTheme();
  const toast = useToast();
  const [switchingTo, setSwitchingTo] = useState<UserRole | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleClose = () => {
    setErrorMsg('');
    onClose();
  };

  const handleSelect = async (next: UserRole) => {
    if (switchingTo) return;
    // Already signed in under this role: nothing to switch.
    if (user && user.role === next) return handleClose();

    const account = SAMPLE_ACCOUNTS.find(acct => acct.role === next);
    if (!account) return;
    try {
      setSwitchingTo(next);
      setErrorMsg('');
      const data = await api.login({ email: account.email, password: account.pass });
      const me = await api.getMe(data.access_token);
      loginSession(data.access_token, me);
      toast.success(`Switched to ${ROLES.find(r => r.role === next)?.label} — signed in as ${me.name}.`);
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not switch role. Check your connection and try again.');
    } finally {
      setSwitchingTo(null);
    }
  };

  return (
    <Sheet visible={visible} title="Switch role" onClose={handleClose}>
      <Text variant="body" color={tokens.colors.textMuted}>
        Each role signs in to its demo account, so you see that role's real data.
      </Text>

      {errorMsg ? <Text variant="body" color={tokens.colors.danger}>{errorMsg}</Text> : null}

      {ROLES.map(option => {
        const current = option.role === role;
        const account = SAMPLE_ACCOUNTS.find(acct => acct.role === option.role);
        const signedInHere = current && user?.role === option.role;
        return (
          <Pressable
            key={option.role}
            accessibilityRole="button"
            accessibilityState={{ selected: current, busy: switchingTo === option.role }}
            disabled={switchingTo !== null}
            onPress={() => handleSelect(option.role)}
            style={({ pressed }) => [styles.option, current && styles.optionCurrent, pressed && styles.pressed]}
          >
            <View style={[styles.iconBubble, current && styles.iconBubbleCurrent]}>
              <Icon
                name={option.icon}
                size={tokens.iconSizes.md}
                color={current ? tokens.colors.inverseText : tokens.colors.textMuted}
              />
            </View>
            <View style={styles.optionText}>
              <Text variant="subheading" numberOfLines={1}>{option.label}</Text>
              <Text variant="meta" color={tokens.colors.textMuted}>{option.description}</Text>
              <Text variant="meta" color={tokens.colors.textMuted} numberOfLines={1}>
                {signedInHere ? `Signed in as ${user.name}` : `Demo account: ${account?.email}`}
              </Text>
            </View>
            {switchingTo === option.role ? (
              <ActivityIndicator color={tokens.colors.text} />
            ) : current ? (
              <Badge label="Current" variant="accent" size="sm" />
            ) : null}
          </Pressable>
        );
      })}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
    padding: tokens.spacing[3],
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surfaceRaised,
  },
  optionCurrent: {
    borderColor: tokens.colors.accent,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: tokens.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  iconBubbleCurrent: {
    backgroundColor: tokens.colors.inverse,
    borderColor: tokens.colors.inverse,
  },
  // minWidth: 0 lets the description wrap inside the row instead of widening it.
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: tokens.spacing[1],
  },
  pressed: { transform: [{ scale: 0.97 }] },
});
