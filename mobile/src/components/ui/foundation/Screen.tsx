import React from 'react';
import { ScrollView, StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/tokens';

interface ScreenProps extends ViewProps { scroll?: boolean; }
export const Screen: React.FC<ScreenProps> = ({ children, scroll = false, style, ...props }) => <SafeAreaView edges={['top', 'bottom']} style={styles.safe}><View {...props} style={[styles.container, style]}>{scroll ? <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView> : children}</View></SafeAreaView>;
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: tokens.colors.background }, container: { flex: 1, backgroundColor: tokens.colors.background }, content: { paddingHorizontal: tokens.spacing[5], paddingBottom: tokens.spacing[8] } });
