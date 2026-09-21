import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  Input,
  Rating,
  SectionHeader,
  Skeleton,
  Text,
} from '../../components/ui/foundation';
import { Icon } from '../../components/ui/Icon';
import { api } from '../../services/api';

const CATEGORIES = ['All', 'Plumbing', 'Electrical', 'Carpentry', 'Masonry', 'Auto Mechanics'];

interface HomeScreenProps {
  onSelectArtisan: (artisan: any) => void;
  onCreateJobPress: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectArtisan, onCreateJobPress }) => {
  const { user } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [artisans, setArtisans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchArtisans = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await api.getArtisans({
        trade_category: selectedCategory === 'All' ? undefined : selectedCategory,
        verified_only: verifiedOnly ? true : undefined,
        search: searchQuery || undefined,
      });
      setArtisans(data);
    } catch (err) {
      setErrorMessage('We could not load artisans. Check your connection and try again.');
      console.log('Error fetching artisans:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArtisans();
  }, [selectedCategory, verifiedOnly]);

  const handleSearchSubmit = () => {
    fetchArtisans();
  };

  const firstName = user?.name ? String(user.name).split(' ')[0] : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={tokens.colors.textMuted}
          onRefresh={() => { setRefreshing(true); fetchArtisans(); }}
        />
      }
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text variant="title">{firstName ? `Hello, ${firstName}!` : 'Hello!'}</Text>
        <Text variant="body" color={tokens.colors.textMuted}>
          Hire trusted, verified artisans near you.
        </Text>
      </View>

      {/* Search + post a job */}
      <View style={styles.searchRow}>
        <Input
          variant="inverse"
          placeholder="Search artisans"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
          leftIcon={<Icon name="magnify" size={tokens.iconSizes.sm} color={tokens.colors.textMuted} />}
          containerStyle={styles.search}
        />
        <Button label="Post a Job" icon="briefcase-outline" onPress={onCreateJobPress} variant="secondary" size="sm" />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        bounces={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Chip
          label="Verified only"
          variant="accent-dot"
          selected={verifiedOnly}
          onPress={() => setVerifiedOnly(!verifiedOnly)}
        />
        {CATEGORIES.map(cat => (
          <Chip
            key={cat}
            label={cat}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
          />
        ))}
      </ScrollView>

      {/* Artisans Section */}
      <SectionHeader title={loading ? 'Available artisans' : `${artisans.length} artisans available`} />

      {loading ? (
        <View style={styles.list}>
          {[0, 1, 2].map(i => (
            <Card key={i} style={styles.cardBody}>
              <View style={styles.artisanHeader}>
                <Skeleton width={48} height={48} style={styles.skeletonAvatar} />
                <View style={styles.skeletonLines}>
                  <Skeleton width="60%" />
                  <Skeleton width="40%" height={12} />
                </View>
              </View>
              <Skeleton />
              <Skeleton width="80%" />
            </Card>
          ))}
        </View>
      ) : errorMessage ? (
        <Card>
          <EmptyState title="Couldn't load artisans" description={errorMessage} />
          <Button label="Try Again" onPress={fetchArtisans} variant="outline" />
        </Card>
      ) : artisans.length === 0 ? (
        <Card>
          <EmptyState
            title="No artisans found"
            description="Try searching for other trades or reset your filters."
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {artisans.map(artisan => {
            const profile = artisan.artisan_profile || {};
            const isVerified = profile.kyc_status === 'approved';
            const testPassed = profile.skill_test_status === 'passed';

            return (
              <Card key={artisan.id} onPress={() => onSelectArtisan(artisan)} style={styles.cardBody}>
                <View style={styles.artisanHeader}>
                  <Avatar name={artisan.name} size={48} verified={isVerified} />
                  <View style={styles.artisanInfo}>
                    <Text variant="subheading" numberOfLines={1}>{artisan.name}</Text>
                    <Text variant="meta" color={tokens.colors.textMuted} numberOfLines={1}>
                      {profile.trade_category || 'General Skilled Labor'} • {artisan.location_name || 'Keffi'}
                    </Text>
                  </View>
                </View>

                <Rating value={profile.rating_avg || 5.0} count={profile.rating_count || 0} />

                {isVerified || testPassed ? (
                  <View style={styles.badges}>
                    {isVerified ? <Badge label="NIN/BVN Verified" variant="success" size="sm" dot /> : null}
                    {testPassed ? <Badge label="Skill Quiz Passed" variant="accent" size="sm" /> : null}
                  </View>
                ) : null}

                <Text variant="body" color={tokens.colors.textMuted} numberOfLines={2}>
                  {profile.bio || 'Experienced trade artisan available for residential & commercial service bookings.'}
                </Text>

                <Divider dashed />

                <View style={styles.artisanFooter}>
                  <View style={styles.rate}>
                    <Text variant="heading">₦{(profile.hourly_rate || 3500).toLocaleString()}</Text>
                    <Text variant="meta" color={tokens.colors.textMuted}>per hour</Text>
                  </View>
                  <Button label="View & Hire" onPress={() => onSelectArtisan(artisan)} variant="secondary" size="sm" />
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  contentContainer: {
    paddingHorizontal: tokens.spacing[5],
    paddingTop: tokens.spacing[2],
    paddingBottom: tokens.spacing[6],
    gap: tokens.spacing[4],
  },
  greeting: {
    gap: tokens.spacing[1],
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  search: {
    flex: 1,
    minWidth: 0,
  },
  chips: {
    gap: tokens.spacing[2],
  },
  list: {
    gap: tokens.spacing[3],
  },
  cardBody: {
    gap: tokens.spacing[3],
  },
  artisanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  // minWidth: 0 lets long names truncate instead of widening the row.
  artisanInfo: {
    flex: 1,
    minWidth: 0,
    gap: tokens.spacing[1],
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[2],
  },
  artisanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  rate: {
    flexShrink: 1,
  },
  skeletonAvatar: {
    borderRadius: tokens.radii.full,
  },
  skeletonLines: {
    flex: 1,
    gap: tokens.spacing[2],
  },
});
