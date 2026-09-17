import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { RatingStars } from '../../components/ui/RatingStars';
import { api } from '../../services/api';
import { spacing, typography, borderRadius } from '../../theme/spacing';
import { Icon } from '../../components/ui/Icon';

const CATEGORIES = ['All', 'Plumbing', 'Electrical', 'Carpentry', 'Masonry', 'Auto Mechanics'];

interface HomeScreenProps {
  onSelectArtisan: (artisan: any) => void;
  onCreateJobPress: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectArtisan, onCreateJobPress }) => {
  const { colors } = useTheme();
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchArtisans(); }} />}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Search & Actions Bar */}
      <View style={styles.searchSection}>
        <Input
          placeholder="Search artisan name, trade, or location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          leftIcon={<Icon name="magnify" size={18} color={colors.textMuted} />}
          containerStyle={{ flex: 1 }}
        />
        <Button
          title="Post a Job"
          onPress={onCreateJobPress}
          variant="primary"
          size="md"
        />
      </View>

      {/* Verified Only Toggle */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setVerifiedOnly(!verifiedOnly)}
          style={[
            styles.verifiedToggle,
            {
              backgroundColor: verifiedOnly ? colors.badgeVerifiedBg : colors.inputBackground,
              borderColor: verifiedOnly ? colors.success : colors.inputBorder,
            }
          ]}
        >
          <Icon name={verifiedOnly ? 'check-circle-outline' : 'shield-check-outline'} size={17} color={verifiedOnly ? colors.success : colors.textSecondary} />
          <Text style={[styles.verifiedText, { color: verifiedOnly ? colors.badgeVerifiedText : colors.textSecondary }]}>
            Verified Artisans Only (NIN/BVN)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories Horizontal Scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              activeOpacity={0.7}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryPill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.cardBackground,
                  borderColor: isSelected ? colors.primary : colors.cardBorder,
                }
              ]}
            >
              <Text style={[
                styles.categoryText,
                { color: isSelected ? '#FFFFFF' : colors.textSecondary }
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Artisans Section */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Available Trade Artisans ({artisans.length})
      </Text>

      {loading ? (
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading verified artisans...</Text>
      ) : errorMessage ? (
        <Card bordered>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{errorMessage}</Text>
          <Button title="Try Again" onPress={fetchArtisans} variant="outline" size="md" />
        </Card>
      ) : artisans.length === 0 ? (
        <Card bordered>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No artisans found matching selected filters. Try searching for other trades or reset filters.
          </Text>
        </Card>
      ) : (
        artisans.map(artisan => {
          const profile = artisan.artisan_profile || {};
          const isVerified = profile.kyc_status === 'approved';
          const testPassed = profile.skill_test_status === 'passed';

          return (
            <Card key={artisan.id} onPress={() => onSelectArtisan(artisan)}>
              <View style={styles.artisanHeader}>
                <Avatar name={artisan.name} size={50} />
                <View style={styles.artisanInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.artisanName, { color: colors.textPrimary }]}>
                      {artisan.name}
                    </Text>
                    {isVerified && <Badge label="NIN/BVN Verified" variant="verified" />}
                  </View>
                  <Text style={[styles.tradeText, { color: colors.textSecondary }]}>
                    {profile.trade_category || 'General Skilled Labor'} • {artisan.location_name || 'Keffi'}
                  </Text>
                  <View style={styles.ratingRow}>
                    <RatingStars rating={profile.rating_avg || 5.0} size={14} />
                    <Text style={[styles.reviewsCount, { color: colors.textMuted }]}>
                      ({profile.rating_count || 0} reviews)
                    </Text>
                    {testPassed && <Badge label="Skill Quiz Passed" variant="passed" style={{ marginLeft: spacing.xs }} />}
                  </View>
                </View>
              </View>

              <Text style={[styles.bioText, { color: colors.textSecondary }]} numberOfLines={2}>
                {profile.bio || 'Experienced trade artisan available for residential & commercial service bookings.'}
              </Text>

              <View style={[styles.artisanFooter, { borderTopColor: colors.divider }]}>
                <Text style={[styles.rateText, { color: colors.primary }]}>
                  ₦{(profile.hourly_rate || 3500).toLocaleString()}<Text style={styles.rateUnit}>/hr</Text>
                </Text>
                <Button title="View Details & Hire" onPress={() => onSelectArtisan(artisan)} variant="secondary" size="sm" />
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  searchSection: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterRow: {
    marginBottom: spacing.md,
  },
  verifiedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  verifiedText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  categoriesScroll: {
    marginBottom: spacing.lg,
  },
  categoryPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    padding: spacing.md,
  },
  artisanHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  artisanInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  artisanName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  tradeText: {
    fontSize: typography.fontSize.sm,
    marginVertical: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  reviewsCount: {
    fontSize: typography.fontSize.xs,
  },
  bioText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    marginBottom: spacing.md,
  },
  artisanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  rateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  rateUnit: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
  }
});
