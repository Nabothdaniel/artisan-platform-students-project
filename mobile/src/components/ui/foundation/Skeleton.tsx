import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { tokens } from '../../../theme/tokens';

export const Skeleton: React.FC<{ width?: ViewStyle['width']; height?: ViewStyle['height']; style?: ViewStyle }> = ({ width = '100%', height = 16, style }) => <View style={[styles.base, { width, height }, style]} />;
const styles = StyleSheet.create({ base: { borderRadius: tokens.radii.sm, backgroundColor: tokens.colors.surfaceRaised } });
