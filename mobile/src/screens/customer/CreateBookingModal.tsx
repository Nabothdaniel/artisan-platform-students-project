import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { Button, Chip, Input, Sheet, Text, useToast } from '../../components/ui/foundation';
import { api } from '../../services/api';

interface CreateBookingModalProps {
  visible: boolean;
  preselectedArtisan?: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EMERGENCY_LEVELS = [
  { id: 'low', label: 'Standard (1-3 days)' },
  { id: 'medium', label: 'Urgent (Within 24 hrs)' },
  { id: 'high', label: 'Immediate Emergency' }
];

export const CreateBookingModal: React.FC<CreateBookingModalProps> = ({
  visible,
  preselectedArtisan,
  onClose,
  onSuccess
}) => {
  const { token } = useTheme();
  const toast = useToast();
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
      toast.success('Job posted. Artisans can now send you quotes.');
    } catch (err: any) {
      setError(err.message || 'Failed to submit service request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      title="Post Service Request"
      onClose={onClose}
      footer={
        <Button
          label="Publish Service Request"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
        />
      }
    >
      {error ? <Text variant="body" color={tokens.colors.danger}>{error}</Text> : null}

      <View style={styles.group}>
        <Text variant="meta" color={tokens.colors.textMuted}>Required Trade Skill</Text>
        <ScrollView
          horizontal
          bounces={false}
          showsHorizontalScrollIndicator={false}
          style={styles.skillScroll}
          contentContainerStyle={styles.chips}
        >
          {skills.map(s => (
            <Chip
              key={s.id}
              label={s.name}
              selected={selectedSkillId === s.id}
              onPress={() => setSelectedSkillId(s.id)}
            />
          ))}
        </ScrollView>
      </View>

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
      />

      {/* Two short paired fields share a row to save a whole field's height. */}
      <View style={styles.fieldRow}>
        <Input
          label="Address"
          placeholder="GRA Road, Keffi"
          value={address}
          onChangeText={setAddress}
          containerStyle={styles.fieldHalf}
        />
        <Input
          label="Budget (₦)"
          placeholder="5000"
          keyboardType="numeric"
          value={budget}
          onChangeText={setBudget}
          containerStyle={styles.fieldHalf}
        />
      </View>

      <View style={styles.group}>
        <Text variant="meta" color={tokens.colors.textMuted}>Urgency / Emergency Level</Text>
        <View style={styles.urgency}>
          {EMERGENCY_LEVELS.map(lvl => (
            <Chip
              key={lvl.id}
              label={lvl.label}
              selected={emergencyLevel === lvl.id}
              onPress={() => setEmergencyLevel(lvl.id)}
            />
          ))}
        </View>
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  group: {
    gap: tokens.spacing[2],
  },
  skillScroll: {
    flexGrow: 0,
  },
  chips: {
    gap: tokens.spacing[2],
  },
  fieldRow: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
  },
  // minWidth: 0 keeps each half from growing past its share of the row.
  fieldHalf: {
    flex: 1,
    minWidth: 0,
  },
  urgency: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[2],
  },
});
