import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { spacing, typography, borderRadius } from '../../theme/spacing';

interface CreateBookingModalProps {
  visible: boolean;
  preselectedArtisan?: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EMERGENCY_LEVELS = [
  { id: 'low', label: 'Standard (1-3 days)', color: '#10B981' },
  { id: 'medium', label: 'Urgent (Within 24 hrs)', color: '#F59E0B' },
  { id: 'high', label: 'Immediate Emergency', color: '#EF4444' }
];

export const CreateBookingModal: React.FC<CreateBookingModalProps> = ({
  visible,
  preselectedArtisan,
  onClose,
  onSuccess
}) => {
  const { colors, token } = useTheme();
  const [skills, setSkills] = useState<any[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('Highland Quarters, Keffi');
  const [emergencyLevel, setEmergencyLevel] = useState('medium');
  const [budget, setBudget] = useState('5000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSkills()
      .then(res => {
        setSkills(res);
        if (res.length > 0) {
          if (preselectedArtisan?.artisan_profile?.trade_category) {
            const match = res.find((s: any) => s.name.toLowerCase().includes(preselectedArtisan.artisan_profile.trade_category.toLowerCase()));
            setSelectedSkillId(match ? match.id : res[0].id);
          } else {
            setSelectedSkillId(res[0].id);
          }
        }
      })
      .catch(err => console.log('Error loading skills:', err));
  }, [visible, preselectedArtisan]);

  const handleSubmit = async () => {
    if (!title || !description || !selectedSkillId) {
      setError('Please fill in job title, description, and trade skill.');
      return;
    }
    if (!token) {
      setError('You must log in as a customer to post a job request.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.createBooking(
        {
          skill_id: selectedSkillId,
          title,
          description,
          address,
          emergency_level: emergencyLevel,
          budget: parseFloat(budget) || 4000.0,
        },
        token
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit service request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} title="Post Service Request" onClose={onClose}>
      <ScrollView style={{ maxHeight: 500 }}>
        {error ? (
          <Text style={[styles.errorBox, { backgroundColor: colors.dangerBackground, color: colors.danger }]}>
            {error}
          </Text>
        ) : null}

        <Text style={[styles.label, { color: colors.textSecondary }]}>Required Trade Skill</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skillScroll}>
          {skills.map(s => {
            const isSelected = selectedSkillId === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSelectedSkillId(s.id)}
                style={[
                  styles.skillPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.inputBackground,
                    borderColor: isSelected ? colors.primary : colors.inputBorder,
                  }
                ]}
              >
                <Text style={[styles.skillText, { color: isSelected ? '#FFFFFF' : colors.textPrimary }]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Input
          label="Job Title"
          placeholder="e.g. Leaking Garden Pipe Connector"
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label="Detailed Description"
          placeholder="Describe the labor required, materials needed, or symptoms..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ height: 70, textAlignVertical: 'top' }}
        />

        <Input
          label="Service Address / Location"
          placeholder="e.g. GRA Road, Keffi"
          value={address}
          onChangeText={setAddress}
        />

        <Input
          label="Target Budget (₦)"
          placeholder="5000"
          keyboardType="numeric"
          value={budget}
          onChangeText={setBudget}
        />

        <Text style={[styles.label, { color: colors.textSecondary, marginTop: spacing.md }]}>Urgency / Emergency Level</Text>
        <View style={styles.urgencyContainer}>
          {EMERGENCY_LEVELS.map(lvl => {
            const isSel = emergencyLevel === lvl.id;
            return (
              <TouchableOpacity
                key={lvl.id}
                onPress={() => setEmergencyLevel(lvl.id)}
                style={[
                  styles.urgencyPill,
                  {
                    backgroundColor: isSel ? colors.primaryLight : colors.inputBackground,
                    borderColor: isSel ? colors.primary : colors.inputBorder,
                  }
                ]}
              >
                <Text style={[styles.urgencyText, { color: isSel ? colors.primary : colors.textSecondary }]}>
                  {lvl.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Button
            title="Publish Service Request"
            onPress={handleSubmit}
            loading={loading}
            variant="primary"
            size="lg"
          />
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  errorBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  skillScroll: {
    marginBottom: spacing.md,
  },
  skillPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  skillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  urgencyContainer: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  urgencyPill: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  urgencyText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  }
});
