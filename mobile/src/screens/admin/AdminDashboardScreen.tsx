import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  SectionHeader,
  Skeleton,
  Text,
  useToast,
} from '../../components/ui/foundation';
import { Icon } from '../../components/ui/Icon';
import { api } from '../../services/api';

export const AdminDashboardScreen: React.FC = () => {
  const { token } = useTheme();
  const toast = useToast();
  const [stats, setStats] = useState<any>(null);
  const [pendingKyc, setPendingKyc] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [statsRes, kycRes, logsRes] = await Promise.allSettled([
        api.getAdminStats(token || undefined),
        api.getPendingKYC(token || undefined),
        api.getAuditLogs(token || undefined),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (kycRes.status === 'fulfilled') setPendingKyc(kycRes.value);
      if (logsRes.status === 'fulfilled') setAuditLogs(logsRes.value);
    } catch (err) {
      setLoadError('We could not load the admin workspace. Check your connection and try again.');
      console.log('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleReviewKyc = async (kycId: number, approved: boolean) => {
    try {
      await api.approveKYC(kycId, approved, approved ? 'Verified by Admin review' : 'Rejected NIN/BVN token', token || undefined);
      toast.success(approved ? 'KYC approved.' : 'KYC rejected.');
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Could not save the KYC review.');
      console.log('Error reviewing KYC:', err);
    }
  };

  const metrics = [
    { label: 'Total users', value: stats?.total_users, color: tokens.colors.text },
    { label: 'Verified artisans', value: stats?.verified_artisans, color: tokens.colors.success },
    { label: 'Pending KYC', value: stats?.pending_kyc_count, color: tokens.colors.warning },
    { label: 'Total bookings', value: stats?.total_bookings, color: tokens.colors.text },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={tokens.colors.textMuted}
          onRefresh={() => { setRefreshing(true); fetchAdminData(); }}
        />
      }
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.titleBlock}>
        <Text variant="title">Audit Hub</Text>
        <Text variant="body" color={tokens.colors.textMuted}>
          Identity approvals, security logs, and marketplace statistics.
        </Text>
      </View>

      {loadError ? (
        <Card>
          <EmptyState title="Couldn't load the admin workspace" description={loadError} />
          <Button label="Try Again" onPress={fetchAdminData} variant="outline" />
        </Card>
      ) : null}

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {metrics.map(metric => (
          <Card key={metric.label} style={styles.metricCard}>
            {loading && metric.value === undefined ? (
              <Skeleton width={48} height={38} />
            ) : (
              <Text variant="title" color={metric.color}>{metric.value ?? '-'}</Text>
            )}
            <Text variant="meta" color={tokens.colors.textMuted}>{metric.label}</Text>
          </Card>
        ))}
      </View>

      {/* Pending Identity Verification Gate */}
      <View style={styles.section}>
        <SectionHeader title={`Pending verifications (${pendingKyc.length})`} />

        {pendingKyc.length === 0 ? (
          <Card>
            <EmptyState
              title="All caught up"
              description="All artisan identity submissions have been reviewed. Zero pending approvals."
            />
          </Card>
        ) : (
          <View style={styles.list}>
            {pendingKyc.map(item => (
              <Card key={item.id} style={styles.cardBody}>
                <View style={styles.spreadRow}>
                  <Badge label={`${item.id_type} submission`} variant="warning" size="sm" dot />
                  <Text variant="meta" color={tokens.colors.textMuted}>#{item.id}</Text>
                </View>

                <View style={styles.kycInfo}>
                  <Text variant="subheading">Token: {item.id_token}</Text>
                  <Text variant="meta" color={tokens.colors.textMuted}>
                    Submitted on {new Date(item.submitted_at).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.kycActions}>
                  <Button
                    label="Approve"
                    onPress={() => handleReviewKyc(item.id, true)}
                    size="sm"
                    style={styles.kycAction}
                  />
                  <Button
                    label="Reject"
                    onPress={() => handleReviewKyc(item.id, false)}
                    variant="outline"
                    size="sm"
                    style={styles.kycAction}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* Security & System Audit Log Feed */}
      <View style={styles.section}>
        <SectionHeader title={`Audit ledger (${auditLogs.length} events)`} />

        {auditLogs.length === 0 ? (
          <Card>
            <EmptyState title="No audit records" description="No audit log records available." />
          </Card>
        ) : (
          <Card style={styles.cardBody}>
            {auditLogs.map((log, index) => (
              <React.Fragment key={log.id}>
                {index > 0 ? <Divider /> : null}
                <View style={styles.auditRow}>
                  <View style={styles.auditIconBg}>
                    <Icon name="shield-check-outline" size={tokens.iconSizes.sm} color={tokens.colors.textMuted} />
                  </View>
                  <View style={styles.auditText}>
                    <View style={styles.spreadRow}>
                      <Text variant="body" color={tokens.colors.accent} style={styles.auditAction}>{log.action}</Text>
                      <Text variant="meta" color={tokens.colors.textMuted}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                    <Text variant="meta" color={tokens.colors.textMuted}>
                      {log.details || 'System operation executed.'}
                    </Text>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </Card>
        )}
      </View>
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[3],
  },
  // Two per row: grow from a basis under half so the gap never forces a wrap to one column.
  metricCard: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 0,
    gap: tokens.spacing[1],
  },
  spreadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing[2],
  },
  kycInfo: {
    gap: tokens.spacing[1],
  },
  kycActions: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  kycAction: {
    flex: 1,
  },
  auditRow: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
  },
  auditIconBg: {
    width: 36,
    height: 36,
    borderRadius: tokens.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  // minWidth: 0 lets long log details wrap instead of widening the row.
  auditText: {
    flex: 1,
    minWidth: 0,
    gap: tokens.spacing[1],
  },
  auditAction: {
    flex: 1,
    minWidth: 0,
    fontFamily: tokens.typography.fontFamily.semibold,
  },
});
