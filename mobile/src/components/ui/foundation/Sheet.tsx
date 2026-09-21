import React from 'react';
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { Pressable } from './Pressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/tokens';
import { IconButton } from './IconButton';
import { Text } from './Text';

/** Shared by Sheet and Modal so a screen can swap one for the other. */
export interface OverlayProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** Pinned action area. Never scrolls. */
  footer?: React.ReactNode;
  style?: ViewStyle;
}

/** Fraction of the window an overlay may occupy at most. */
export const OVERLAY_MAX_HEIGHT_RATIO = 0.88;

export const OverlayHeader: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => (
  <View style={styles.header}>
    <Text variant="heading" numberOfLines={2} style={styles.headerTitle}>{title}</Text>
    <IconButton name="close" onPress={onClose} accessibilityLabel="Close" />
  </View>
);

/**
 * The only scrollable zone. flexShrink without flexGrow keeps a short sheet the
 * height of its content instead of stretching it to the max height.
 */
export const OverlayBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ScrollView
    style={styles.body}
    contentContainerStyle={styles.bodyContent}
    showsVerticalScrollIndicator={false}
    showsHorizontalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
    alwaysBounceVertical={false}
  >
    {children}
  </ScrollView>
);

export const OverlayFooter: React.FC<{ children: React.ReactNode; bottomInset: number }> = ({ children, bottomInset }) => (
  <View style={[styles.footer, { paddingBottom: Math.max(bottomInset, tokens.spacing[5]) }]}>
    {children}
  </View>
);

export const Sheet: React.FC<OverlayProps> = ({ visible, onClose, children, title, footer, style }) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
          <View
            style={[
              styles.sheet,
              { maxHeight: height * OVERLAY_MAX_HEIGHT_RATIO },
              // Without a footer the sheet itself owes the safe-area inset.
              !footer && { paddingBottom: insets.bottom },
              style,
            ]}
          >
            <View style={styles.handle} />
            {title ? <OverlayHeader title={title} onClose={onClose} /> : null}
            <OverlayBody>{children}</OverlayBody>
            {footer ? <OverlayFooter bottomInset={insets.bottom}>{footer}</OverlayFooter> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: tokens.colors.backdrop },
  keyboard: { justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    backgroundColor: tokens.colors.surface,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.textMuted,
    marginTop: tokens.spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[5],
    paddingTop: tokens.spacing[4],
    paddingBottom: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  headerTitle: { flex: 1, flexShrink: 1 },
  body: { flexShrink: 1, flexGrow: 0 },
  bodyContent: { padding: tokens.spacing[5], gap: tokens.spacing[4] },
  footer: {
    paddingHorizontal: tokens.spacing[5],
    paddingTop: tokens.spacing[4],
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    gap: tokens.spacing[3],
  },
});
