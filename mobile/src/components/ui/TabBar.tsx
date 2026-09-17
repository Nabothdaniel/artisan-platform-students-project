import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius, spacing, typography } from '../../theme/spacing';
import { Icon, IconName } from './Icon';

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAuth: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, onOpenAuth }) => {
  const { colors, role, user } = useTheme();

  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor: colors.cardBackground,
        borderTopColor: colors.cardBorder,
      }
    ]}>
      {role === 'customer' ? (
        <>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onTabChange('explore')}
            style={styles.tabItem}
          >
            <Icon name="magnify" size={21} color={activeTab === 'explore' ? colors.primary : colors.textMuted} />
            <Text style={[
              styles.tabLabel,
              { color: activeTab === 'explore' ? colors.primary : colors.textMuted }
            ]}>
              Explore Artisans
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onTabChange('my_jobs')}
            style={styles.tabItem}
          >
            <Icon name="clipboard-text-outline" size={21} color={activeTab === 'my_jobs' ? colors.primary : colors.textMuted} />
            <Text style={[
              styles.tabLabel,
              { color: activeTab === 'my_jobs' ? colors.primary : colors.textMuted }
            ]}>
              My Jobs & Bids
            </Text>
          </TouchableOpacity>
        </>
      ) : role === 'artisan' ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTabChange('feed')}
          style={styles.tabItem}
        >
          <Icon name="hammer-wrench" size={21} color={activeTab === 'feed' ? colors.primary : colors.textMuted} />
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'feed' ? colors.primary : colors.textMuted }
          ]}>
            Job Feed & Verification
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTabChange('admin')}
          style={styles.tabItem}
        >
          <Icon name="chart-box-outline" size={21} color={activeTab === 'admin' ? colors.primary : colors.textMuted} />
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'admin' ? colors.primary : colors.textMuted }
          ]}>
            Audit & Verification Hub
          </Text>
        </TouchableOpacity>
      )}

      {/* Account Login Session Tab */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onOpenAuth}
        style={styles.tabItem}
      >
        <Icon name={user ? 'account-circle-outline' : 'login-variant'} size={21} color={user ? colors.primary : colors.textMuted} />
        <Text style={[styles.tabLabel, { color: user ? colors.primary : colors.textMuted }]}>
          {user ? user.name.split(' ')[0] : 'Log In'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 2,
  }
});
