import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { Header } from './src/components/ui/Header';
import { TabBar } from './src/components/ui/TabBar';
import { HomeScreen } from './src/screens/customer/HomeScreen';
import { ArtisanDetailModal } from './src/screens/customer/ArtisanDetailModal';
import { CreateBookingModal } from './src/screens/customer/CreateBookingModal';
import { CustomerBookingsScreen } from './src/screens/customer/CustomerBookingsScreen';
import { ArtisanDashboardScreen } from './src/screens/artisan/ArtisanDashboardScreen';
import { AdminDashboardScreen } from './src/screens/admin/AdminDashboardScreen';
import { AuthModal } from './src/screens/auth/AuthModal';

const MainApp = () => {
  const { colors, isDarkMode, role, token } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('explore');
  const [selectedArtisan, setSelectedArtisan] = useState<any | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [createBookingVisible, setCreateBookingVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const handleSelectArtisan = (artisan: any) => {
    setSelectedArtisan(artisan);
    setDetailModalVisible(true);
  };

  const handleBookFromDetail = (artisan: any) => {
    setSelectedArtisan(artisan);
    if (token) {
      setCreateBookingVisible(true);
    } else {
      setAuthModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.cardBackground} />
      
      {/* Top Header with Role Switcher & Theme Toggle */}
      <Header onOpenAuth={() => setAuthModalVisible(true)} />

      {/* Dynamic Screen View */}
      <View style={styles.bodyContainer}>
        {role === 'customer' ? (
          activeTab === 'explore' ? (
            <HomeScreen
              onSelectArtisan={handleSelectArtisan}
              onCreateJobPress={() => token ? setCreateBookingVisible(true) : setAuthModalVisible(true)}
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

      {/* Bottom Navigation Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAuth={() => setAuthModalVisible(true)}
      />

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
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  bodyContainer: {
    flex: 1,
  }
});
