import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';
import { spacing, typography, borderRadius } from '../../theme/spacing';
import { Icon } from '../../components/ui/Icon';

interface SkillQuizModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SkillQuizModal: React.FC<SkillQuizModalProps> = ({ visible, onClose, onSuccess }) => {
  const { colors, token } = useTheme();
  const [skills, setSkills] = useState<any[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<any | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible) {
      api.getSkills()
        .then(res => {
          setSkills(res);
          if (res.length > 0) setSelectedSkill(res[0]);
        })
        .catch(err => console.log('Error loading skills:', err));
    }
  }, [visible]);

  const handleOptionSelect = (questionId: number, option: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedSkill || !token) return;
    const questions = selectedSkill.questions || [];
    if (Object.keys(userAnswers).length < questions.length) {
      setErrorMsg('Please answer all questions before submitting.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const payload = {
        skill_id: selectedSkill.id,
        answers: questions.map((q: any) => ({
          question_id: q.id,
          selected_option: userAnswers[q.id] || 'A'
        }))
      };

      const result = await api.submitQuiz(payload, token);
      setQuizResult(result);
      if (result.passed) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to grade competency test.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuizResult(null);
    setUserAnswers({});
    setErrorMsg('');
  };

  return (
    <Modal visible={visible} title="Trade Skill Competency Quiz" onClose={onClose}>
      <ScrollView style={{ maxHeight: 520 }}>
        {quizResult ? (
          <View style={{ alignItems: 'center', padding: spacing.md }}>
            <Text style={{ fontSize: 44, marginBottom: spacing.sm }}>
              <Icon name={quizResult.passed ? 'check-circle-outline' : 'alert-circle-outline'} size={44} color={quizResult.passed ? colors.success : colors.danger} />
            </Text>
            <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>
              {quizResult.passed ? 'Congratulations! Quiz Passed' : 'Assessment Threshold Not Met'}
            </Text>
            <Text style={[styles.scoreText, { color: quizResult.passed ? colors.success : colors.danger }]}>
              Score: {quizResult.score_percentage}%
            </Text>
            <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
              {quizResult.passed
                ? 'Your trade competency profile has been updated to PASSED! Customers will see your verified badge on search.'
                : 'Score was below the required 70% passing threshold. Please review trade best practices and try again.'}
            </Text>

            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
              {!quizResult.passed && (
                <Button title="Retake Assessment" onPress={handleReset} variant="outline" size="md" />
              )}
              <Button title="Close Quiz" onPress={() => { handleReset(); onClose(); }} variant="primary" size="md" />
            </View>
          </View>
        ) : (
          <>
            {errorMsg ? (
              <Text style={[styles.errorBox, { backgroundColor: colors.dangerBackground, color: colors.danger }]}>
                {errorMsg}
              </Text>
            ) : null}

            <Text style={[styles.label, { color: colors.textSecondary }]}>Select Trade Skill Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
              {skills.map(s => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => { setSelectedSkill(s); setUserAnswers({}); }}
                  style={[
                    styles.skillPill,
                    {
                      backgroundColor: selectedSkill?.id === s.id ? colors.primary : colors.inputBackground,
                      borderColor: selectedSkill?.id === s.id ? colors.primary : colors.inputBorder,
                    }
                  ]}
                >
                  <Text style={[styles.skillText, { color: selectedSkill?.id === s.id ? '#FFFFFF' : colors.textPrimary }]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedSkill && (
              <View>
                <Text style={[styles.quizInstructions, { color: colors.textMuted }]}>
                  Answer all questions for {selectedSkill.name}. Pass mark is 70%.
                </Text>

                {(selectedSkill.questions || []).map((q: any, idx: number) => (
                  <View key={q.id} style={[styles.questionCard, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                    <Text style={[styles.questionText, { color: colors.textPrimary }]}>
                      Q{idx + 1}: {q.question_text}
                    </Text>

                    {['A', 'B', 'C', 'D'].map(optKey => {
                      const optionLabel = q[`option_${optKey.toLowerCase()}`];
                      if (!optionLabel) return null;
                      const isSelected = userAnswers[q.id] === optKey;

                      return (
                        <TouchableOpacity
                          key={optKey}
                          activeOpacity={0.7}
                          onPress={() => handleOptionSelect(q.id, optKey)}
                          style={[
                            styles.optionRow,
                            {
                              backgroundColor: isSelected ? colors.primaryLight : colors.cardBackground,
                              borderColor: isSelected ? colors.primary : colors.divider,
                            }
                          ]}
                        >
                          <Text style={[styles.optKey, { color: isSelected ? colors.primary : colors.textMuted }]}>
                            {optKey}
                          </Text>
                          <Text style={[styles.optText, { color: isSelected ? colors.primary : colors.textPrimary }]}>
                            {optionLabel}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}

                <Button
                  title="Submit Assessment Answers"
                  onPress={handleSubmitQuiz}
                  loading={loading}
                  variant="primary"
                  size="lg"
                  style={{ marginTop: spacing.lg }}
                />
              </View>
            )}
          </>
        )}
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
  quizInstructions: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.md,
  },
  questionCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  questionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  optKey: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  optText: {
    fontSize: typography.fontSize.xs,
    flex: 1,
  },
  resultTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  scoreText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginVertical: spacing.xs,
  },
  resultSubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: typography.lineHeight.base,
  }
});
