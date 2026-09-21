import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  ExpandableText,
  Rating,
  SectionHeader,
  Sheet,
  Skeleton,
  Text,
} from '../../components/ui/foundation';
import { Icon, IconName } from '../../components/ui/Icon';
import { api } from '../../services/api';

/** One line of the key-facts card: round icon, label, value. */
const FactRow: React.FC<{ icon: IconName; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.factRow}>
    <View style={styles.factIcon}>
      <Icon name={icon} size={tokens.iconSizes.sm} color={tokens.colors.textMuted} />
    </View>
    <Text variant="body" color={tokens.colors.textMuted}>{label}</Text>
    <Text variant="body" numberOfLines={1} style={styles.factValue}>{value}</Text>
  </View>
);

interface ArtisanDetailModalProps {
  artisan: any | null;
  visible: boolean;
  onClose: () => void;
  onBookPress: (artisan: any) => void;
}

export const ArtisanDetailModal: React.FC<ArtisanDetailModalProps> = ({
  artisan,
  visible,
  onClose,
  onBookPress
}) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (artisan?.id) {
      setLoadingReviews(true);
      api.getArtisanReviews(artisan.id)
        .then(res => setReviews(res))
        .catch(err => console.log('Error fetching reviews:', err))
        .finally(() => setLoadingReviews(false));
    }
  }, [artisan]);

  if (!artisan) return null;

  const profile = artisan.artisan_profile || {};
  const isVerified = profile.kyc_status === 'approved';
  const testPassed = profile.skill_test_status === 'passed';

  return (
    <Sheet
      visible={visible}
      title="Artisan details"
      onClose={onClose}
      footer={
        <Button
          label={`Book ${artisan.name.split(' ')[0]}`}
          onPress={() => { onClose(); onBookPress(artisan); }}
          size="lg"
        />
      }
    >
      {/* Header Profile Info */}
      <View style={styles.profileHeader}>
        <Avatar name={artisan.name} size={64} verified={isVerified} />
        <View style={styles.profileInfo}>
          <Text variant="heading" numberOfLines={1}>{artisan.name}</Text>
          <Rating value={profile.rating_avg || 5.0} count={profile.rating_count || 0} />
        </View>
      </View>

      <View style={styles.badgeRow}>
        {isVerified ? (
          <Badge label="NIN/BVN Verified" variant="success" size="sm" dot />
        ) : (
          <Badge label="Unverified ID" variant="warning" size="sm" />
        )}
        {testPassed ? (
          <Badge label="Skill Test Passed" variant="accent" size="sm" />
        ) : (
          <Badge label="Skill Quiz Pending" variant="warning" size="sm" />
        )}
      </View>

      {/* Key facts */}
      <Card style={styles.facts}>
        <FactRow icon="briefcase-outline" label="Trade" value={profile.trade_category || 'General Skilled Labor'} />
        <Divider />
        <FactRow icon="map-marker-outline" label="Location" value={artisan.location_name || 'Keffi'} />
        <Divider />
        <FactRow icon="clipboard-check-outline" label="Experience" value={`${profile.years_experience || 3} Yrs`} />
      </Card>

      {/* Price row */}
      <Card style={styles.priceRow}>
        <View style={styles.priceLabel}>
          <Text variant="subheading">Hourly rate</Text>
          <Text variant="meta" color={tokens.colors.textMuted}>Final price is agreed in the booking</Text>
        </View>
        <View style={styles.priceValue}>
          <Text variant="heading">₦{(profile.hourly_rate || 3500).toLocaleString()}</Text>
          <Text variant="meta" color={tokens.colors.textMuted}>per hour</Text>
        </View>
      </Card>

      {/* Bio */}
      <View>
        <SectionHeader title="About" />
        <ExpandableText variant="body" color={tokens.colors.textMuted} lines={3}>
          {profile.bio || 'Professional and background-verified artisan dedicated to providing high quality craftsmanship, punctual service delivery, and reliable job completion.'}
        </ExpandableText>
      </View>

      {/* Customer Reviews Section */}
      <View style={styles.reviews}>
        <SectionHeader title={`Customer Reviews (${reviews.length})`} />

        {loadingReviews ? (
          <Card style={styles.review}>
            <Skeleton width="50%" />
            <Skeleton />
          </Card>
        ) : reviews.length === 0 ? (
          <Text variant="meta" color={tokens.colors.textMuted}>No reviews submitted yet for this artisan.</Text>
        ) : (
          reviews.map(rev => (
            <Card key={rev.id} style={styles.review}>
              <View style={styles.reviewHeader}>
                <Text variant="subheading" numberOfLines={1} style={styles.reviewerName}>
                  Customer #{rev.customer_id}
                </Text>
                <Rating value={rev.rating} />
              </View>
              {rev.comment && (
                <ExpandableText variant="meta" color={tokens.colors.textMuted} lines={4}>
                  "{rev.comment}"
                </ExpandableText>
              )}
            </Card>
          ))
        )}
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[4],
  },
  // minWidth: 0 lets a long name truncate instead of widening the row.
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[2],
  },
  facts: {
    gap: tokens.spacing[2],
  },
  factRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  factIcon: {
    width: 36,
    height: 36,
    borderRadius: tokens.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  factValue: {
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing[3],
  },
  priceLabel: {
    flex: 1,
    minWidth: 0,
  },
  priceValue: {
    alignItems: 'flex-end',
  },
  reviews: {
    gap: tokens.spacing[2],
  },
  review: {
    gap: tokens.spacing[1],
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing[2],
  },
  reviewerName: {
    flex: 1,
    minWidth: 0,
  },
});
