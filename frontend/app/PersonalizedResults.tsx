import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from './constants/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Analysis {
  insights?: {
    voice_personality: string;
    headline: string;
    key_insights: string[];
    what_went_well: string[];
    growth_opportunities: string[];
    tone_description: string;
    overall_score: number;
    personalized_tips?: string[];
  };
  metrics?: {
    speaking_pace: number;
    pause_effectiveness: number;
    vocal_variety: string;
    energy_level: string;
    clarity_rating: string;
  };
  // Legacy fields for backward compatibility
  archetype?: string;
  overall_score?: number;
  strengths?: string[];
  improvements?: string[];
}

interface Assessment {
  assessment_id: string;
  transcription: string;
  analysis: Analysis;
  training_questions?: Array<{
    question: string;
    answer: string;
    is_free: boolean;
  }>;
}

export default function PersonalizedResults() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllInsights, setShowAllInsights] = useState(false);

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
    } catch (err) {
      console.error('Error fetching assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your personalized insights...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!assessment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>No results found</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/(tabs)/dashboard')}
          >
            <Text style={styles.buttonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { analysis } = assessment;
  const insights = analysis.insights;
  const metrics = analysis.metrics;
  
  // Fallback to legacy fields if new insights not available
  const personality = insights?.voice_personality || analysis.archetype || "Balanced Communicator";
  const headline = insights?.headline || "Your voice analysis is complete";
  const score = insights?.overall_score || analysis.overall_score || 75;
  const keyInsights = insights?.key_insights || [];
  const strengths = insights?.what_went_well || analysis.strengths || [];
  const growthOps = insights?.growth_opportunities || analysis.improvements || [];
  const tips = insights?.personalized_tips || [];

  const freeQuestions = assessment.training_questions?.filter(q => q.is_free) || [];
  const lockedQuestions = assessment.training_questions?.filter(q => !q.is_free) || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/dashboard')}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Voice Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Voice Personality Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🎭</Text>
          <Text style={styles.personalityTitle}>{personality}</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
          <Text style={styles.headline}>{headline}</Text>
        </View>

        {/* Metrics Quick View */}
        {metrics && (
          <View style={styles.section}>
            <View style={styles.metricsRow}>
              <View style={styles.metricBadge}>
                <Text style={styles.metricBadgeLabel}>Speaking Pace</Text>
                <Text style={styles.metricBadgeValue}>{metrics.speaking_pace} WPM</Text>
              </View>
              <View style={styles.metricBadge}>
                <Text style={styles.metricBadgeLabel}>Energy</Text>
                <Text style={styles.metricBadgeValue}>{metrics.energy_level}</Text>
              </View>
              <View style={styles.metricBadge}>
                <Text style={styles.metricBadgeLabel}>Clarity</Text>
                <Text style={styles.metricBadgeValue}>{metrics.clarity_rating}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Key Insights */}
        {keyInsights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>💡</Text>
              <Text style={styles.sectionTitle}>Key Insights About Your Voice</Text>
            </View>
            <View style={styles.card}>
              {keyInsights.slice(0, showAllInsights ? undefined : 3).map((insight, idx) => (
                <View key={idx} style={styles.insightItem}>
                  <Text style={styles.insightBullet}>•</Text>
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
              {keyInsights.length > 3 && (
                <TouchableOpacity
                  onPress={() => setShowAllInsights(!showAllInsights)}
                  style={styles.showMoreButton}
                >
                  <Text style={styles.showMoreText}>
                    {showAllInsights ? 'Show Less' : `Show ${keyInsights.length - 3} More`}
                  </Text>
                  <Ionicons
                    name={showAllInsights ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* What Went Well */}
        {strengths.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>✨</Text>
              <Text style={styles.sectionTitle}>What You Did Great</Text>
            </View>
            <View style={styles.card}>
              {strengths.map((strength, idx) => (
                <View key={idx} style={styles.strengthItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.strengthText}>{strength}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Growth Opportunities */}
        {growthOps.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🚀</Text>
              <Text style={styles.sectionTitle}>How to Level Up</Text>
            </View>
            {growthOps.map((opp, idx) => (
              <View key={idx} style={styles.growthCard}>
                <View style={styles.growthNumber}>
                  <Text style={styles.growthNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.growthText}>{opp}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick Wins */}
        {tips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🎯</Text>
              <Text style={styles.sectionTitle}>Quick Wins (Try These Today!)</Text>
            </View>
            {tips.map((tip, idx) => (
              <View key={idx} style={styles.tipCard}>
                <Ionicons name="bulb" size={20} color={COLORS.warning} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Training Questions */}
        {freeQuestions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🎓</Text>
              <Text style={styles.sectionTitle}>Training Questions</Text>
            </View>
            {freeQuestions.map((q, idx) => (
              <View key={idx} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Ionicons name="help-circle" size={20} color={COLORS.primary} />
                  <Text style={styles.questionNumber}>Question {idx + 1}</Text>
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

        {/* Upgrade CTA */}
        {lockedQuestions.length > 0 && !user?.isPremium && (
          <View style={styles.section}>
            <View style={styles.upgradeCard}>
              <Ionicons name="lock-closed" size={48} color={COLORS.primary} />
              <Text style={styles.upgradeTitle}>Unlock Full Training Program</Text>
              <Text style={styles.upgradeDescription}>
                Get {lockedQuestions.length} more personalized questions plus unlimited assessments
              </Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => router.push('/payment')}
              >
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.textWhite} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/recording')}
          >
            <Ionicons name="mic" size={20} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>New Assessment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(tabs)/dashboard')}
          >
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
  heroCard: {
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  personalityTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  scoreValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  headline: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
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
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  metricBadge: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  metricBadgeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  metricBadgeValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  insightBullet: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    marginRight: SPACING.sm,
    marginTop: -2,
  },
  insightText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  showMoreText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: SPACING.xs,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  strengthText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    lineHeight: 22,
  },
  growthCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  growthNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  growthNumberText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  growthText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  tipText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    lineHeight: 22,
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
  },
  questionNumber: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  questionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    lineHeight: 22,
  },
  answerContainer: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  answerLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  answerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  upgradeCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  upgradeTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  upgradeDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  upgradeButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: COLORS.textWhite,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    marginRight: SPACING.sm,
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
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.textWhite,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
});
