import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { spacing, typography, borderRadius } from '../../theme/spacing';
import { Icon } from '../../components/ui/Icon';

interface KYCModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const KYCModal: React.FC<KYCModalProps> = ({ visible, onClose, onSuccess }) => {
  const { colors, token } = useTheme();
  const [idType, setIdType] = useState<'NIN' | 'BVN'>('NIN');
  const [idToken, setIdToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitKYC = async () => {
    if (!idToken.trim()) {
      setErrorMsg('Please enter your National Identification Number (NIN) or BVN string.');
      return;
    }
    if (!token) {
      setErrorMsg('You must log in as an artisan to submit identity verification.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await api.submitKYC({ id_type: idType, id_token: idToken.trim() }, token);
      setSubmitted(true);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit verification token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} title="NIN / BVN Identity Verification" onClose={onClose}>
      {submitted ? (
        <View style={{ alignItems: 'center', padding: spacing.md }}>
          <Icon name="shield-check-outline" size={44} color={colors.success} />
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Identity Token Submitted</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            Your {idType} verification token ({idToken}) has been logged for administrative approval. Your profile status will display "APPROVED" once verified.
          </Text>
          <Button
            title="Done"
            onPress={() => { setSubmitted(false); setIdToken(''); onClose(); }}
            variant="primary"
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

          <Text style={[styles.label, { color: colors.textSecondary }]}>Identity Verification Document Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIdType('NIN')}
              style={[
                styles.typePill,
                {
                  backgroundColor: idType === 'NIN' ? colors.primary : colors.inputBackground,
                  borderColor: idType === 'NIN' ? colors.primary : colors.inputBorder,
                }
              ]}
            >
              <Text style={[styles.typeText, { color: idType === 'NIN' ? '#FFFFFF' : colors.textPrimary }]}>
                National Identity (NIN)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIdType('BVN')}
              style={[
                styles.typePill,
                {
                  backgroundColor: idType === 'BVN' ? colors.primary : colors.inputBackground,
                  borderColor: idType === 'BVN' ? colors.primary : colors.inputBorder,
                }
              ]}
            >
              <Text style={[styles.typeText, { color: idType === 'BVN' ? '#FFFFFF' : colors.textPrimary }]}>
                Bank Verification (BVN)
              </Text>
            </TouchableOpacity>
          </View>

          <Input
            label={`${idType} Identification Token Number`}
            placeholder={`e.g. ${idType}-990011223344`}
            value={idToken}
            onChangeText={setIdToken}
          />

          <Button
            title="Submit Verification Token"
            onPress={handleSubmitKYC}
            loading={loading}
            variant="primary"
            size="lg"
            style={{ marginTop: spacing.lg }}
          />
        </View>
      )}
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
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typePill: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  successTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  successSubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: typography.lineHeight.base,
  }
});
