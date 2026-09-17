import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Icon } from '../../components/ui/Icon';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

const SAMPLE_ACCOUNTS = [
  { label: 'Customer (Amina)', email: 'amina@gmail.com', pass: 'password123', role: 'customer' },
  { label: 'Customer (Emeka)', email: 'emeka@gmail.com', pass: 'password123', role: 'customer' },
  { label: 'Artisan (Tunde - Plumber)', email: 'tunde@plumbing.ng', pass: 'password123', role: 'artisan' },
  { label: 'Artisan (Ibrahim - Electrician)', email: 'ibrahim@sparks.ng', pass: 'password123', role: 'artisan' },
  { label: 'Artisan (Chidi - Carpenter)', email: 'chidi@woodcraft.ng', pass: 'password123', role: 'artisan' },
  { label: 'System Admin', email: 'admin@artisanhub.ng', pass: 'password123', role: 'admin' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const { colors, loginSession, user, logoutSession } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [roleInput, setRoleInput] = useState<'customer' | 'artisan'>('customer');
  const [tradeCategory, setTradeCategory] = useState('Plumbing');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
    <Modal visible={visible} title={user ? 'User Account Session' : isRegister ? 'Create ArtisanHub Account' : 'Account Authentication'} onClose={onClose}>
      <ScrollView style={{ maxHeight: 500 }}>
        {user ? (
          <View style={{ alignItems: 'center', padding: spacing.md }}>
            <Icon name="account-circle-outline" size={44} color={colors.primary} />
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
            <Text style={[styles.userRole, { color: colors.primary }]}>Role: {user.role.toUpperCase()}</Text>

            <Button
              title="Logout Session"
              onPress={() => { logoutSession(); onClose(); }}
              variant="danger"
              size="md"
              style={{ marginTop: spacing.xl }}
            />
          </View>
        ) : (
          <View>
            {errorMsg ? (
              <Text style={[styles.errorBox, { backgroundColor: colors.dangerBackground, color: colors.danger }]}>
                {errorMsg}
              </Text>
            ) : null}

            {/* Quick Demo Accounts Picker */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Quick Demo Account Login</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
              {SAMPLE_ACCOUNTS.map((acct, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => handleQuickLogin(acct)}
                  style={[styles.acctPill, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                >
                  <Text style={[styles.acctText, { color: colors.primary }]}>{acct.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {isRegister && (
              <>
                <Input label="Full Name" placeholder="Amina Lawal" value={name} onChangeText={setName} />
                <Text style={[styles.label, { color: colors.textSecondary, marginTop: spacing.sm }]}>Account Role</Text>
                <View style={styles.roleRow}>
                  <TouchableOpacity
                    onPress={() => setRoleInput('customer')}
                    style={[
                      styles.rolePill,
                      {
                        backgroundColor: roleInput === 'customer' ? colors.primary : colors.inputBackground,
                        borderColor: roleInput === 'customer' ? colors.primary : colors.inputBorder,
                      }
                    ]}
                  >
                    <Text style={{ color: roleInput === 'customer' ? '#FFFFFF' : colors.textPrimary, fontWeight: '600' }}>
                      Customer (Hirer)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setRoleInput('artisan')}
                    style={[
                      styles.rolePill,
                      {
                        backgroundColor: roleInput === 'artisan' ? colors.primary : colors.inputBackground,
                        borderColor: roleInput === 'artisan' ? colors.primary : colors.inputBorder,
                      }
                    ]}
                  >
                    <Text style={{ color: roleInput === 'artisan' ? '#FFFFFF' : colors.textPrimary, fontWeight: '600' }}>
                      Skilled Artisan
                    </Text>
                  </TouchableOpacity>
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

            <Button
              title={isRegister ? 'Register Account' : 'Log In'}
              onPress={handleAuthSubmit}
              loading={loading}
              variant="primary"
              size="lg"
              style={{ marginTop: spacing.lg }}
            />

            <TouchableOpacity onPress={() => { setIsRegister(!isRegister); setErrorMsg(''); }} style={styles.switchMode}>
              <Text style={[styles.switchText, { color: colors.primary }]}>
                {isRegister ? 'Already have an account? Log In' : "Don't have an account? Create One"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  errorBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  acctPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  acctText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rolePill: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  userName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    marginVertical: spacing.xs,
  },
  userRole: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  switchMode: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  switchText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  }
});
