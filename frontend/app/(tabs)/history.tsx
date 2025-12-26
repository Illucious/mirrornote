import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../utils/config';

import { Assessment } from '../types';

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessments = async () => {
    try {
      setError(null);
      const response = await axios.get(`${BACKEND_URL}/api/assessments`);
      const assessments = response.data.assessments || response.data || [];
      // Sort by date descending (newest first)
      const sorted = Array.isArray(assessments) ? assessments.sort((a: Assessment, b: Assessment) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }) : [];
      setAssessments(sorted);
    } catch (err: any) {
      console.error('Error fetching assessments:', err);
      if (err.response?.status === 401) {
        setError('Please log in to view your history');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please wait and try again.');
      } else {
        setError('Unable to load history. Pull down to retry.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAssessments();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAssessments();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  };

  const renderItem = ({ item }: { item: Assessment }) => {
    const score = item.analysis?.insights?.overall_score || item.analysis?.overall_score || 0;
    const archetype = item.analysis?.insights?.voice_personality || item.analysis?.archetype || 'Assessment';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({
          pathname: '/results',
          params: { assessmentId: item.assessment_id }
        })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{archetype}</Text>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(score) + '20' }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(score) }]}>
              {score}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetails}>View Analysis</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Assessment History</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {assessments.length > 0 ? (
        <FlatList
          data={assessments}
          renderItem={renderItem}
          keyExtractor={(item) => item.assessment_id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No assessments yet</Text>
          <Text style={styles.emptySubtext}>
            Start your first assessment to see your history here
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push('/recording')}
          >
            <Text style={styles.startButtonText}>Start Assessment</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  listContent: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  scoreBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  scoreText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  viewDetails: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  startButtonText: {
    color: COLORS.textWhite,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
  },
});
