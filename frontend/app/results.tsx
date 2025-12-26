import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BarChart } from 'react-native-gifted-charts';
import { useAuth } from './context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from './constants/theme';
import { BACKEND_URL } from './utils/config';

import { Assessment } from './types';

export default function ResultsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessment();
  }, []);

  const fetchAssessment = async () => {
    try {
      const assessmentId = params.assessmentId as string;
      const response = await axios.get(
        `${BACKEND_URL}/api/assessment/${assessmentId}`
      );
      setAssessment(response.data);
    } catch (err: any) {
      console.error('Error fetching assessment:', err);
      setError('Failed to load assessment results');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    router.replace('/(tabs)/dashboard');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !assessment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>{error || 'No results found'}</Text>
          <TouchableOpacity style={styles.button} onPress={handleDone}>
            <Text style={styles.buttonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { analysis, training_questions } = assessment;
  // All questions are now free
  const questions = training_questions || [];

  // Extract values - show N/A or hide section if data is missing
  // This prevents showing fake data when API fails or data is incomplete
  const overallScore = analysis?.insights?.overall_score ?? analysis?.overall_score ?? null;
  const archetype = analysis?.insights?.voice_personality || analysis?.archetype || null;
  const tone = analysis?.insights?.tone_description || analysis?.tone || null;
  const clarityScore = analysis?.insights?.clarity_score ?? analysis?.clarity_score ?? null;
  const confidenceScore = analysis?.insights?.confidence_score ?? analysis?.confidence_score ?? null;
  const speakingPace = analysis?.metrics?.speaking_pace ?? analysis?.speaking_pace ?? null;
  const pitchAvg = analysis?.pitch_avg ?? null;
  const pitchRange = analysis?.pitch_range || null;
  const fillerWords = analysis?.filler_words || {};
  const fillerCount = analysis?.filler_count ?? 0;
  const strengths = analysis?.insights?.what_went_well || analysis?.strengths || [];
  const improvements = analysis?.insights?.growth_opportunities || analysis?.improvements || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDone} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Voice Analysis</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Overall Score */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{overallScore ?? 'N/A'}</Text>
            <Text style={styles.scoreLabel}>Overall Score</Text>
          </View>
          <View style={styles.archetypeContainer}>
            <Text style={styles.archetypeLabel}>Your Voice Archetype</Text>
            <Text style={styles.archetypeValue}>{archetype ?? 'Analyzing...'}</Text>
            {tone && <Text style={styles.toneText}>Tone: {tone}</Text>}
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Ionicons name="volume-high" size={24} color={COLORS.primary} />
              <Text style={styles.metricValue}>{clarityScore ?? 'N/A'}</Text>
              <Text style={styles.metricLabel}>Clarity</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="trophy" size={24} color={COLORS.primary} />
              <Text style={styles.metricValue}>{confidenceScore ?? 'N/A'}</Text>
              <Text style={styles.metricLabel}>Confidence</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="speedometer" size={24} color={COLORS.primary} />
              <Text style={styles.metricValue}>{speakingPace ?? 'N/A'}</Text>
              <Text style={styles.metricLabel}>WPM</Text>
            </View>
          </View>
        </View>

        {/* Pitch Analysis - only show if we have data */}
        {(pitchAvg !== null || pitchRange !== null) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pitch Analysis</Text>
            <View style={styles.card}>
              <View style={styles.pitchInfo}>
                <View style={styles.pitchItem}>
                  <Text style={styles.pitchLabel}>Average</Text>
                  <Text style={styles.pitchValue}>{pitchAvg !== null ? `${pitchAvg} Hz` : 'N/A'}</Text>
                </View>
                <View style={styles.pitchItem}>
                  <Text style={styles.pitchLabel}>Range</Text>
                  <Text style={styles.pitchValue}>{pitchRange ?? 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Filler Words */}
        {fillerCount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Filler Words ({fillerCount} detected)
            </Text>
            <View style={styles.card}>
              {Object.entries(fillerWords).map(([word, count]) => (
                <View key={word} style={styles.fillerItem}>
                  <Text style={styles.fillerWord}>{word}</Text>
                  <View style={styles.fillerBar}>
                    <View
                      style={[
                        styles.fillerBarFill,
                        {
                          width: `${(count / fillerCount) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.fillerCount}>{count}x</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Strengths */}
        {strengths && strengths.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="star" size={20} color={COLORS.success} /> Strengths
            </Text>
            <View style={styles.card}>
              {strengths.map((strength, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={COLORS.success}
                  />
                  <Text style={styles.listItemText}>{strength}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Improvements */}
        {improvements && improvements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="bulb" size={20} color={COLORS.warning} /> Areas for
              Improvement
            </Text>
            <View style={styles.card}>
              {improvements.map((improvement, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons
                    name="arrow-up-circle"
                    size={20}
                    color={COLORS.warning}
                  />
                  <Text style={styles.listItemText}>{improvement}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Training Questions - All Free */}
        {questions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="school" size={20} color={COLORS.primary} /> Training
              Questions
            </Text>
            {questions.map((q, index) => (
              <View key={index} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Ionicons name="help-circle" size={20} color={COLORS.primary} />
                  <Text style={styles.questionNumber}>Question {index + 1}</Text>
                </View>
                <Text style={styles.questionText}>{q.question}</Text>
                <View style={styles.answerContainer}>
                  <Text style={styles.answerLabel}>Answer:</Text>
                  <Text style={styles.answerText}>{q.answer}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/recording')}
          >
            {/* <Ionicons name="mic" size={20} color={COLORS.primary} /> */}
            <Text style={styles.secondaryButtonText}>New Assessment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleDone}>
            <Text style={styles.primaryButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  buttonText: {
    color: COLORS.textWhite,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  scoreCard: {
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  scoreValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textWhite,
    marginTop: SPACING.xs,
  },
  archetypeContainer: {
    alignItems: 'center',
  },
  archetypeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  archetypeValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  toneText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  metricLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  pitchInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pitchItem: {
    alignItems: 'center',
  },
  pitchLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  pitchValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  fillerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  fillerWord: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    width: 60,
    textTransform: 'capitalize',
  },
  fillerBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fillerBarFill: {
    height: '100%',
    backgroundColor: COLORS.warning,
  },
  fillerCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    width: 30,
    textAlign: 'right',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  listItemText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  questionCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  questionNumber: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  answerContainer: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  answerLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  answerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
});
