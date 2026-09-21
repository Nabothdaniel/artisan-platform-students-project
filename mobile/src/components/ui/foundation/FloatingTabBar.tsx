import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable, PressableState } from './Pressable';
import { tokens } from '../../../theme/tokens';
import { Icon, IconName } from '../Icon';
import { Text } from './Text';

/** Pill height. */
export const FLOATING_TAB_BAR_HEIGHT = 64;
/** Gap between the pill and the bottom safe-area edge. */
export const FLOATING_TAB_BAR_GAP = 12;
/** Bottom padding a screen needs so its content never hides under the bar. */
export const FLOATING_TAB_BAR_SPACE = FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_GAP;

type Tab = { value: string; label: string; icon: IconName };

interface FloatingTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Tab[];
}

/**
 * Floats over the screen. Place it as the last child of a container that
 * already applies the bottom safe-area inset; it pins itself to that edge.
 */
export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({ activeTab, onTabChange, tabs }) => (
  <View pointerEvents="box-none" style={styles.wrapper}>
    <View style={styles.bar}>
      {tabs.map(tab => {
        const active = tab.value === activeTab;
        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            onPress={() => onTabChange(tab.value)}
            style={({ pressed, hovered }: PressableState) => [
              styles.item,
              active ? styles.activeItem : hovered && styles.hoveredItem,
              pressed && styles.pressed,
            ]}
          >
            {({ hovered }: PressableState) => {
              // Dark on the white active pill; an inactive tab lights up white under a pointer (web).
              const color = active ? tokens.colors.inverseText : hovered ? tokens.colors.text : tokens.colors.textMuted;
              return (
                <>
                  <Icon name={tab.icon} size={tokens.iconSizes.sm} color={color} />
                  <Text variant="meta" color={color} numberOfLines={1} style={styles.label}>{tab.label}</Text>
                </>
              );
            }}
          </Pressable>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  bar: {
    height: FLOATING_TAB_BAR_HEIGHT,
    marginHorizontal: tokens.spacing[5],
    marginBottom: FLOATING_TAB_BAR_GAP,
    paddingHorizontal: tokens.spacing[2],
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  // Every tab takes an equal share of the bar and always shows icon + label at
  // one size, so nothing resizes or shifts when the active tab or hover changes.
  item: {
    flex: 1,
    minWidth: 0,
    height: 44,
    borderRadius: tokens.radii.full,
    paddingHorizontal: tokens.spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[2],
  },
  activeItem: { backgroundColor: tokens.colors.inverse },
  hoveredItem: { backgroundColor: tokens.colors.surface },
  // flexShrink lets a long label ellipsise instead of shoving other tabs sideways.
  // The label's line box is 16px against an 18px icon. Android's font padding and
  // Jakarta's tall ascent both push the glyphs below the icon's centre line, so
  // drop the padding and centre the text inside its own line box.
  label: {
    flexShrink: 1,
    fontFamily: tokens.typography.fontFamily.medium,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  pressed: { transform: [{ scale: 0.97 }] },
});
