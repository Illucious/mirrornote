"""
Enhanced GPT prompt builder for personalized voice analysis.
"""
from typing import Dict


SYSTEM_PROMPT = """You are Maya, an expert voice coach who provides warm, personalized feedback to help people improve their communication skills.

Your role:
- Analyze how someone speaks using both their words and voice characteristics
- Provide specific, actionable advice in friendly, conversational language
- Avoid technical jargon (no Hz, dB, jitter, shimmer, F0, MFCC, etc.)
- Speak directly to the person using "you" and "your"
- Give concrete examples from their actual speech patterns
- Be encouraging but honest about areas for growth
- Focus on practical improvements they can make today

Tone: Supportive, specific, conversational, expert but approachable. Write like you're having a one-on-one coaching session."""


def build_gpt_analysis_prompt(transcription: str, acoustic_metrics: Dict, duration: float) -> str:
    """
    Build comprehensive GPT prompt that combines transcript analysis with acoustic metrics.
    
    Args:
        transcription: Full text transcription
        acoustic_metrics: All acoustic features and metrics
        duration: Recording duration in seconds
        
    Returns:
        Complete prompt string for GPT-4
    """
    prosody = acoustic_metrics.get("prosody", {})
    loudness = acoustic_metrics.get("loudness", {})
    quality = acoustic_metrics.get("quality", {})
    timing = acoustic_metrics.get("timing", {})
    fillers = acoustic_metrics.get("filler_words", {})
    pace = acoustic_metrics.get("speaking_pace", 0)
    
    # Build contextual observations in natural language
    pitch_note = _describe_pitch(prosody)
    energy_note = _describe_energy(loudness)
    clarity_note = _describe_clarity(quality)
    pause_note = _describe_pauses(timing)
    filler_note = _describe_fillers(fillers)
    
    # Truncate transcript if too long (keep it manageable for GPT)
    transcript_excerpt = transcription[:800] + "..." if len(transcription) > 800 else transcription
    
    prompt = f"""Analyze this voice recording and provide personalized coaching feedback.

**What they said:**
"{transcript_excerpt}"

**How they said it:**
- Speaking pace: {pace} words per minute
- Voice tone: {pitch_note}
- Energy: {energy_note}
- Clarity: {clarity_note}
- Pacing: {pause_note}
- Filler words: {filler_note}

**Your task:**
Provide warm, personalized feedback in JSON format with these exact fields:

{{
  "voice_personality": "string (2-4 word archetype, e.g., 'Warm Storyteller', 'Confident Leader', 'Thoughtful Speaker')",
  "headline": "string (one sentence summary of their voice profile in conversational language)",
  "key_insights": ["array of 5-7 specific observations about their voice and delivery in conversational language"],
  "strengths": ["array of 3-4 things they do really well, with specific examples from their speech"],
  "improvements": ["array of 3-4 actionable growth areas with concrete tips they can apply immediately"],
  "tone_description": "string (describe their overall vocal presence in 3-5 words, e.g., 'warm and engaging')",
  "archetype": "string (classic communication archetype for compatibility)",
  "overall_score": number (0-100, holistic assessment of their communication effectiveness),
  "clarity_score": number (0-100, how clear and understandable they are),
  "confidence_score": number (0-100, how confident they sound),
  "actionable_tips": ["array of 3 immediate, practical tips they can try in their next conversation"]
}}

**Important guidelines:**
- Be specific: Reference actual patterns you notice in their speech
- Be actionable: Tell them exactly what to do differently, with examples
- Be encouraging: Balance growth areas with genuine strengths
- Be conversational: Write like you're talking to a friend, not writing a report
- Avoid ALL technical jargon: No Hz, dB, percentages, or scientific terms
- Personalize: Make it about THEIR unique voice, not generic advice
- Use "you" and "your" throughout

**Example strength:**
"You used 12 thoughtful pauses throughout your speech—they make you sound confident and give your ideas room to breathe. That's a professional touch many people struggle with."

**Example improvement:**
"Try replacing those 8 'ums' with brief pauses. Just stop, take a breath, and continue. Your ideas are strong enough to stand on their own without fillers."

**Example actionable tip:**
"Before your next call, take 3 deep breaths and remind yourself: pauses are powerful. They're not awkward—they're professional."

Now analyze this speaker's voice and provide your personalized coaching feedback in the JSON format above."""
    
    return prompt


