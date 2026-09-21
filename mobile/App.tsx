import './src/dev/overflowDebug'; // DEV ONLY: flags any View wider than the window. Must stay first.
import React, { useState } from 'react';
import './global.css';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { tokens } from './src/theme/tokens';
import { Button, FLOATING_TAB_BAR_SPACE, FloatingTabBar, Header, IconButton, ToastProvider } from './src/components/ui/foundation';
import { IconName } from './src/components/ui/Icon';
import { HomeScreen } from './src/screens/customer/HomeScreen';
import { ArtisanDetailModal } from './src/screens/customer/ArtisanDetailModal';
import { CreateBookingModal } from './src/screens/customer/CreateBookingModal';
import { CustomerBookingsScreen } from './src/screens/customer/CustomerBookingsScreen';
import { ArtisanDashboardScreen } from './src/screens/artisan/ArtisanDashboardScreen';
import { AdminDashboardScreen } from './src/screens/admin/AdminDashboardScreen';
import { AuthModal } from './src/screens/auth/AuthModal';
import { RoleProfileModal } from './src/screens/profile/RoleProfileModal';
import { RoleSwitcherSheet } from './src/screens/profile/RoleSwitcherSheet';
import { FontGate } from './src/FontGate';
import { DevShowcase } from './src/dev/DevShowcase';

type Tab = { value: string; label: string; icon: IconName };

/** Tab values are unchanged from the legacy TabBar; only the labels are shortened for the pill. */
const ROLE_TABS: Record<string, Tab[]> = {
  customer: [
    { value: 'explore', label: 'Explore', icon: 'magnify' },
    { value: 'my_jobs', label: 'My Jobs', icon: 'clipboard-text-outline' },
  ],
  artisan: [{ value: 'feed', label: 'Job Feed', icon: 'hammer-wrench' }],
  admin: [{ value: 'admin', label: 'Audit Hub', icon: 'chart-box-outline' }],
};

const ACCOUNT_TAB = 'account';

const ROLE_LABEL: Record<string, string> = {
  customer: 'Customer (Hirer)',
  artisan: 'Artisan Workspace',
  admin: 'System Admin',
};

const ROLE_SHORT: Record<string, string> = {
  customer: 'Customer',
  artisan: 'Artisan',
  admin: 'Admin',
};

const ROLE_ICON: Record<string, IconName> = {
  customer: 'account-outline',
  artisan: 'hammer-wrench',
  admin: 'chart-box-outline',
};

const MainApp = () => {
  const { role, user, authVisible, openAuth, closeAuth, requireAuth } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('explore');
  const [selectedArtisan, setSelectedArtisan] = useState<any | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [createBookingVisible, setCreateBookingVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [roleSwitcherVisible, setRoleSwitcherVisible] = useState(false);
  const [showcaseVisible, setShowcaseVisible] = useState(false);

  const handleSelectArtisan = (artisan: any) => {
    setSelectedArtisan(artisan);
    setDetailModalVisible(true);
  };

  const handleBookFromDetail = (artisan: any) => {
    setSelectedArtisan(artisan);
    requireAuth(() => setCreateBookingVisible(true));
  };

  // Signed in opens the profile, otherwise auth.
  const handleAccountPress = () => {
    if (user) {
      setProfileModalVisible(true);
      return;
    }
    openAuth();
  };

  // Falls back to the role's first tab when the stored one isn't available: another
  // role's tab after a login, or My Jobs after signing out.
  const roleTabs = ROLE_TABS[role] ?? [];
  const canShow = (tab: Tab) => tab.value !== 'my_jobs' || Boolean(user);
  const currentTab = roleTabs.find(tab => tab.value === activeTab && canShow(tab))?.value ?? roleTabs[0]?.value ?? activeTab;

  const tabs: Tab[] = [
    ...roleTabs,
    {
      value: ACCOUNT_TAB,
      label: user ? user.name.split(' ')[0] : 'Log In',
      icon: user ? 'account-circle-outline' : 'login-variant',
    },
  ];

  // The account tab always opens auth rather than switching screens, as before.
  const handleTabChange = (tab: string) => {
    if (tab === ACCOUNT_TAB) {
      openAuth();
      return;
    }
    // My Jobs is per-account: signed out, send them to sign in and land there afterwards.
    if (tab === 'my_jobs') {
      requireAuth(() => setActiveTab(tab));
      return;
    }
    setActiveTab(tab);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={tokens.colors.background} />

      <Header
        title="ArtisanHub"
        subtitle={ROLE_LABEL[role]}
        align="left"
        onTitleLongPress={__DEV__ ? () => setShowcaseVisible(true) : undefined}
        right={
          <View style={styles.headerActions}>
            {/* Global role switcher: in the header, so it is reachable from every screen. */}
            <Button
              label={ROLE_SHORT[role]}
              icon={ROLE_ICON[role]}
              onPress={() => setRoleSwitcherVisible(true)}
              variant="secondary"
              size="sm"
            />
            <IconButton
              name={user ? 'account-circle-outline' : 'login-variant'}
              onPress={handleAccountPress}
              variant={user ? 'surface' : 'inverse'}
              accessibilityLabel={user ? 'Open profile' : 'Sign in'}
            />
          </View>
        }
      />

      <View style={styles.bodyContainer}>
        {role === 'customer' ? (
          currentTab === 'explore' ? (
            <HomeScreen
              onSelectArtisan={handleSelectArtisan}
              onCreateJobPress={() => requireAuth(() => setCreateBookingVisible(true))}
            />
          ) : (
            <CustomerBookingsScreen />
          )
        ) : role === 'artisan' ? (
          <ArtisanDashboardScreen />
        ) : (
          <AdminDashboardScreen />
        )}
      </View>

      <FloatingTabBar activeTab={currentTab} onTabChange={handleTabChange} tabs={tabs} />

      {/* Modals */}
      <ArtisanDetailModal
        artisan={selectedArtisan}
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        onBookPress={handleBookFromDetail}
      />

      <CreateBookingModal
        visible={createBookingVisible}
        preselectedArtisan={selectedArtisan}
        onClose={() => setCreateBookingVisible(false)}
        onSuccess={() => setActiveTab('my_jobs')}
      />

      <AuthModal
        visible={authVisible}
        onClose={closeAuth}
      />

      <RoleProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />

      <RoleSwitcherSheet
        visible={roleSwitcherVisible}
        onClose={() => setRoleSwitcherVisible(false)}
      />

      {__DEV__ && showcaseVisible ? <DevShowcase onClose={() => setShowcaseVisible(false)} /> : null}
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <FontGate>
        <ThemeProvider>
          <ToastProvider>
            <MainApp />
          </ToastProvider>
        </ThemeProvider>
      </FontGate>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  bodyContainer: {
    flex: 1,
    // Keeps screen content clear of the floating tab bar without editing each screen.
    paddingBottom: FLOATING_TAB_BAR_SPACE,
  },
});
