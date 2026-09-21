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
  SectionHeader,
  Sheet,
  Skeleton,
  Text,
  useToast,
} from '../../components/ui/foundation';
import { SkillQuizModal } from './SkillQuizModal';
import { KYCModal } from './KYCModal';
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

const EMERGENCY_LABEL: Record<string, string> = {
  low: 'Low urgency',
  medium: 'Medium urgency',
  high: 'Urgent',
};

export const ArtisanDashboardScreen: React.FC = () => {
  const { token, user, requireAuth } = useTheme();
  const toast = useToast();
  const [openJobs, setOpenJobs] = useState<any[]>([]);
  const [myBidsBookings, setMyBidsBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  // Bid form
  const [proposedPrice, setProposedPrice] = useState('3800');
  const [estimatedHours, setEstimatedHours] = useState('2');
  const [notes, setNotes] = useState('I can supply high quality fittings and execute neatly.');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidError, setBidError] = useState('');

  const [meProfile, setMeProfile] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      if (token) {
        const me = await api.getMe(token);
        setMeProfile(me);
        const myJobs = await api.getBookings({ my_jobs: true }, token);
        setMyBidsBookings(myJobs);
      }

      const available = await api.getBookings();
      setOpenJobs(available.filter((b: any) => b.status === 'requested' || b.status === 'bidding_open'));
    } catch (err) {
      setErrorMessage('We could not load your workspace. Check your connection and try again.');
      console.log('Error loading artisan dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleOpenBidModal = (job: any) => {
    setSelectedJob(job);
    setProposedPrice(job.budget ? job.budget.toString() : '4000');
    requireAuth(() => setBidModalVisible(true));
  };

  const handleSubmitBid = async () => {
    if (!selectedJob || !token) return;
    try {
      setSubmittingBid(true);
      setBidError('');
      await api.submitBid(
        selectedJob.id,
        {
          proposed_price: parseFloat(proposedPrice) || 3500.0,
          estimated_hours: parseInt(estimatedHours) || 2,
          notes,
        },
        token
      );
      setBidModalVisible(false);
      toast.success('Quote sent to the customer.');
      loadData();
    } catch (err: any) {
      setBidError(err.message || 'Failed to submit bid quote.');
    } finally {
      setSubmittingBid(false);
    }
  };

  const artisanProfile = meProfile?.artisan_profile || user?.artisan_profile || {};
  const isKycApproved = artisanProfile.kyc_status === 'approved';
  const isSkillPassed = artisanProfile.skill_test_status === 'passed';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={tokens.colors.textMuted}
          onRefresh={() => { setRefreshing(true); loadData(); }}
        />
      }
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.titleBlock}>
        <Text variant="title">Job Feed</Text>
        <Text variant="body" color={tokens.colors.textMuted}>Get verified, then quote on open customer jobs.</Text>
      </View>

      {/* Verification Gates */}
      <Card style={styles.cardBody}>
        <View style={styles.cardIntro}>
          <Text variant="subheading">Identity & Trade Verification</Text>
          <Text variant="meta" color={tokens.colors.textMuted}>
            Complete mandatory NIN/BVN verification and trade skill competency testing to get verified.
          </Text>
        </View>

        <View style={styles.gateStatusRow}>
          <Text variant="body" style={styles.rowText}>NIN/BVN Identity</Text>
          <Badge
            label={isKycApproved ? 'Approved' : 'Pending'}
            variant={isKycApproved ? 'success' : 'warning'}
            size="sm"
            dot
          />
        </View>
        {!isKycApproved && (
          <Button
            label="Verify NIN/BVN"
            onPress={() => requireAuth(() => setKycModalVisible(true))}
            variant="outline"
            size="sm"
          />
        )}

        <Divider />

        <View style={styles.gateStatusRow}>
          <Text variant="body" style={styles.rowText}>Competency Test</Text>
          <Badge
            label={isSkillPassed ? 'Passed' : 'Not passed'}
            variant={isSkillPassed ? 'accent' : 'warning'}
            size="sm"
            dot
          />
        </View>
        {!isSkillPassed && (
          <Button
            label="Take Skill Quiz"
            onPress={() => requireAuth(() => setQuizModalVisible(true))}
            variant="outline"
            size="sm"
          />
        )}
      </Card>

      {/* Active Submitted Bids & Jobs */}
      {myBidsBookings.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title={`My bids & jobs (${myBidsBookings.length})`} />
          <View style={styles.list}>
            {myBidsBookings.map(job => (
              <Card key={job.id} style={styles.cardBody}>
                <View style={styles.jobHeader}>
                  <Text variant="subheading" style={styles.rowText}>{job.title}</Text>
                  <Badge label={STATUS_LABEL[job.status] ?? job.status} variant={statusVariant(job.status)} size="sm" />
                </View>
                <Text variant="body" color={tokens.colors.textMuted}>{job.description}</Text>
                <View style={styles.metaRow}>
                  <Text variant="meta" color={tokens.colors.textMuted} style={styles.rowText} numberOfLines={2}>
                    {job.address}
                  </Text>
                  <View style={styles.amount}>
                    <Text variant="heading">₦{(job.agreed_price || job.budget || 0).toLocaleString()}</Text>
                    <Text variant="meta" color={tokens.colors.textMuted}>agreed price</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* Open Customer Jobs Feed */}
      <View style={styles.section}>
        <SectionHeader title={loading ? 'Open requests' : `${openJobs.length} open requests`} />

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
        ) : errorMessage ? (
          <Card>
            <EmptyState title="Couldn't load your workspace" description={errorMessage} />
            <Button label="Try Again" onPress={loadData} variant="outline" />
          </Card>
        ) : openJobs.length === 0 ? (
          <Card>
            <EmptyState
              title="No open requests"
              description="No open customer job requests at the moment. Pull down to refresh."
            />
          </Card>
        ) : (
          <View style={styles.list}>
            {openJobs.map(job => (
              <Card key={job.id} style={styles.cardBody}>
                <View style={styles.jobHeader}>
                  <Text variant="subheading" style={styles.rowText}>{job.title}</Text>
                  <Badge
                    label={job.emergency_level ? (EMERGENCY_LABEL[job.emergency_level] ?? job.emergency_level) : 'Standard'}
                    variant={job.emergency_level === 'high' ? 'danger' : 'neutral'}
                    size="sm"
                  />
                </View>

                <Text variant="body" color={tokens.colors.textMuted}>{job.description}</Text>

                <View style={styles.metaRow}>
                  <Text variant="meta" color={tokens.colors.textMuted} style={styles.rowText} numberOfLines={2}>
                    {job.address}
                  </Text>
                  <View style={styles.amount}>
                    <Text variant="heading">₦{(job.budget || 0).toLocaleString()}</Text>
                    <Text variant="meta" color={tokens.colors.textMuted}>target budget</Text>
                  </View>
                </View>

                <Divider dashed />

                <View style={styles.jobFooter}>
                  <Text variant="meta" color={tokens.colors.textMuted} style={styles.rowText}>
                    {(job.bids || []).length} bids submitted
                  </Text>
                  <Button label="Submit Quote" onPress={() => handleOpenBidModal(job)} size="sm" />
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* Quiz Modal */}
      <SkillQuizModal
        visible={quizModalVisible}
        onClose={() => setQuizModalVisible(false)}
        onSuccess={loadData}
      />

      {/* KYC Modal */}
      <KYCModal
        visible={kycModalVisible}
        onClose={() => setKycModalVisible(false)}
        onSuccess={loadData}
      />

      {/* Submit Bid Sheet */}
      <Sheet
        visible={bidModalVisible}
        title="Submit Price Quote"
        onClose={() => setBidModalVisible(false)}
        footer={
          selectedJob ? (
            <Button
              label="Submit Price Quote"
              onPress={handleSubmitBid}
              loading={submittingBid}
              size="lg"
            />
          ) : undefined
        }
      >
        {bidError ? <Text variant="body" color={tokens.colors.danger}>{bidError}</Text> : null}

        {selectedJob && (
          <>
            <View style={styles.cardIntro}>
              <Text variant="subheading">{selectedJob.title}</Text>
              <Text variant="meta" color={tokens.colors.textMuted}>
                Customer budget: ₦{(selectedJob.budget || 0).toLocaleString()}
              </Text>
            </View>

            <Input
              label="Your proposed price (₦)"
              placeholder="3800"
              keyboardType="numeric"
              value={proposedPrice}
              onChangeText={setProposedPrice}
            />

            <Input
              label="Estimated duration (hours)"
              placeholder="2"
              keyboardType="numeric"
              value={estimatedHours}
              onChangeText={setEstimatedHours}
            />

            <Input
              label="Notes / proposal details"
              placeholder="Explain materials supplied, availability, or experience..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </>
        )}
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
  section: {
    gap: tokens.spacing[2],
  },
  list: {
    gap: tokens.spacing[3],
  },
  cardBody: {
    gap: tokens.spacing[3],
  },
  cardIntro: {
    gap: tokens.spacing[1],
  },
  gateStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  // minWidth: 0 lets long text wrap inside the row instead of pushing its neighbour out.
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: tokens.spacing[3],
  },
  amount: {
    alignItems: 'flex-end',
  },
  jobFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing[3],
  },
});
