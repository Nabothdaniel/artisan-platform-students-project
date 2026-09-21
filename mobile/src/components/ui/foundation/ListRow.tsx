import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Pressable } from './Pressable';
import { tokens } from '../../../theme/tokens';
import { Text } from './Text';

interface ListRowProps { label: string; value?: string; onPress?: () => void; style?: ViewStyle; }
export const ListRow: React.FC<ListRowProps> = ({ label, value, onPress, style }) => <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}><Text variant="body" color={tokens.colors.textMuted} style={styles.label}>{label}</Text>{value && <Text variant="body" color={tokens.colors.text} style={styles.value}>{value}</Text>}</Pressable>;
const styles = StyleSheet.create({ row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[3] }, label: { flexShrink: 1 }, value: { flex: 1, textAlign: 'right', flexShrink: 1 }, pressed: { opacity: 0.7 } });
