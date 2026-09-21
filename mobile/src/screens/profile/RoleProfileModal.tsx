import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Divider,
  ExpandableText,
  SectionHeader,
  Sheet,
  Text,
} from '../../components/ui/foundation';
import { Icon, IconName } from '../../components/ui/Icon';

interface RoleProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const Hero: React.FC<{ icon: IconName; name: string; subtitle: string; children: React.ReactNode }> = ({ icon, name, subtitle, children }) => (
  <View style={styles.heroRow}>
    <View style={styles.avatarWrap}>
      <Icon name={icon} size={tokens.iconSizes.lg} color={tokens.colors.inverseText} />
    </View>
    <View style={styles.heroTextWrap}>
      <Text variant="heading" numberOfLines={1}>{name}</Text>
      <Text variant="meta" color={tokens.colors.textMuted} numberOfLines={1}>{subtitle}</Text>
      <View style={styles.badgeGroup}>{children}</View>
    </View>
  </View>
);

const Stat: React.FC<{ value: string; label: string; color?: string }> = ({ value, label, color = tokens.colors.text }) => (
  <Card style={styles.statCard}>
    <Text variant="heading" color={color} numberOfLines={1}>{value}</Text>
    <Text variant="meta" color={tokens.colors.textMuted} numberOfLines={1}>{label}</Text>
  </Card>
);

/** ListRow with a leading icon, which the foundation ListRow doesn't offer. */
const DetailRow: React.FC<{ icon: IconName; label: string; value: string; color?: string }> = ({ icon, label, value, color = tokens.colors.text }) => (
  <View style={styles.detailRow}>
    <Icon name={icon} size={tokens.iconSizes.sm} color={tokens.colors.textMuted} />
    <Text variant="body" color={tokens.colors.textMuted}>{label}</Text>
    <Text variant="body" color={color} style={styles.detailValue}>{value}</Text>
  </View>
);

