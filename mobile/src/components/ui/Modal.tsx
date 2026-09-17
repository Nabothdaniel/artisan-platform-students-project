import React from 'react';
import { Modal as RNModal, View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius, spacing, typography } from '../../theme/spacing';

interface ModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  title,
  onClose,
  children,
  contentStyle
}) => {
  const { colors } = useTheme();

  return (
    <RNModal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.container,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
          },
          contentStyle
        ]}>
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.closeIcon, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.body}>
            {children}
          </View>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  closeIcon: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  body: {
    padding: spacing.lg,
    flexShrink: 1,
  }
});
