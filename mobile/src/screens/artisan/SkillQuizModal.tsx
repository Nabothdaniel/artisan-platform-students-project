import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { Button, Chip, Sheet, Text, Pressable } from '../../components/ui/foundation';
import { Icon } from '../../components/ui/Icon';
import { api } from '../../services/api';

interface SkillQuizModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SkillQuizModal: React.FC<SkillQuizModalProps> = ({ visible, onClose, onSuccess }) => {
  const { token } = useTheme();
  const [skills, setSkills] = useState<any[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<any | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  // UI-only: which question the wizard is showing.
  const [step, setStep] = useState(0);

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
    setStep(0);
  };

  const questions: any[] = selectedSkill?.questions || [];
  const currentQuestion = questions[step];
  const isLastStep = step >= questions.length - 1;

  const quizFooter = questions.length === 0 ? null : (
    <View style={styles.footerRow}>
      <Button
        label="Back"
        onPress={() => setStep(s => Math.max(0, s - 1))}
        variant="outline"
        disabled={step === 0}
        style={styles.footerAction}
      />
      {isLastStep ? (
        <Button
          label="Submit Assessment"
          onPress={handleSubmitQuiz}
          loading={loading}
          style={styles.footerAction}
        />
      ) : (
        <Button
          label="Next"
          onPress={() => setStep(s => Math.min(questions.length - 1, s + 1))}
          style={styles.footerAction}
        />
      )}
    </View>
  );

  const resultFooter = (
    <View style={styles.footerRow}>
      {quizResult && !quizResult.passed ? (
        <Button label="Retake Assessment" onPress={handleReset} variant="outline" style={styles.footerAction} />
      ) : null}
      <Button label="Close Quiz" onPress={() => { handleReset(); onClose(); }} style={styles.footerAction} />
    </View>
  );

  const resultColor = quizResult?.passed ? tokens.colors.success : tokens.colors.danger;

  return (
    <Sheet
      visible={visible}
      title="Trade Skill Competency Quiz"
      onClose={onClose}
      footer={quizResult ? resultFooter : quizFooter}
    >
      {quizResult ? (
        <View style={styles.result}>
          <View style={styles.resultIcon}>
            <Icon
              name={quizResult.passed ? 'check-circle-outline' : 'alert-circle-outline'}
              size={tokens.iconSizes.lg}
              color={resultColor}
            />
          </View>
          <Text variant="heading" style={styles.centered}>
            {quizResult.passed ? 'Congratulations! Quiz Passed' : 'Assessment Threshold Not Met'}
          </Text>
          <Text variant="title" color={resultColor}>Score: {quizResult.score_percentage}%</Text>
          <Text variant="body" color={tokens.colors.textMuted} style={styles.centered}>
            {quizResult.passed
              ? 'Your trade competency profile has been updated to PASSED! Customers will see your verified badge on search.'
              : 'Score was below the required 70% passing threshold. Please review trade best practices and try again.'}
          </Text>
        </View>
      ) : (
        <>
          {errorMsg ? <Text variant="body" color={tokens.colors.danger}>{errorMsg}</Text> : null}

          {step === 0 ? (
            <View style={styles.group}>
              <Text variant="meta" color={tokens.colors.textMuted}>Select Trade Skill Category</Text>
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
                    selected={selectedSkill?.id === s.id}
                    onPress={() => { setSelectedSkill(s); setUserAnswers({}); setStep(0); }}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {selectedSkill && currentQuestion ? (
            <>
              {/* Progress: one question per step. */}
              <View style={styles.group}>
                <View style={styles.progressRow}>
                  <Text variant="meta" color={tokens.colors.textMuted} style={styles.progressLabel}>
                    Question {step + 1} of {questions.length} • {selectedSkill.name} • pass mark 70%
                  </Text>
                  <Text variant="meta" color={tokens.colors.textMuted}>
                    {Object.keys(userAnswers).length}/{questions.length} answered
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${((step + 1) / questions.length) * 100}%` }]} />
                </View>
              </View>

              <View style={styles.questionCard}>
                <Text variant="subheading">Q{step + 1}: {currentQuestion.question_text}</Text>

                {['A', 'B', 'C', 'D'].map(optKey => {
                  const optionLabel = currentQuestion[`option_${optKey.toLowerCase()}`];
                  if (!optionLabel) return null;
                  const isSelected = userAnswers[currentQuestion.id] === optKey;
                  const optionColor = isSelected ? tokens.colors.inverseText : tokens.colors.text;

                  return (
                    <Pressable
                      key={optKey}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => handleOptionSelect(currentQuestion.id, optKey)}
                      style={({ pressed }) => [
                        styles.optionRow,
                        isSelected ? styles.optionSelected : styles.optionIdle,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text variant="button" color={isSelected ? tokens.colors.inverseText : tokens.colors.textMuted}>
                        {optKey}
                      </Text>
                      <Text variant="body" color={optionColor} style={styles.optText}>{optionLabel}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </>
      )}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  centered: {
    textAlign: 'center',
  },
  group: {
    gap: tokens.spacing[2],
  },
  chips: {
    gap: tokens.spacing[2],
  },
  skillScroll: {
    flexGrow: 0,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  // minWidth: 0 lets the long label wrap instead of pushing the counter off the row.
  progressLabel: {
    flex: 1,
    minWidth: 0,
  },
  progressTrack: {
    height: 4,
    borderRadius: tokens.radii.full,
    overflow: 'hidden',
    backgroundColor: tokens.colors.surfaceRaised,
  },
  progressFill: {
    height: '100%',
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.accent,
  },
  footerRow: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
  },
  footerAction: {
    flex: 1,
  },
  questionCard: {
    padding: tokens.spacing[4],
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surfaceRaised,
    gap: tokens.spacing[2],
  },
  optionRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    gap: tokens.spacing[3],
  },
  optionIdle: {
    backgroundColor: tokens.colors.surface,
    borderColor: tokens.colors.border,
  },
  optionSelected: {
    backgroundColor: tokens.colors.inverse,
    borderColor: tokens.colors.inverse,
  },
  optText: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.7,
  },
  result: {
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  resultIcon: {
    width: 56,
    height: 56,
    borderRadius: tokens.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
});
