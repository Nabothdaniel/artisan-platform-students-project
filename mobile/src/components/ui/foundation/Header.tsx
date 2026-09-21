import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from './Pressable';
import { tokens } from '../../../theme/tokens';
import { IconButton } from './IconButton';
import { Text } from './Text';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onAction?: () => void;
  actionIcon?: string;
  actionLabel?: string;
  /** Replaces the trailing IconButton slot, e.g. with a Button or Badge. */
  right?: React.ReactNode;
  align?: 'center' | 'left';
  /** Hidden entry point for dev affordances. */
  onTitleLongPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  onAction,
  actionIcon = 'more-horizontal',
  actionLabel = 'Header action',
  right,
  align = 'center',
  onTitleLongPress,
}) => {
  const centered = align === 'center';
  return (
    <View style={styles.header}>
      {onBack ? (
        <IconButton name="arrow-left" onPress={onBack} accessibilityLabel="Go back" />
      ) : centered ? (
        <View style={styles.placeholder} />
      ) : null}

      <Pressable
        disabled={!onTitleLongPress}
        onLongPress={onTitleLongPress}
        delayLongPress={700}
        style={[styles.titleBlock, centered ? styles.titleCentered : styles.titleLeft]}
      >
        <Text variant="heading" numberOfLines={1}>{title}</Text>
        {subtitle ? <Text variant="meta" color={tokens.colors.textMuted} numberOfLines={1}>{subtitle}</Text> : null}
      </Pressable>

      {right ?? (onAction ? (
        <IconButton name={actionIcon} onPress={onAction} accessibilityLabel={actionLabel} />
      ) : centered ? (
        <View style={styles.placeholder} />
      ) : null)}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[5],
  },
  placeholder: { width: 44, height: 44 },
  // flexShrink lets a long title truncate instead of pushing the trailing slot off screen.
  titleBlock: { flex: 1, flexShrink: 1 },
  titleCentered: { alignItems: 'center' },
  titleLeft: { alignItems: 'flex-start' },
});
