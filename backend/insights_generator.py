"""
Insights generator: Translates technical acoustic metrics into user-friendly, personalized insights.
"""
from typing import Dict, List


def generate_pitch_insight(pitch_mean: float, pitch_std: float, pitch_range: float) -> str:
    """Generate personalized insight about pitch/melody."""
    if pitch_mean == 0:
        return "Your voice has natural clarity"
    
    # Classify pitch level
    if pitch_mean > 200:
        pitch_level = "higher pitch"
    elif pitch_mean < 130:
        pitch_level = "deeper voice"
    else:
        pitch_level = "medium pitch"
    
    # Classify variation
    if pitch_std > 45:
        variation = "rich melody that keeps listeners engaged"
    elif pitch_std > 25:
        variation = "natural melody"
    else:
        variation = "steady tone"
    
    return f"Your voice has a {pitch_level} with {variation}"


def generate_pace_insight(wpm: int, pause_count: int, mean_pause_ms: float) -> str:
    """Generate personalized insight about speaking pace."""
    if wpm > 160:
        pace_desc = "quick pace"
        advice = "—you cover a lot of ground fast"
    elif wpm < 120:
        pace_desc = "thoughtful pace"
        advice = "—giving listeners time to absorb your ideas"
    else:
        pace_desc = "comfortable pace"
        advice = "—easy for listeners to follow"
    
    if pause_count > 15:
        pause_desc = f" You use {pause_count} pauses effectively"
    elif pause_count > 5:
        pause_desc = f" Your {pause_count} pauses help punctuate your thoughts"
    else:
        pause_desc = " Consider adding more pauses for emphasis"
    
    return f"You speak at a {pace_desc} ({wpm} words per minute){advice}.{pause_desc}"


def generate_energy_insight(rms_mean: float, dynamic_range: float) -> str:
    """Generate personalized insight about energy and volume."""
    if dynamic_range > 15:
        return "Your energy is dynamic with great peaks and valleys that emphasize key points"
    elif dynamic_range > 8:
        return "Your volume has good variation that helps maintain interest"
    else:
        return "Your volume is consistent—try adding more energy variation to emphasize important ideas"


def generate_clarity_insight(jitter: float, shimmer: float, hnr: float) -> str:
    """Generate personalized insight about voice quality."""
    if hnr > 15:
        return "Your voice quality is crystal clear and resonant with no shakiness"
    elif hnr > 10:
        return "Your voice sounds clear and confident"
    else:
        return "Your voice has natural quality with room to strengthen resonance"


def generate_pause_insight(pause_count: int, mean_pause_ms: float, long_pauses: List, duration: float) -> str:
    """Generate personalized insight about pauses."""
    if pause_count == 0:
        return "Try adding strategic pauses—they give your words more impact"
    
    pause_rate = pause_count / (duration / 60) if duration > 0 else 0
    
    if mean_pause_ms > 700:
        return f"You used {pause_count} pauses (averaging {mean_pause_ms:.0f}ms)—quite thoughtful, though some feel a bit long"
    elif mean_pause_ms < 300:
        return f"Your {pause_count} pauses are quick (averaging {mean_pause_ms:.0f}ms)—consider making them slightly longer for emphasis"
    else:
        return f"You used {pause_count} well-timed pauses that make you sound thoughtful and confident"


def generate_filler_insight(filler_words: Dict, word_count: int) -> str:
    """Generate personalized insight about filler words."""
    if not filler_words:
        return "You avoided filler words completely—impressive!"
    
    total_fillers = sum(filler_words.values())
    filler_rate = (total_fillers / word_count * 100) if word_count > 0 else 0
    
    # Get most common fillers
    top_fillers = sorted(filler_words.items(), key=lambda x: x[1], reverse=True)[:2]
    filler_desc = " and ".join([f"'{k}' {v} times" for k, v in top_fillers])
    
    if filler_rate > 5:
        return f"You said {filler_desc}—that's {total_fillers} total fillers. Try replacing them with brief pauses for a more polished delivery"
    elif filler_rate > 2:
        return f"You said {filler_desc}—just a few to work on. Pause instead, and your ideas will have more impact"
    else:
        return f"You had minimal filler words ({filler_desc})—well done keeping your speech clean"


def classify_voice_personality(metrics: Dict) -> str:
    """Classify speaker into a voice archetype based on metrics."""
    prosody = metrics.get("prosody", {})
    loudness = metrics.get("loudness", {})
    timing = metrics.get("timing", {})
    pace = metrics.get("speaking_pace", 140)
    
    pitch_std = prosody.get("pitch_std", 30)
    dynamic_range = loudness.get("dynamic_range_db", 10)
    silence_ratio = timing.get("silence_ratio", 0.3)
    
    # Classification logic
    if pitch_std > 45 and dynamic_range > 12:
        return "Dynamic Storyteller"
    elif silence_ratio > 0.35 and pace < 130:
        return "Thoughtful Speaker"
    elif pace > 150 and dynamic_range > 10:
        return "Energetic Communicator"
    elif pitch_std < 25 and dynamic_range < 8:
        return "Steady Professional"
    elif pitch_std > 35:
        return "Expressive Presenter"
    else:
        return "Balanced Communicator"


