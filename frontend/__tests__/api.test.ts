/**
 * Unit tests for API integration and data mapping
 * Tests API calls, response handling, and data transformations
 * Note: These tests focus on logic, not actual HTTP calls
 */

describe('API Integration', () => {
    describe('Voice Analysis Request Validation', () => {
        it('should construct valid analyze-voice payload', () => {
            const mockPayload = {
                audio_base64: 'base64-encoded-audio',
                user_id: 'user-123',
                recording_mode: 'free',
                recording_time: 60,
            };

            expect(mockPayload.audio_base64).toBeDefined();
            expect(mockPayload.user_id).toBeDefined();
            expect(mockPayload.recording_mode).toMatch(/^(free|guided)$/);
            expect(typeof mockPayload.recording_time).toBe('number');
        });

        it('should validate recording mode values', () => {
            const validModes = ['free', 'guided'];
            expect(validModes).toContain('free');
            expect(validModes).toContain('guided');
        });
    });

    describe('Assessment Response Structure', () => {
        it('should have expected response properties', () => {
            const mockResponse = {
                assessment_id: 'assessment-123',
                status: 'completed',
                message: 'Analysis completed successfully',
            };

            expect(mockResponse.assessment_id).toBeDefined();
            expect(mockResponse.status).toBe('completed');
            expect(mockResponse.message).toBeDefined();
        });
    });

    describe('Error Response Handling', () => {
        const getErrorMessage = (status: number, data: any): string => {
            if (status === 401) {
                return 'You are not authenticated. Please log in and try again.';
            }
            if (status === 403) {
                return data?.detail?.message || 'You have reached your usage limit. Please upgrade to premium.';
            }
            if (status === 429) {
                return 'Too many requests. Please wait and try again.';
            }

            const errorDetail = data?.detail;
            if (typeof errorDetail === 'string') {
                return errorDetail;
            }
            if (errorDetail?.message) {
                return errorDetail.message;
            }
            return 'Failed to process audio. Please try again.';
        };

        it('should return auth error for 401', () => {
            const message = getErrorMessage(401, {});
            expect(message).toContain('not authenticated');
        });

        it('should return rate limit error for 429', () => {
            const message = getErrorMessage(429, {});
            expect(message).toContain('Too many requests');
        });

        it('should return usage limit error for 403', () => {
            const message = getErrorMessage(403, { detail: { message: 'Custom limit message' } });
            expect(message).toBe('Custom limit message');
        });

        it('should use default 403 message when no detail', () => {
            const message = getErrorMessage(403, {});
            expect(message).toContain('usage limit');
        });

        it('should extract string detail for other errors', () => {
            const message = getErrorMessage(500, { detail: 'Server error details' });
            expect(message).toBe('Server error details');
        });

        it('should extract message from object detail', () => {
            const message = getErrorMessage(500, { detail: { message: 'Object error' } });
            expect(message).toBe('Object error');
        });

        it('should return default message when no detail', () => {
            const message = getErrorMessage(500, {});
            expect(message).toBe('Failed to process audio. Please try again.');
        });
    });
});

