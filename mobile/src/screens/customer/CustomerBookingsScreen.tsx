import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { RatingStars } from '../../components/ui/RatingStars';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { api } from '../../services/api';
import { spacing, typography, borderRadius } from '../../theme/spacing';

export const CustomerBookingsScreen: React.FC = () => {
  const { colors, token } = useTheme();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadError, setLoadError] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await api.getBookings({ my_jobs: true }, token || undefined);
      setBookings(data);
    } catch (err) {
      setLoadError('We could not load your jobs. Check your connection and try again.');
      console.log('Error fetching customer bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const handleAcceptBid = async (bookingId: number, bidId: number) => {
    if (!token) return;
    try {
      await api.acceptBid(bookingId, bidId, token);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to accept bid.');
    }
  };

  const handleMarkCompleted = async (bookingId: number) => {
    if (!token) return;
    try {
      await api.updateBookingStatus(bookingId, 'completed', token);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const openReviewModal = (booking: any) => {
    setSelectedBooking(booking);
    setRating(5);
    setComment('');
    setErrorMsg('');
    setReviewModalVisible(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedBooking || !token) return;
    try {
      setSubmittingReview(true);
      setErrorMsg('');
      await api.submitReview(
        {
          booking_id: selectedBooking.id,
          rating,
          comment,
        },
        token
      );
      setReviewModalVisible(false);
      setRating(5);
      setComment('');
      setSelectedBooking(null);
      fetchBookings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit rating.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} />}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>My Posted Jobs & Bids</Text>

      {loading ? (
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading jobs...</Text>
      ) : loadError ? (
        <Card bordered>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{loadError}</Text>
          <Button title="Try Again" onPress={fetchBookings} variant="outline" size="md" />
        </Card>
      ) : bookings.length === 0 ? (
        <Card bordered>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            You haven't posted any service requests yet. Tap "+ Post Job" on the Home tab to get quotes from verified artisans.
          </Text>
        </Card>
      ) : (
        bookings.map(booking => {
          const bids = booking.bids || [];
          const isCompleted = booking.status === 'completed';
          const isAccepted = booking.status === 'accepted' || booking.status === 'in_progress';

          return (
            <Card key={booking.id}>
              <View style={styles.bookingHeader}>
                <Text style={[styles.bookingTitle, { color: colors.textPrimary }]}>{booking.title}</Text>
                <Badge
                  label={booking.status.toUpperCase()}
                  variant={isCompleted ? 'verified' : isAccepted ? 'category' : 'pending'}
                />
              </View>

              <Text style={[styles.description, { color: colors.textSecondary }]}>{booking.description}</Text>
              <Text style={[styles.locationText, { color: colors.textMuted }]}>
                {booking.address} • Budget: ₦{(booking.budget || 0).toLocaleString()}
              </Text>

              {/* Bids List Section */}
              <View style={[styles.bidsSection, { borderTopColor: colors.divider }]}>
                <Text style={[styles.bidsTitle, { color: colors.textPrimary }]}>
                  Artisan Price Quotes / Bids ({bids.length})
                </Text>

                {bids.length === 0 ? (
                  <Text style={[styles.noBidsText, { color: colors.textMuted }]}>
                    Waiting for trade artisans to inspect request and place price bids...
                  </Text>
                ) : (
                  bids.map((bid: any) => (
                    <View key={bid.id} style={[styles.bidCard, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                      <View style={styles.bidHeader}>
                        <Text style={[styles.bidArtisan, { color: colors.textPrimary }]}>
                          Artisan #{bid.artisan_id}
                        </Text>
                        <Text style={[styles.bidPrice, { color: colors.primary }]}>
                          ₦{(bid.proposed_price || 0).toLocaleString()}
                        </Text>
                      </View>
                      <Text style={[styles.bidNotes, { color: colors.textSecondary }]}>
                        Est. Time: {bid.estimated_hours} hr(s) • "{bid.notes || 'Ready to execute work'}"
                      </Text>

                      {booking.status === 'requested' || booking.status === 'bidding_open' ? (
                        <Button
                          title="Accept Bid & Confirm Price"
                          onPress={() => handleAcceptBid(booking.id, bid.id)}
                          variant="primary"
                          size="sm"
                          style={{ marginTop: spacing.xs }}
                        />
                      ) : bid.status === 'accepted' ? (
                        <Badge label="Accepted Quote" variant="verified" style={{ marginTop: spacing.xs }} />
                      ) : null}
                    </View>
                  ))
                )}
              </View>

              {/* Status Actions */}
              {isAccepted ? (
                <Button
                  title="Mark Work as Completed"
                  onPress={() => handleMarkCompleted(booking.id)}
                  variant="outline"
                  size="md"
                  style={{ marginTop: spacing.md }}
                />
              ) : isCompleted && !booking.review ? (
                <Button
                  title="Rate & Review Artisan"
                  onPress={() => openReviewModal(booking)}
                  variant="primary"
                  size="md"
                  style={{ marginTop: spacing.md }}
                />
              ) : null}
            </Card>
          );
        })
      )}

      {/* Leave Review Modal */}
      <Modal visible={reviewModalVisible} title="Rate Artisan Service" onClose={() => setReviewModalVisible(false)}>
        {errorMsg ? (
          <Text style={[styles.errorBox, { backgroundColor: colors.dangerBackground, color: colors.danger }]}>
            {errorMsg}
          </Text>
        ) : null}

        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
          How satisfied were you with the quality of craftsmanship, speed, and professionalism?
        </Text>

        <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
          <RatingStars rating={rating} onRatingChange={setRating} size={32} showText={false} />
          <Text style={[styles.ratingLabel, { color: colors.accent }]}>{rating} out of 5 Stars</Text>
        </View>

        <Input
          label="Review Feedback Comment"
          placeholder="e.g. Excellent work, neat pipe work and polite behavior."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          style={{ height: 70, textAlignVertical: 'top' }}
        />

        <Button
          title="Submit Rating"
          onPress={handleReviewSubmit}
          loading={submittingReview}
          variant="primary"
          size="lg"
          style={{ marginTop: spacing.lg }}
        />
      </Modal>
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
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.lg,
  },
  loadingText: {
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    padding: spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  bookingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },
  description: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  locationText: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.md,
  },
  bidsSection: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  bidsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  noBidsText: {
    fontSize: typography.fontSize.xs,
    fontStyle: 'italic',
  },
  bidCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  bidArtisan: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  bidPrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  bidNotes: {
    fontSize: typography.fontSize.xs,
    marginVertical: spacing.xs,
  },
  errorBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  ratingLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.xs,
  }
});
