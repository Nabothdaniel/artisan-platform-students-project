import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { Badge, Button, Chip, ConfirmDialog, Input, Sheet, Text } from '../../components/ui/foundation';
import { Icon } from '../../components/ui/Icon';
import { api } from '../../services/api';
import { SAMPLE_ACCOUNTS } from './demoAccounts';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const { loginSession, user, logoutSession } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [roleInput, setRoleInput] = useState<'customer' | 'artisan'>('customer');
  const [tradeCategory, setTradeCategory] = useState('Plumbing');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  const handleQuickLogin = (acct: any) => {
    setEmail(acct.email);
    setPassword(acct.pass);
    executeLogin(acct.email, acct.pass);
  };

  const executeLogin = async (e: string, p: string) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await api.login({ email: e, password: p });
      const me = await api.getMe(data.access_token);
      loginSession(data.access_token, me);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async () => {
    if (!email || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }

    if (isRegister) {
      if (!name) {
        setErrorMsg('Full Name is required for registration.');
        return;
      }
      try {
        setLoading(true);
        setErrorMsg('');
        const payload = {
          name,
          email,
          phone: '+2348000000000',
          password,
          role: roleInput,
          location_name: 'Keffi',
          trade_category: roleInput === 'artisan' ? tradeCategory : undefined,
          hourly_rate: roleInput === 'artisan' ? 3500 : undefined,
        };
        await api.register(payload);
        await executeLogin(email, password);
      } catch (err: any) {
        setErrorMsg(err.message || 'Registration failed.');
        setLoading(false);
      }
    } else {
      await executeLogin(email, password);
    }
  };

  return (
    <Sheet
      visible={visible}
      title={user ? 'User Account Session' : isRegister ? 'Create ArtisanHub Account' : 'Account Authentication'}
      onClose={onClose}
      footer={user ? (
        <Button
          label="Logout Session"
          onPress={() => setLogoutConfirmVisible(true)}
          variant="danger"
          size="lg"
        />
      ) : (
        <>
          <Button
            label={isRegister ? 'Register Account' : 'Log In'}
            onPress={handleAuthSubmit}
            loading={loading}
            size="lg"
          />
          <Button
            label={isRegister ? 'Already have an account? Log In' : "Don't have an account? Create One"}
            onPress={() => { setIsRegister(!isRegister); setErrorMsg(''); }}
            variant="accent-text"
            size="sm"
          />
        </>
      )}
    >
      {user ? (
        <View style={styles.session}>
          <View style={styles.sessionIcon}>
            <Icon name="account-circle-outline" size={tokens.iconSizes.lg} color={tokens.colors.text} />
          </View>
          <Text variant="heading" style={styles.centered}>{user.name}</Text>
          <Text variant="body" color={tokens.colors.textMuted} style={styles.centered}>{user.email}</Text>
          <Badge label={`Role: ${user.role.toUpperCase()}`} variant="accent" size="sm" style={styles.sessionBadge} />
        </View>
      ) : (
        <>
          {errorMsg ? <Text variant="body" color={tokens.colors.danger}>{errorMsg}</Text> : null}

          {/* Quick Demo Accounts Picker */}
          <View style={styles.group}>
            <Text variant="meta" color={tokens.colors.textMuted}>Quick Demo Account Login</Text>
            <ScrollView
              horizontal
              bounces={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {SAMPLE_ACCOUNTS.map((acct, idx) => (
                <Chip key={idx} label={acct.label} variant="accent-dot" onPress={() => handleQuickLogin(acct)} />
              ))}
            </ScrollView>
          </View>

          {isRegister && (
            <>
              <Input label="Full Name" placeholder="Amina Lawal" value={name} onChangeText={setName} />
              <View style={styles.group}>
                <Text variant="meta" color={tokens.colors.textMuted}>Account Role</Text>
                <View style={styles.roleRow}>
                  <Chip
                    label="Customer (Hirer)"
                    selected={roleInput === 'customer'}
                    onPress={() => setRoleInput('customer')}
                    style={styles.roleChip}
                  />
                  <Chip
                    label="Skilled Artisan"
                    selected={roleInput === 'artisan'}
                    onPress={() => setRoleInput('artisan')}
                    style={styles.roleChip}
                  />
                </View>
              </View>
            </>
          )}

          <Input
            label="Email Address"
            placeholder="amina@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </>
      )}

      <ConfirmDialog
        visible={logoutConfirmVisible}
        title="Log out?"
        message="You will need to sign in again to post jobs, bid, or manage bookings."
        confirmLabel="Log out"
        destructive
        onCancel={() => setLogoutConfirmVisible(false)}
        onConfirm={() => { setLogoutConfirmVisible(false); logoutSession(); onClose(); }}
      />
    </Sheet>
  );
};

const styles = StyleSheet.create({
  session: {
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  sessionIcon: {
    width: 56,
    height: 56,
    borderRadius: tokens.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing[2],
  },
  sessionBadge: {
    alignSelf: 'center',
    marginTop: tokens.spacing[2],
  },
  centered: {
    textAlign: 'center',
  },
  group: {
    gap: tokens.spacing[2],
  },
  chips: {
    gap: tokens.spacing[2],
  },
  roleRow: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  // minWidth: 0 lets the two pills split the row evenly instead of sizing to their labels.
  roleChip: {
    flex: 1,
    minWidth: 0,
  },
});
