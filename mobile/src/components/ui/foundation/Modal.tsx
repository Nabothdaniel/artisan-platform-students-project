import React from 'react';
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Pressable } from './Pressable';
import { tokens } from '../../../theme/tokens';
import { OVERLAY_MAX_HEIGHT_RATIO, OverlayBody, OverlayFooter, OverlayHeader, OverlayProps } from './Sheet';

/** Centred dialog. Same props and same three zones as Sheet. */
export const Modal: React.FC<OverlayProps> = ({ visible, onClose, children, title, footer, style }) => {
  const { height } = useWindowDimensions();

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
          <View style={[styles.dialog, { maxHeight: height * OVERLAY_MAX_HEIGHT_RATIO }, style]}>
            {title ? <OverlayHeader title={title} onClose={onClose} /> : null}
            <OverlayBody>{children}</OverlayBody>
            {/* Centred, so it is not against the screen edge: no safe-area inset. */}
            {footer ? <OverlayFooter bottomInset={0}>{footer}</OverlayFooter> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: tokens.colors.backdrop },
  keyboard: { width: '100%', alignItems: 'center', paddingHorizontal: tokens.spacing[5] },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    overflow: 'hidden',
  },
});
