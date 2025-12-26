/**
 * Shared types for the MirrorNote application
 * Centralizes all interfaces to prevent duplication and inconsistencies
 */

// ============ User Types ============
export interface User {
    id: string;
    email: string;
    name: string;
    picture?: string;
    isPremium?: boolean; // For future premium features
}

// ============ Analysis Types ============
export interface VoiceInsights {
    voice_personality: string;
    headline: string;
    key_insights: string[];
    what_went_well: string[];
    growth_opportunities: string[];
    tone_description: string;
    overall_score: number;
    clarity_score: number;
    confidence_score: number;
    personalized_tips?: string[];
}

export interface VoiceMetrics {
    speaking_pace: number;
    word_count: number;
    pause_effectiveness: number;
    vocal_variety: string;
    energy_level: string;
    clarity_rating: string;
}

export interface VoiceAnalysis {
    // New personalized insights structure
    insights?: VoiceInsights;
    metrics?: VoiceMetrics;

    // Legacy fields for backward compatibility
    archetype?: string;
    overall_score?: number;
    clarity_score?: number;
    confidence_score?: number;
    tone?: string;
    strengths?: string[];
    improvements?: string[];
    pitch_avg?: number;
    pitch_range?: string;
    speaking_pace?: number;
    filler_words?: Record<string, number>;
    filler_count?: number;
    word_count?: number;
}

// ============ Training Question Types ============
export interface TrainingQuestion {
    question: string;
    answer: string;
    is_free: boolean;
}

// ============ Assessment Types ============
export interface Assessment {
    assessment_id: string;
    transcription: string;
    analysis: VoiceAnalysis;
    training_questions?: TrainingQuestion[];
    created_at?: string;
    user_id?: string;
}

// ============ Assessment List Item (for History) ============
export interface AssessmentListItem {
    assessment_id: string;
    created_at: string;
    analysis: {
        insights?: {
            overall_score?: number;
            voice_personality?: string;
        };
        overall_score?: number;
        archetype?: string;
    };
}

// ============ API Response Types ============
export interface VoiceAnalysisResponse {
    assessment_id: string;
    status: string;
    message: string;
}

export interface AssessmentsListResponse {
    assessments: AssessmentListItem[];
    total: number;
}

// ============ Helper Functions ============

/**
 * Extract overall score from analysis with proper fallbacks
 * Returns null if no valid data (instead of fake default)
 */
export const getOverallScore = (analysis?: VoiceAnalysis): number | null => {
    if (!analysis) return null;
    const score = analysis.insights?.overall_score ?? analysis.overall_score;
    return score !== undefined ? score : null;
};

/**
 * Extract archetype/voice personality from analysis with proper fallbacks
 * Returns null if no valid data (instead of fake default)
 */
export const getArchetype = (analysis?: VoiceAnalysis): string | null => {
    if (!analysis) return null;
    return analysis.insights?.voice_personality ?? analysis.archetype ?? null;
};

/**
 * Extract all display values from analysis
 * Returns nulls for missing data instead of fake defaults
 */
export const extractAnalysisDisplayValues = (analysis?: VoiceAnalysis) => {
    if (!analysis) {
        return {
            overallScore: null,
            archetype: null,
            tone: null,
            clarityScore: null,
            confidenceScore: null,
            speakingPace: null,
            pitchAvg: null,
            pitchRange: null,
            fillerWords: {},
            fillerCount: 0,
            wordCount: null,
            strengths: [],
            improvements: [],
        };
    }

    return {
        overallScore: analysis.insights?.overall_score ?? analysis.overall_score ?? null,
        archetype: analysis.insights?.voice_personality ?? analysis.archetype ?? null,
        tone: analysis.insights?.tone_description ?? analysis.tone ?? null,
        clarityScore: analysis.insights?.clarity_score ?? analysis.clarity_score ?? null,
        confidenceScore: analysis.insights?.confidence_score ?? analysis.confidence_score ?? null,
        speakingPace: analysis.metrics?.speaking_pace ?? analysis.speaking_pace ?? null,
        pitchAvg: analysis.pitch_avg ?? null,
        pitchRange: analysis.pitch_range ?? null,
        fillerWords: analysis.filler_words ?? {},
        fillerCount: analysis.filler_count ?? 0,
        wordCount: analysis.metrics?.word_count ?? analysis.word_count ?? null,
        strengths: analysis.insights?.what_went_well ?? analysis.strengths ?? [],
        improvements: analysis.insights?.growth_opportunities ?? analysis.improvements ?? [],
    };
};

// Default export to prevent Expo Router from treating this as a route
export default function TypesModuleRoute() {
    return null;
}
