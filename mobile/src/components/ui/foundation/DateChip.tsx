import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from './Pressable';
import { tokens } from '../../../theme/tokens';
import { Text } from './Text';

interface DateChipProps { day: string; date: string; selected?: boolean; onPress: () => void; }
export const DateChip: React.FC<DateChipProps> = ({ day, date, selected = false, onPress }) => <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, selected ? styles.selected : styles.unselected, pressed && styles.pressed]}><Text variant="meta" color={selected ? tokens.colors.inverseText : tokens.colors.textMuted}>{day}</Text><Text variant="subheading" color={selected ? tokens.colors.inverseText : tokens.colors.text}>{date}</Text></Pressable>;
const styles = StyleSheet.create({ chip: { minWidth: 60, minHeight: 60, borderRadius: tokens.radii.md, alignItems: 'center', justifyContent: 'center', gap: tokens.spacing[1] }, selected: { backgroundColor: tokens.colors.inverse }, unselected: { backgroundColor: tokens.colors.surfaceRaised, borderWidth: 1, borderColor: tokens.colors.border }, pressed: { transform: [{ scale: 0.97 }] } });
