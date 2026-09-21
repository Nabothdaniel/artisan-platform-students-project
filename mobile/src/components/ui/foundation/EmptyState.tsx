import React from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '../../../theme/tokens';
import { Text } from './Text';

interface EmptyStateProps { title: string; description?: string; }
export const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => <View style={styles.container}><Text variant="heading" color={tokens.colors.text}>{title}</Text>{description && <Text variant="body" color={tokens.colors.textMuted} style={styles.description}>{description}</Text>}</View>;
const styles = StyleSheet.create({ container: { minHeight: 120, alignItems: 'center', justifyContent: 'center', padding: tokens.spacing[5] }, description: { marginTop: tokens.spacing[2], textAlign: 'center' } });
