import React from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '../../../theme/tokens';
import { Button } from './Button';
import { Modal } from './Modal';
import { Text } from './Text';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm action in the danger variant. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) => (
  <Modal
    visible={visible}
    onClose={onCancel}
    title={title}
    footer={
      <View style={styles.actions}>
        <Button label={cancelLabel} onPress={onCancel} variant="outline" style={styles.action} />
        <Button label={confirmLabel} onPress={onConfirm} variant={destructive ? 'danger' : 'primary'} style={styles.action} />
      </View>
    }
  >
    {message ? <Text variant="body" color={tokens.colors.textMuted}>{message}</Text> : null}
  </Modal>
);

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: tokens.spacing[3] },
  action: { flex: 1 },
});
