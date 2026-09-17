import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export const AdminDashboardScreen: React.FC = () => {
  const { colors, token } = useTheme();
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
      fetchAdminData();
    } catch (err: any) {
      console.log('Error reviewing KYC:', err);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAdminData(); }} />}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.heading, { color: colors.textPrimary }]}>
        Administrative Audit Ledger & Operations
      </Text>
      <Text style={[styles.subheading, { color: colors.textSecondary }]}>
        Real-time monitoring of identity approvals, security logs, and marketplace statistics
      </Text>

      {loadError ? (
        <Card bordered>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{loadError}</Text>
          <Button title="Try Again" onPress={fetchAdminData} variant="outline" size="md" />
        </Card>
      ) : null}

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: colors.primary }]}>{stats?.total_users ?? '-'}</Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Users</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: colors.success }]}>{stats?.verified_artisans ?? '-'}</Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Verified Artisans</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: colors.warning }]}>{stats?.pending_kyc_count ?? '-'}</Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Pending KYC</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: colors.primary }]}>{stats?.total_bookings ?? '-'}</Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Bookings</Text>
        </Card>
      </View>

      {/* Pending Identity Verification Gate */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Pending Identity Verifications ({pendingKyc.length})
      </Text>

      {pendingKyc.length === 0 ? (
        <Card bordered style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            All artisan identity submissions have been reviewed. Zero pending approvals.
          </Text>
        </Card>
      ) : (
        pendingKyc.map(item => (
          <Card key={item.id} style={{ marginBottom: spacing.md }}>
            <View style={styles.kycRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <Badge label={`${item.id_type} Submission`} variant="pending" />
                  <Text style={[styles.kycDate, { color: colors.textMuted }]}>
                    #{item.id}
                  </Text>
                </View>
                <Text style={[styles.kycToken, { color: colors.textPrimary }]}>
                  Token: {item.id_token}
                </Text>
                <Text style={[styles.kycSub, { color: colors.textSecondary }]}>
                  Submitted on {new Date(item.submitted_at).toLocaleString()}
                </Text>
              </View>

              <View style={styles.kycActions}>
                <Button
                  title="Approve"
                  onPress={() => handleReviewKyc(item.id, true)}
                  variant="primary"
                  size="sm"
                />
                <Button
                  title="Reject"
                  onPress={() => handleReviewKyc(item.id, false)}
                  variant="outline"
                  size="sm"
                />
              </View>
            </View>
          </Card>
        ))
      )}

      {/* Security & System Audit Log Feed */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Administrative Audit Ledger ({auditLogs.length} events)
      </Text>

      {auditLogs.length === 0 ? (
        <Card bordered>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No audit log records available.
          </Text>
        </Card>
      ) : (
        auditLogs.map(log => (
          <View key={log.id} style={[styles.auditRow, { borderBottomColor: colors.divider }]}>
            <View style={styles.auditIconBg}>
              <Text style={{ fontSize: 14 }}>System</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Text style={[styles.actionText, { color: colors.primary }]}>{log.action}</Text>
                <Text style={[styles.auditTime, { color: colors.textMuted }]}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
                {log.details || 'System operation executed.'}
              </Text>
            </View>
          </View>
        ))
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
  heading: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metricCard: {
    width: '46%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  metricNumber: {
    fontSize: 26,
    fontWeight: typography.fontWeight.bold,
  },
  metricLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    padding: spacing.md,
  },
  kycRow: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  kycDate: {
    fontSize: typography.fontSize.xs,
  },
  kycToken: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  kycSub: {
    fontSize: typography.fontSize.xs,
  },
  kycActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  auditRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  auditIconBg: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  auditTime: {
    fontSize: typography.fontSize.xs,
  },
  detailsText: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  }
});
