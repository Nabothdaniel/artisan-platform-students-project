import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import {
  Badge,
  BadgeVariant,
  Button,
  Card,
  Divider,
  EmptyState,
  Input,
  Rating,
  Sheet,
  Skeleton,
  Text,
  useToast,
} from '../../components/ui/foundation';
import { api } from '../../services/api';

const STATUS_LABEL: Record<string, string> = {
  requested: 'Requested',
  bidding_open: 'Bidding open',
  accepted: 'Accepted',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const statusVariant = (status: string): BadgeVariant =>
  status === 'completed' ? 'success'
    : status === 'accepted' || status === 'in_progress' ? 'accent'
      : status === 'cancelled' ? 'danger'
        : 'warning';

export const CustomerBookingsScreen: React.FC = () => {
  const { token, requireAuth } = useTheme();
  const toast = useToast();
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
    if (!token) return requireAuth();
    try {
      await api.acceptBid(bookingId, bidId, token);
      toast.success('Bid accepted.');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept bid.');
    }
  };

  const handleMarkCompleted = async (bookingId: number) => {
    if (!token) return requireAuth();
    try {
      await api.updateBookingStatus(bookingId, 'completed', token);
      toast.success('Job marked as completed.');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status.');
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
      toast.success('Thanks — your review was submitted.');
      fetchBookings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit rating.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={tokens.colors.textMuted}
          onRefresh={() => { setRefreshing(true); fetchBookings(); }}
        />
      }
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.titleBlock}>
        <Text variant="title">My Jobs</Text>
        <Text variant="body" color={tokens.colors.textMuted}>Your posted jobs and the bids on them.</Text>
      </View>

      {loading ? (
        <View style={styles.list}>
          {[0, 1].map(i => (
            <Card key={i} style={styles.cardBody}>
              <Skeleton width="70%" height={20} />
              <Skeleton />
              <Skeleton width="50%" height={12} />
            </Card>
          ))}
        </View>
      ) : loadError ? (
        <Card>
          <EmptyState title="Couldn't load your jobs" description={loadError} />
          <Button label="Try Again" onPress={fetchBookings} variant="outline" />
        </Card>
      ) : bookings.length === 0 ? (
        <Card>
          <EmptyState
            title="No jobs yet"
            description={'Tap "Post a Job" on the Explore tab to get quotes from verified artisans.'}
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {bookings.map(booking => {
            const bids = booking.bids || [];
            const isCompleted = booking.status === 'completed';
            const isAccepted = booking.status === 'accepted' || booking.status === 'in_progress';
            const canAcceptBids = booking.status === 'requested' || booking.status === 'bidding_open';

            return (
              <Card key={booking.id} style={styles.cardBody}>
                <View style={styles.bookingHeader}>
                  <Text variant="subheading" style={styles.bookingTitle}>{booking.title}</Text>
                  <Badge
                    label={STATUS_LABEL[booking.status] ?? booking.status}
                    variant={statusVariant(booking.status)}
                    size="sm"
                  />
                </View>

                <Text variant="body" color={tokens.colors.textMuted}>{booking.description}</Text>

                <View style={styles.metaRow}>
                  <Text variant="meta" color={tokens.colors.textMuted} style={styles.address} numberOfLines={2}>
                    {booking.address}
                  </Text>
                  <View style={styles.budget}>
                    <Text variant="heading">₦{(booking.budget || 0).toLocaleString()}</Text>
                    <Text variant="meta" color={tokens.colors.textMuted}>budget</Text>
                  </View>
                </View>

                <Divider dashed />

                {/* Bids */}
                <Text variant="subheading">Bids ({bids.length})</Text>

                {bids.length === 0 ? (
                  <Text variant="meta" color={tokens.colors.textMuted}>
                    Waiting for artisans to review your request and place bids.
                  </Text>
                ) : (
                  bids.map((bid: any) => (
                    <View key={bid.id} style={styles.bidCard}>
                      <View style={styles.bidHeader}>
                        <Text variant="body" style={styles.bidArtisan}>Artisan #{bid.artisan_id}</Text>
                        <Text variant="subheading" color={tokens.colors.accent}>
                          ₦{(bid.proposed_price || 0).toLocaleString()}
                        </Text>
                      </View>
                      <Text variant="meta" color={tokens.colors.textMuted}>
                        Est. {bid.estimated_hours} hr(s) • "{bid.notes || 'Ready to execute work'}"
                      </Text>

                      {canAcceptBids ? (
                        <Button
                          label="Accept Bid"
                          onPress={() => handleAcceptBid(booking.id, bid.id)}
                          size="sm"
                        />
                      ) : bid.status === 'accepted' ? (
                        <Badge label="Accepted quote" variant="success" size="sm" dot />
                      ) : null}
                    </View>
                  ))
                )}

                {/* Status Actions */}
                {isAccepted ? (
                  <Button
                    label="Mark Work as Completed"
                    onPress={() => handleMarkCompleted(booking.id)}
                    variant="outline"
                  />
                ) : isCompleted && !booking.review ? (
                  <Button
                    label="Rate & Review Artisan"
                    onPress={() => openReviewModal(booking)}
                  />
                ) : null}
              </Card>
            );
          })}
        </View>
      )}

      {/* Leave Review Sheet */}
      <Sheet
        visible={reviewModalVisible}
        title="Rate Artisan Service"
        onClose={() => setReviewModalVisible(false)}
        footer={
          <Button
            label="Submit Rating"
            onPress={handleReviewSubmit}
            loading={submittingReview}
            size="lg"
          />
        }
      >
        {errorMsg ? <Text variant="body" color={tokens.colors.danger}>{errorMsg}</Text> : null}

        <Text variant="body" color={tokens.colors.textMuted} style={styles.centered}>
          How satisfied were you with the quality of craftsmanship, speed, and professionalism?
        </Text>

        <View style={styles.ratingPicker}>
          <Rating value={rating} onChange={setRating} size={tokens.iconSizes.lg} />
          <Text variant="subheading" color={tokens.colors.accent}>{rating} out of 5 stars</Text>
        </View>

        <Input
          label="Review comment"
          placeholder="e.g. Excellent work, neat pipe work and polite behavior."
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
        />
      </Sheet>
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
  titleBlock: {
    gap: tokens.spacing[1],
  },
  list: {
    gap: tokens.spacing[3],
  },
  cardBody: {
    gap: tokens.spacing[3],
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing[2],
  },
  // minWidth: 0 lets a long title wrap inside the row instead of pushing the badge out.
  bookingTitle: {
    flex: 1,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: tokens.spacing[3],
  },
  address: {
    flex: 1,
    minWidth: 0,
  },
  budget: {
    alignItems: 'flex-end',
  },
  bidCard: {
    padding: tokens.spacing[3],
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surfaceRaised,
    gap: tokens.spacing[2],
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  bidArtisan: {
    flex: 1,
    minWidth: 0,
  },
  centered: {
    textAlign: 'center',
  },
  ratingPicker: {
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
});
