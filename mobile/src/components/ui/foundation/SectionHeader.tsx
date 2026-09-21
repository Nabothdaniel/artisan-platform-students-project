import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from './Pressable';
import { tokens } from '../../../theme/tokens';
import { Text } from './Text';

interface SectionHeaderProps { title: string; actionLabel?: string; onAction?: () => void; }
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, actionLabel = 'See all', onAction }) => <View style={styles.row}><Text variant="heading" color={tokens.colors.text}>{title}</Text>{onAction && <Pressable onPress={onAction} hitSlop={8}><Text variant="meta" color={tokens.colors.accent}>{actionLabel}</Text></Pressable>}</View>;
const styles = StyleSheet.create({ row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } });
