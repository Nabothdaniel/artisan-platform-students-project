import React from 'react';
import { StyleSheet, View } from 'react-native';
import { tokens } from '../../../theme/tokens';

export const Divider: React.FC<{ dashed?: boolean }> = ({ dashed = false }) => <View style={[styles.divider, dashed && styles.dashed]} />;
const styles = StyleSheet.create({ divider: { height: 1, backgroundColor: tokens.colors.border, width: '100%' }, dashed: { borderStyle: 'dashed', borderWidth: 1, borderColor: tokens.colors.border, backgroundColor: 'transparent' } });
