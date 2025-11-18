"""
Audio utilities for loading, converting, and preprocessing audio files.
"""
import base64
import tempfile
import os
from typing import Tuple
import numpy as np
import soundfile as sf
import librosa


def load_audio_from_base64(base64_str: str, target_sr: int = 16000) -> Tuple[np.ndarray, int]:
    """
    Load audio from base64 string and convert to numpy array.
    
    Args:
        base64_str: Base64 encoded audio data
        target_sr: Target sample rate (default 16000 Hz)
        
    Returns:
        Tuple of (audio_array, sample_rate)
    """
    try:
        # Decode base64 to bytes
        audio_bytes = base64.b64decode(base64_str)
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.m4a')
        temp_path = temp_file.name
        temp_file.write(audio_bytes)
        temp_file.close()
        
        # Load audio using librosa
        audio, sr = librosa.load(temp_path, sr=target_sr, mono=True)
        
        # Clean up temp file
        os.unlink(temp_path)
        
        # Normalize audio to prevent clipping
        audio = normalize_audio(audio)
        
        return audio, sr
        
    except Exception as e:
        raise ValueError(f"Failed to load audio from base64: {str(e)}")


def normalize_audio(audio: np.ndarray, target_level: float = 0.3) -> np.ndarray:
    """
    Normalize audio levels to prevent clipping and ensure consistent volume.
    
    Args:
        audio: Audio array
        target_level: Target RMS level (0-1)
        
    Returns:
        Normalized audio array
    """
    # Calculate current RMS
    rms = np.sqrt(np.mean(audio**2))
    
    if rms > 0:
        # Scale to target level
        scaling_factor = target_level / rms
        audio = audio * scaling_factor
        
    # Clip to prevent values outside [-1, 1]
    audio = np.clip(audio, -1.0, 1.0)
    
    return audio


def save_temp_wav(audio: np.ndarray, sr: int) -> str:
    """
    Save audio array as temporary WAV file.
    
    Args:
        audio: Audio array
        sr: Sample rate
        
    Returns:
        Path to temporary WAV file
    """
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    temp_path = temp_file.name
    temp_file.close()
    
    sf.write(temp_path, audio, sr)
    
    return temp_path


def get_audio_duration(audio: np.ndarray, sr: int) -> float:
    """
    Calculate audio duration in seconds.
    
    Args:
        audio: Audio array
        sr: Sample rate
        
    Returns:
        Duration in seconds
    """
    return len(audio) / sr


def resample_audio(audio: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
    """
    Resample audio to target sample rate.
    
    Args:
        audio: Audio array
        orig_sr: Original sample rate
        target_sr: Target sample rate
        
    Returns:
        Resampled audio array
    """
    if orig_sr == target_sr:
        return audio
        
    return librosa.resample(audio, orig_sr=orig_sr, target_sr=target_sr)
