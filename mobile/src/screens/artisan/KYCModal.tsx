import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { Button, Chip, Input, Sheet, Text } from '../../components/ui/foundation';
import { Icon } from '../../components/ui/Icon';
import { api } from '../../services/api';

interface KYCModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const KYCModal: React.FC<KYCModalProps> = ({ visible, onClose, onSuccess }) => {
  const { token } = useTheme();
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
    <Sheet
      visible={visible}
      title="NIN / BVN Identity Verification"
      onClose={onClose}
      footer={submitted ? (
        <Button
          label="Done"
          onPress={() => { setSubmitted(false); setIdToken(''); onClose(); }}
          size="lg"
        />
      ) : (
        <Button
          label="Submit Verification Token"
          onPress={handleSubmitKYC}
          loading={loading}
          size="lg"
        />
      )}
    >
      {submitted ? (
        <View style={styles.success}>
          <View style={styles.successIcon}>
            <Icon name="shield-check-outline" size={tokens.iconSizes.lg} color={tokens.colors.success} />
          </View>
          <Text variant="heading" style={styles.centered}>Identity Token Submitted</Text>
          <Text variant="body" color={tokens.colors.textMuted} style={styles.centered}>
            Your {idType} verification token ({idToken}) has been logged for administrative approval. Your profile status will display "APPROVED" once verified.
          </Text>
        </View>
      ) : (
        <>
          {errorMsg ? <Text variant="body" color={tokens.colors.danger}>{errorMsg}</Text> : null}

          <View style={styles.group}>
            <Text variant="meta" color={tokens.colors.textMuted}>Identity Verification Document Type</Text>
            <View style={styles.typeRow}>
              <Chip
                label="National Identity (NIN)"
                selected={idType === 'NIN'}
                onPress={() => setIdType('NIN')}
                style={styles.typeChip}
              />
              <Chip
                label="Bank Verification (BVN)"
                selected={idType === 'BVN'}
                onPress={() => setIdType('BVN')}
                style={styles.typeChip}
              />
            </View>
          </View>

          <Input
            label={`${idType} Identification Token Number`}
            placeholder={`e.g. ${idType}-990011223344`}
            value={idToken}
            onChangeText={setIdToken}
          />
        </>
      )}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  success: {
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: tokens.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  centered: {
    textAlign: 'center',
  },
  group: {
    gap: tokens.spacing[2],
  },
  typeRow: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  // minWidth: 0 lets the two pills split the row evenly instead of sizing to their labels.
  typeChip: {
    flex: 1,
    minWidth: 0,
  },
});