def generate_tone_description(metrics: Dict) -> str:
    """Generate overall tone description."""
    prosody = metrics.get("prosody", {})
    loudness = metrics.get("loudness", {})
    
    pitch_std = prosody.get("pitch_std", 30)
    dynamic_range = loudness.get("dynamic_range_db", 10)
    
    descriptors = []
    
    # Energy level
    if dynamic_range > 12:
        descriptors.append("energetic")
    elif dynamic_range < 8:
        descriptors.append("calm")
    else:
        descriptors.append("balanced")
    
    # Melody
    if pitch_std > 40:
        descriptors.append("expressive")
    elif pitch_std < 25:
        descriptors.append("steady")
    
    # Always add positive ending
    descriptors.append("approachable")
    
    return ", ".join(descriptors).capitalize()


def generate_personalized_summary(all_metrics: Dict) -> Dict:
    """
    Generate complete personalized insights from all metrics.
    
    Args:
        all_metrics: Dictionary containing all extracted metrics
        
    Returns:
        Dictionary with user-friendly insights
    """
    prosody = all_metrics.get("prosody", {})
    loudness = all_metrics.get("loudness", {})
    quality = all_metrics.get("quality", {})
    timing = all_metrics.get("timing", {})
    filler_words = all_metrics.get("filler_words", {})
    word_count = all_metrics.get("word_count", 0)
    speaking_pace = all_metrics.get("speaking_pace", 0)
    duration = all_metrics.get("duration", 0)
    
    # Generate personality and tone
    voice_personality = classify_voice_personality(all_metrics)
    tone_description = generate_tone_description(all_metrics)
    
    # Generate key insights
    key_insights = []
    
    # Pitch insight
    pitch_insight = generate_pitch_insight(
        prosody.get("pitch_mean", 0),
        prosody.get("pitch_std", 0),
        prosody.get("pitch_range_hz", 0)
    )
    if pitch_insight:
        key_insights.append(pitch_insight)
    
    # Pace insight
    pace_insight = generate_pace_insight(
        speaking_pace,
        timing.get("pause_count", 0),
        timing.get("mean_pause_ms", 0)
    )
    if pace_insight:
        key_insights.append(pace_insight)
    
    # Energy insight
    energy_insight = generate_energy_insight(
        loudness.get("rms_mean", 0),
        loudness.get("dynamic_range_db", 0)
    )
    if energy_insight:
        key_insights.append(energy_insight)
    
    # Clarity insight
    clarity_insight = generate_clarity_insight(
        quality.get("jitter_local", 0),
        quality.get("shimmer_local", 0),
        quality.get("hnr_mean", 15)
    )
    if clarity_insight:
        key_insights.append(clarity_insight)
    
    # Pause insight
    if timing.get("pause_count", 0) > 0:
        pause_insight = generate_pause_insight(
            timing.get("pause_count", 0),
            timing.get("mean_pause_ms", 0),
            timing.get("long_pauses", []),
            duration
        )
        if pause_insight:
            key_insights.append(pause_insight)
    
    # Filler insight
    if filler_words:
        filler_insight = generate_filler_insight(filler_words, word_count)
        if filler_insight:
            key_insights.append(filler_insight)
    
    # Generate strengths
    what_went_well = []
    
    if quality.get("hnr_mean", 0) > 15:
        what_went_well.append("Your voice quality is crystal clear with excellent resonance")
    
    if timing.get("pause_count", 0) > 5 and timing.get("mean_pause_ms", 0) > 300:
        what_went_well.append(f"You used {timing['pause_count']} well-timed pauses that show confidence")
    
    if loudness.get("dynamic_range_db", 0) > 10:
        what_went_well.append("Your energy variation keeps listeners engaged")
    
    if prosody.get("pitch_std", 0) > 35:
        what_went_well.append("Your vocal melody is naturally expressive")
    
    if sum(filler_words.values()) < 5:
        what_went_well.append("You kept filler words to a minimum")
    
    # Generate growth opportunities
    growth_opportunities = []
    
    total_fillers = sum(filler_words.values())
    if total_fillers > 5:
        top_filler = max(filler_words.items(), key=lambda x: x[1])[0]
        growth_opportunities.append(f"Replace those {total_fillers} filler words (especially '{top_filler}') with brief pauses")
    
    if loudness.get("dynamic_range_db", 0) < 8:
        growth_opportunities.append("Add more volume variation to emphasize your key points")
    
    if timing.get("pause_count", 0) < 5:
        growth_opportunities.append("Use more strategic pauses to let your ideas breathe")
    
    if speaking_pace > 160:
        growth_opportunities.append("Slow down slightly in complex sections for better comprehension")
    elif speaking_pace < 110:
        growth_opportunities.append("Pick up the pace a bit to maintain energy and engagement")
    
    # Generate headline
    headline = f"Your voice is {tone_description.lower()}"
    if prosody.get("pitch_std", 0) > 35:
        headline += " with natural energy that draws listeners in"
    elif quality.get("hnr_mean", 0) > 15:
        headline += " with excellent clarity and confidence"
    else:
        headline += " with room to add more dynamic energy"
    
    return {
        "voice_personality": voice_personality,
        "headline": headline,
        "key_insights": key_insights[:7],  # Limit to 7
        "what_went_well": what_went_well[:4],  # Limit to 4
        "growth_opportunities": growth_opportunities[:4],  # Limit to 4
        "tone_description": tone_description
    }
