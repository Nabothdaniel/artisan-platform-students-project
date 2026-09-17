import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { SkillQuizModal } from './SkillQuizModal';
import { KYCModal } from './KYCModal';
import { api } from '../../services/api';
import { spacing, typography, borderRadius } from '../../theme/spacing';

export const ArtisanDashboardScreen: React.FC = () => {
  const { colors, token, user } = useTheme();
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
    setBidModalVisible(true);
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
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>Artisan Workspace & Job Feed</Text>

      {/* Verification Gate Cards */}
      <Card style={styles.verificationCard}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          Identity & Trade Verification Gates
        </Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Complete mandatory NIN/BVN verification and trade skill competency testing to get verified.
        </Text>

        <View style={styles.gateRow}>
          <View style={styles.gateItem}>
            <View style={styles.gateStatusRow}>
              <Text style={[styles.gateName, { color: colors.textPrimary }]}>NIN/BVN Identity</Text>
              <Badge
                label={isKycApproved ? 'APPROVED' : 'PENDING'}
                variant={isKycApproved ? 'verified' : 'pending'}
              />
            </View>
            {!isKycApproved && (
              <Button
                title="Verify NIN/BVN"
                onPress={() => setKycModalVisible(true)}
                variant="outline"
                size="sm"
                style={{ marginTop: spacing.xs }}
              />
            )}
          </View>

          <View style={[styles.gateDivider, { backgroundColor: colors.divider }]} />

          <View style={styles.gateItem}>
            <View style={styles.gateStatusRow}>
              <Text style={[styles.gateName, { color: colors.textPrimary }]}>Competency Test</Text>
              <Badge
                label={isSkillPassed ? 'PASSED' : 'NOT PASSED'}
                variant={isSkillPassed ? 'passed' : 'pending'}
              />
            </View>
            {!isSkillPassed && (
              <Button
                title="Take Skill Quiz"
                onPress={() => setQuizModalVisible(true)}
                variant="outline"
                size="sm"
                style={{ marginTop: spacing.xs }}
              />
            )}
          </View>
        </View>
      </Card>

      {/* Active Submitted Bids & Jobs */}
      {myBidsBookings.length > 0 && (
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            My Active Bids & Assigned Jobs ({myBidsBookings.length})
          </Text>
          {myBidsBookings.map(job => (
            <Card key={job.id}>
              <View style={styles.jobHeader}>
                <Text style={[styles.jobTitle, { color: colors.textPrimary }]}>{job.title}</Text>
                <Badge label={job.status.toUpperCase()} variant={job.status === 'accepted' ? 'verified' : 'category'} />
              </View>
              <Text style={[styles.jobDesc, { color: colors.textSecondary }]}>{job.description}</Text>
              <Text style={[styles.jobMeta, { color: colors.textMuted }]}>
                {job.address} • Agreed Price: ₦{(job.agreed_price || job.budget || 0).toLocaleString()}
              </Text>
            </Card>
          ))}
        </View>
      )}

      {/* Open Customer Jobs Feed */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Open Service Requests ({openJobs.length})
      </Text>

      {loading ? (
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading open jobs...</Text>
      ) : errorMessage ? (
        <Card bordered>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{errorMessage}</Text>
          <Button title="Try Again" onPress={loadData} variant="outline" size="md" />
        </Card>
      ) : openJobs.length === 0 ? (
        <Card bordered>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No open customer job requests at the moment. Pull down to refresh.
          </Text>
        </Card>
      ) : (
        openJobs.map(job => (
          <Card key={job.id}>
            <View style={styles.jobHeader}>
              <Text style={[styles.jobTitle, { color: colors.textPrimary }]}>{job.title}</Text>
              <Badge
                label={job.emergency_level ? job.emergency_level.toUpperCase() : 'STANDARD'}
                variant={job.emergency_level === 'high' ? 'emergency' : 'category'}
              />
            </View>

            <Text style={[styles.jobDesc, { color: colors.textSecondary }]}>{job.description}</Text>
            <Text style={[styles.jobMeta, { color: colors.textMuted }]}>
              {job.address} • Target Budget: ₦{(job.budget || 0).toLocaleString()}
            </Text>

            <View style={[styles.jobFooter, { borderTopColor: colors.divider }]}>
              <Text style={[styles.bidsCount, { color: colors.textSecondary }]}>
                {(job.bids || []).length} Bids Submitted
              </Text>
              <Button
                title="Submit Price Quote"
                onPress={() => handleOpenBidModal(job)}
                variant="primary"
                size="sm"
              />
            </View>
          </Card>
        ))
      )}

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

      {/* Submit Bid Modal */}
      <Modal visible={bidModalVisible} title="Submit Price Bid Quote" onClose={() => setBidModalVisible(false)}>
        {bidError ? (
          <Text style={[styles.errorBox, { backgroundColor: colors.dangerBackground, color: colors.danger }]}>
            {bidError}
          </Text>
        ) : null}

        {selectedJob && (
          <View>
            <Text style={[styles.modalJobTitle, { color: colors.textPrimary }]}>{selectedJob.title}</Text>
            <Text style={[styles.modalJobMeta, { color: colors.textMuted }]}>
              Customer Budget: ₦{(selectedJob.budget || 0).toLocaleString()}
            </Text>

            <Input
              label="Your Negotiable Proposed Price (₦)"
              placeholder="3800"
              keyboardType="numeric"
              value={proposedPrice}
              onChangeText={setProposedPrice}
            />

            <Input
              label="Estimated Duration (Hours)"
              placeholder="2"
              keyboardType="numeric"
              value={estimatedHours}
              onChangeText={setEstimatedHours}
            />

            <Input
              label="Negotiation Notes / Proposal Details"
              placeholder="Explain materials supplied, availability, or experience..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={{ height: 65, textAlignVertical: 'top' }}
            />

            <Button
              title="Submit Price Quote"
              onPress={handleSubmitBid}
              loading={submittingBid}
              variant="primary"
              size="lg"
              style={{ marginTop: spacing.lg }}
            />
          </View>
        )}
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
  verificationCard: {
    marginBottom: spacing.xl,
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.md,
  },
  gateRow: {
    gap: spacing.md,
  },
  gateItem: {
    flex: 1,
  },
  gateStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  gateName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  gateDivider: {
    height: 1,
    width: '100%',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  loadingText: {
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    padding: spacing.md,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  jobTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },
  jobDesc: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  jobMeta: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.md,
  },
  jobFooter: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  bidsCount: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  modalJobTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  modalJobMeta: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.md,
  },
  errorBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  }
});