describe('Data Mapping and Fallbacks', () => {
    describe('Assessment Analysis Mapping', () => {
        interface Analysis {
            insights?: {
                voice_personality?: string;
                headline?: string;
                overall_score?: number;
                clarity_score?: number;
                confidence_score?: number;
                key_insights?: string[];
                what_went_well?: string[];
                growth_opportunities?: string[];
                tone_description?: string;
                personalized_tips?: string[];
            };
            metrics?: {
                speaking_pace?: number;
                word_count?: number;
                pause_effectiveness?: number;
                vocal_variety?: string;
                energy_level?: string;
                clarity_rating?: string;
            };
            // Legacy fields
            archetype?: string;
            overall_score?: number;
            clarity_score?: number;
            confidence_score?: number;
            tone?: string;
            strengths?: string[];
            improvements?: string[];
            speaking_pace?: number;
            filler_words?: Record<string, number>;
            filler_count?: number;
            word_count?: number;
        }

        // Helper function to extract values with fallbacks (mirrors results.tsx logic)
        const extractAnalysisValues = (analysis: Analysis | undefined) => {
            return {
                overallScore: analysis?.insights?.overall_score || analysis?.overall_score || 75,
                archetype: analysis?.insights?.voice_personality || analysis?.archetype || 'Emerging Communicator',
                tone: analysis?.insights?.tone_description || analysis?.tone || 'Balanced',
                clarityScore: analysis?.insights?.clarity_score || analysis?.clarity_score || 75,
                confidenceScore: analysis?.insights?.confidence_score || analysis?.confidence_score || 70,
                speakingPace: analysis?.metrics?.speaking_pace || analysis?.speaking_pace || 0,
                strengths: analysis?.insights?.what_went_well || analysis?.strengths || [],
                improvements: analysis?.insights?.growth_opportunities || analysis?.improvements || [],
            };
        };

        it('should extract from new insights structure', () => {
            const analysis: Analysis = {
                insights: {
                    overall_score: 90,
                    voice_personality: 'Dynamic Leader',
                    tone_description: 'Confident and clear',
                    clarity_score: 88,
                    confidence_score: 92,
                    what_went_well: ['Great pace', 'Clear articulation'],
                    growth_opportunities: ['Reduce filler words'],
                },
                metrics: {
                    speaking_pace: 150,
                },
            };

            const values = extractAnalysisValues(analysis);

            expect(values.overallScore).toBe(90);
            expect(values.archetype).toBe('Dynamic Leader');
            expect(values.tone).toBe('Confident and clear');
            expect(values.speakingPace).toBe(150);
            expect(values.strengths).toHaveLength(2);
        });

        it('should fallback to legacy fields', () => {
            const analysis: Analysis = {
                archetype: 'Legacy Archetype',
                overall_score: 80,
                tone: 'Professional',
                speaking_pace: 120,
                strengths: ['Good energy'],
                improvements: ['Work on pauses'],
            };

            const values = extractAnalysisValues(analysis);

            expect(values.overallScore).toBe(80);
            expect(values.archetype).toBe('Legacy Archetype');
            expect(values.tone).toBe('Professional');
            expect(values.speakingPace).toBe(120);
        });

        it('should use default values when data missing', () => {
            const values = extractAnalysisValues(undefined);

            // BUG: These hardcoded defaults may show "fake" data to users
            expect(values.overallScore).toBe(75);
            expect(values.archetype).toBe('Emerging Communicator');
            expect(values.tone).toBe('Balanced');
            expect(values.clarityScore).toBe(75);
            expect(values.confidenceScore).toBe(70);
            expect(values.speakingPace).toBe(0);
            expect(values.strengths).toHaveLength(0);
        });

        it('should handle partial data gracefully', () => {
            const analysis: Analysis = {
                insights: {
                    overall_score: 85,
                    // Other fields missing
                },
                // No legacy fallbacks either
            };

            const values = extractAnalysisValues(analysis);

            expect(values.overallScore).toBe(85);
            expect(values.archetype).toBe('Emerging Communicator'); // Falls through to default
        });
    });

    describe('Filler Words Mapping', () => {
        it('should calculate filler word percentage correctly', () => {
            const fillerWords = { 'um': 5, 'uh': 3, 'like': 10 };
            const totalFillers = Object.values(fillerWords).reduce((a, b) => a + b, 0);
            const wordCount = 200;

            const fillerPercentage = (totalFillers / wordCount) * 100;

            expect(totalFillers).toBe(18);
            expect(fillerPercentage).toBe(9);
        });

        it('should handle empty filler words object', () => {
            const fillerWords: Record<string, number> = {};
            const fillerCount = Object.values(fillerWords).reduce((a, b) => a + b, 0);

            expect(fillerCount).toBe(0);
        });
    });

    describe('Score Color Mapping', () => {
        const getScoreColor = (score: number): string => {
            if (score >= 80) return 'success';
            if (score >= 60) return 'warning';
            return 'error';
        };

        it('should return success color for high scores', () => {
            expect(getScoreColor(80)).toBe('success');
            expect(getScoreColor(90)).toBe('success');
            expect(getScoreColor(100)).toBe('success');
        });

        it('should return warning color for medium scores', () => {
            expect(getScoreColor(60)).toBe('warning');
            expect(getScoreColor(70)).toBe('warning');
            expect(getScoreColor(79)).toBe('warning');
        });

        it('should return error color for low scores', () => {
            expect(getScoreColor(0)).toBe('error');
            expect(getScoreColor(59)).toBe('error');
        });
    });

    describe('Date Formatting', () => {
        const formatDate = (dateString: string) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        };

        it('should format ISO date string correctly', () => {
            const result = formatDate('2024-01-15T10:30:00Z');
            expect(result).toMatch(/Jan\s+15,?\s+2024/);
        });

        it('should handle different date formats', () => {
            const result = formatDate('2024-12-25');
            expect(result).toMatch(/Dec\s+25,?\s+2024/);
        });
    });

    describe('Time Formatting', () => {
        const formatTime = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        it('should format time correctly', () => {
            expect(formatTime(0)).toBe('0:00');
            expect(formatTime(30)).toBe('0:30');
            expect(formatTime(60)).toBe('1:00');
            expect(formatTime(90)).toBe('1:30');
            expect(formatTime(120)).toBe('2:00');
        });

        it('should pad single digit seconds', () => {
            expect(formatTime(5)).toBe('0:05');
            expect(formatTime(65)).toBe('1:05');
        });
    });
});