export const RoleProfileModal: React.FC<RoleProfileModalProps> = ({ visible, onClose }) => {
  const { role, user, logoutSession } = useTheme();
  const [logoutConfirmVisible, setLogoutConfirmVisible] = React.useState(false);

  if (!user) {
    return (
      <Sheet visible={visible} title="Account Profile" onClose={onClose}>
        <View style={styles.emptyState}>
          <Icon name="account-off-outline" size={tokens.iconSizes.lg} color={tokens.colors.textMuted} />
          <Text variant="body" color={tokens.colors.textMuted} style={styles.emptyText}>
            Sign in to view your detailed role profile.
          </Text>
        </View>
      </Sheet>
    );
  }

  const artisanProfile = user.artisan_profile || {};
  const roleLabel = role === 'customer' ? 'Customer / Hirer' : role === 'artisan' ? 'Skilled Artisan' : 'System Admin';

  const renderCustomerProfile = () => (
    <>
      <Hero icon="account-circle-outline" name={user.name} subtitle={user.email}>
        <Badge label="Trusted customer" variant="success" size="sm" dot />
      </Hero>

      <View style={styles.statsGrid}>
        <Stat value="12" label="Jobs Posted" />
        <Stat value="9" label="Approved Hires" color={tokens.colors.success} />
      </View>

      <View>
        <SectionHeader title="Account Details" />
        <Card style={styles.detailList}>
          <DetailRow icon="map-marker-outline" label="Location" value={user.location_name || 'Keffi, Nasarawa State'} />
          <Divider />
          <DetailRow icon="phone-outline" label="Phone" value={user.phone || '+234 800 000 0000'} />
          <Divider />
          <DetailRow icon="shield-check-outline" label="Verification" value="ID verified" color={tokens.colors.success} />
        </Card>
      </View>
    </>
  );

  const renderArtisanProfile = () => (
    <>
      <Hero icon="hammer-wrench" name={user.name} subtitle={artisanProfile.trade_category || 'General Skilled Labor'}>
        <Badge label={artisanProfile.kyc_status === 'approved' ? 'KYC approved' : 'KYC pending'} variant={artisanProfile.kyc_status === 'approved' ? 'success' : 'warning'} size="sm" />
        <Badge label={artisanProfile.skill_test_status === 'passed' ? 'Skill passed' : 'Quiz pending'} variant={artisanProfile.skill_test_status === 'passed' ? 'accent' : 'warning'} size="sm" />
      </Hero>

      <View style={styles.statsGrid}>
        <Stat value={`${artisanProfile.years_experience || 3} yrs`} label="Experience" />
        <Stat value={(artisanProfile.rating_avg || 4.8).toFixed(1)} label="Rating" color={tokens.colors.accent} />
        <Stat value={`₦${(artisanProfile.hourly_rate || 3500).toLocaleString()}`} label="Hourly rate" color={tokens.colors.success} />
        <Stat value={artisanProfile.is_available !== false ? 'Open' : 'Busy'} label="Availability" color={tokens.colors.warning} />
      </View>

      <View>
        <SectionHeader title="Professional Summary" />
        <ExpandableText variant="body" color={tokens.colors.textMuted} lines={3}>
          {artisanProfile.bio || 'Dedicated trade professional committed to clean execution, fair pricing, punctual site attendance, and quality workmanship for every client request.'}
        </ExpandableText>
      </View>

      <View>
        <SectionHeader title="Work Details" />
        <Card style={styles.detailList}>
          <DetailRow icon="briefcase-outline" label="Trade" value={artisanProfile.trade_category || 'General Skilled Labor'} />
          <Divider />
          <DetailRow icon="map-marker-outline" label="Base" value={user.location_name || 'Keffi, Nasarawa State'} />
          <Divider />
          <DetailRow icon="star-outline" label="Reviews" value={`${artisanProfile.rating_count || 0} customer reviews`} />
        </Card>
      </View>
    </>
  );

  const renderAdminProfile = () => (
    <>
      <Hero icon="shield-crown-outline" name={user.name} subtitle={user.email}>
        <Badge label="Platform admin" variant="success" size="sm" dot />
      </Hero>

      <View style={styles.statsGrid}>
        <Stat value="24/7" label="Monitoring" />
        <Stat value="98%" label="Compliance" color={tokens.colors.success} />
      </View>

      <View>
        <SectionHeader title="Operational Scope" />
        <Card style={styles.detailList}>
          <DetailRow icon="clipboard-check-outline" label="Verification" value="Review NIN/BVN submissions" />
          <Divider />
          <DetailRow icon="account-group-outline" label="Users" value="Manage customer and artisan access" />
          <Divider />
          <DetailRow icon="shield-alert-outline" label="Security" value="Monitor audit logs and disputes" />
        </Card>
      </View>
    </>
  );

  return (
    <Sheet
      visible={visible}
      title={`${roleLabel} Profile`}
      onClose={onClose}
      footer={
        <View style={styles.footerActions}>
          <Button label="Close" onPress={onClose} variant="outline" style={styles.footerAction} />
          <Button
            label="Log out"
            onPress={() => setLogoutConfirmVisible(true)}
            variant="danger"
            style={styles.footerAction}
          />
        </View>
      }
    >
      {role === 'customer' ? renderCustomerProfile() : role === 'artisan' ? renderArtisanProfile() : renderAdminProfile()}

      <ConfirmDialog
        visible={logoutConfirmVisible}
        title="Log out?"
        message="You will need to sign in again to post jobs, bid, or manage bookings."
        confirmLabel="Log out"
        destructive
        onCancel={() => setLogoutConfirmVisible(false)}
        onConfirm={() => { setLogoutConfirmVisible(false); logoutSession(); onClose(); }}
      />
    </Sheet>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing[6],
    gap: tokens.spacing[3],
  },
  emptyText: {
    textAlign: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[4],
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: tokens.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.inverse,
  },
  // minWidth: 0 lets a long name or email truncate instead of widening the row.
  heroTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: tokens.spacing[1],
  },
  badgeGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[2],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[3],
  },
  // Two per row: flexBasis under half leaves room for the gap, flexGrow fills it back.
  statCard: {
    flexGrow: 1,
    flexBasis: '40%',
    minWidth: 0,
    gap: tokens.spacing[1],
  },
  detailList: {
    gap: tokens.spacing[1],
  },
  detailRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  detailValue: {
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
  },
  footerActions: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
  },
  footerAction: {
    flex: 1,
  },
});
