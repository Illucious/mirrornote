import numpy as np
import librosa
from feature_extractor import extract_prosody
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_pitch_extraction():
    sr = 16000
    duration = 3.0
    t = np.linspace(0, duration, int(sr * duration))
    
    # 1. Test 440Hz Sine Wave (Should be ~440Hz)
    print("\n--- Testing 440Hz Sine Wave ---")
    sine_wave = 0.5 * np.sin(2 * np.pi * 440 * t)
    result_sine = extract_prosody(sine_wave, sr)
    print(f"Mean Pitch: {result_sine['pitch_mean']} Hz")
    
    # 2. Test Silence (Should be 0Hz)
    print("\n--- Testing Silence ---")
    silence = np.zeros_like(t)
    result_silence = extract_prosody(silence, sr)
    print(f"Mean Pitch: {result_silence['pitch_mean']} Hz")
    
    # 3. Test Low Frequency (80Hz - might be below default fmin)
    print("\n--- Testing 80Hz Sine Wave ---")
    low_wave = 0.5 * np.sin(2 * np.pi * 80 * t)
    result_low = extract_prosody(low_wave, sr)
    print(f"Mean Pitch: {result_low['pitch_mean']} Hz")

    # 4. Test Short Audio (0.5s)
    print("\n--- Testing Short Audio (0.5s) ---")
    short_t = np.linspace(0, 0.5, int(sr * 0.5))
    short_wave = 0.5 * np.sin(2 * np.pi * 440 * short_t)
    result_short = extract_prosody(short_wave, sr)
    print(f"Mean Pitch: {result_short['pitch_mean']} Hz")

if __name__ == "__main__":
    test_pitch_extraction()
