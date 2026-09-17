import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { RatingStars } from '../../components/ui/RatingStars';
import { api } from '../../services/api';
import { spacing, typography } from '../../theme/spacing';

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
  const { colors } = useTheme();
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
    <Modal visible={visible} title="Artisan Profile" onClose={onClose}>
      <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingBottom: spacing.md }}>
        {/* Header Profile Info */}
        <View style={styles.profileHeader}>
          <Avatar name={artisan.name} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{artisan.name}</Text>
            <Text style={[styles.trade, { color: colors.textSecondary }]}>
              {profile.trade_category || 'General Skilled Labor'} • {artisan.location_name || 'Keffi'}
            </Text>
            <View style={styles.badgeRow}>
              {isVerified ? (
                <Badge label="NIN/BVN Verified" variant="verified" />
              ) : (
                <Badge label="Unverified ID" variant="pending" />
              )}
              {testPassed ? (
                <Badge label="Skill Test Passed" variant="passed" />
              ) : (
                <Badge label="Skill Quiz Pending" variant="pending" />
              )}
            </View>
          </View>
        </View>

        {/* Pricing & Experience Stat Box */}
        <View style={[styles.statsContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              ₦{(profile.hourly_rate || 3500).toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Hourly Rate</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {profile.years_experience || 3} Yrs
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Experience</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              {(profile.rating_avg || 5.0).toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {profile.rating_count || 0} Reviews
            </Text>
          </View>
        </View>

        {/* Bio */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About Artisan</Text>
        <Text style={[styles.bio, { color: colors.textSecondary }]}>
          {profile.bio || 'Professional and background-verified artisan dedicated to providing high quality craftsmanship, punctual service delivery, and reliable job completion.'}
        </Text>

        {/* Customer Reviews Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: spacing.lg }]}>
          Customer Reviews ({reviews.length})
        </Text>

        {loadingReviews ? (
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading reviews...</Text>
        ) : reviews.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No reviews submitted yet for this artisan.</Text>
        ) : (
          reviews.map(rev => (
            <Card key={rev.id} style={{ marginVertical: spacing.xs }}>
              <View style={styles.reviewHeader}>
                <Text style={[styles.reviewerName, { color: colors.textPrimary }]}>
                  Customer #{rev.customer_id}
                </Text>
                <RatingStars rating={rev.rating} size={14} />
              </View>
              {rev.comment && (
                <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>
                  "{rev.comment}"
                </Text>
              )}
            </Card>
          ))
        )}

        {/* Hire Action */}
        <View style={{ marginTop: spacing.xl }}>
          <Button
            title={`Book Service Request with ${artisan.name.split(' ')[0]}`}
            onPress={() => { onClose(); onBookPress(artisan); }}
            variant="primary"
            size="lg"
          />
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  trade: {
    fontSize: typography.fontSize.sm,
    marginVertical: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  bio: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.base,
  },
  loadingText: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.xs,
    fontStyle: 'italic',
    marginVertical: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reviewerName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  reviewComment: {
    fontSize: typography.fontSize.xs,
    fontStyle: 'italic',
  }
});