def _describe_pitch(prosody: Dict) -> str:
    """Describe pitch in natural language."""
    pitch_mean = prosody.get("pitch_mean", 0)
    pitch_std = prosody.get("pitch_std", 0)
    
    if pitch_mean == 0:
        return "natural tone"
    
    # Classify pitch level
    if pitch_mean > 200:
        level = "higher pitch"
    elif pitch_mean < 130:
        level = "deeper voice"
    else:
        level = "medium pitch"
    
    # Classify variation
    if pitch_std > 45:
        variation = " with rich, expressive melody"
    elif pitch_std > 25:
        variation = " with natural melody"
    else:
        variation = " with steady, controlled tone"
    
    return level + variation


def _describe_energy(loudness: Dict) -> str:
    """Describe energy/loudness in natural language."""
    dynamic_range = loudness.get("dynamic_range_db", 0)
    
    if dynamic_range > 15:
        return "dynamic with strong emphasis on key points"
    elif dynamic_range > 8:
        return "good variation that maintains interest"
    else:
        return "consistent volume throughout"


def _describe_clarity(quality: Dict) -> str:
    """Describe voice quality/clarity in natural language."""
    hnr = quality.get("hnr_mean", 15)
    
    if hnr > 15:
        return "crystal clear and resonant voice quality"
    elif hnr > 10:
        return "clear and confident voice"
    else:
        return "decent voice quality with room to improve resonance"


def _describe_pauses(timing: Dict) -> str:
    """Describe pause patterns in natural language."""
    pause_count = timing.get("pause_count", 0)
    mean_pause_ms = timing.get("mean_pause_ms", 0)
    
    if pause_count == 0:
        return "minimal pauses (could use more for emphasis)"
    
    if mean_pause_ms > 700:
        return f"{pause_count} pauses (averaging {mean_pause_ms:.0f}ms each)—quite thoughtful, some feel a bit long"
    elif mean_pause_ms < 300:
        return f"{pause_count} quick pauses (averaging {mean_pause_ms:.0f}ms each)—fast-paced delivery"
    else:
        return f"{pause_count} well-timed pauses (averaging {mean_pause_ms:.0f}ms each)"


def _describe_fillers(filler_words: Dict) -> str:
    """Describe filler word usage in natural language."""
    if not filler_words:
        return "none detected—excellent!"
    
    total = sum(filler_words.values())
    top_fillers = sorted(filler_words.items(), key=lambda x: x[1], reverse=True)[:2]
    filler_desc = ", ".join([f"'{k}' {v} times" for k, v in top_fillers])
    
    return f"{total} total ({filler_desc})"


def get_json_schema() -> Dict:
    """Return expected JSON schema for validation."""
    return {
        "type": "object",
        "required": [
            "voice_personality",
            "headline",
            "key_insights",
            "strengths",
            "improvements",
            "tone_description",
            "archetype",
            "overall_score",
            "clarity_score",
            "confidence_score",
            "actionable_tips"
        ],
        "properties": {
            "voice_personality": {"type": "string"},
            "headline": {"type": "string"},
            "key_insights": {"type": "array", "items": {"type": "string"}},
            "strengths": {"type": "array", "items": {"type": "string"}},
            "improvements": {"type": "array", "items": {"type": "string"}},
            "tone_description": {"type": "string"},
            "archetype": {"type": "string"},
            "overall_score": {"type": "number"},
            "clarity_score": {"type": "number"},
            "confidence_score": {"type": "number"},
            "actionable_tips": {"type": "array", "items": {"type": "string"}}
        }
    }
