# Installation & Setup Guide - Acoustic Voice Analysis

## Prerequisites
- Python 3.9+ 
- Node.js 16+
- MongoDB running
- OpenAI API key

---

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

**New packages installed:**
- `parselmouth` - Praat-based voice analysis
- `librosa` - Audio feature extraction
- `soundfile` - Audio I/O
- `webrtcvad` - Voice activity detection
- `scipy` - Scientific computing
- `resampy` - Audio resampling
- `faster-whisper` - Optional improved transcription

### 2. Verify Installation
```bash
python -c "import librosa; print('librosa:', librosa.__version__)"
python -c "import webrtcvad; print('webrtcvad installed')"
python -c "import soundfile; print('soundfile installed')"
```

### 3. Environment Variables
Ensure `backend/.env` has:
```env
OPENAI_API_KEY=your_key_here
MONGO_URL=mongodb://localhost:27017
DB_NAME=mirrornote
```

### 4. Start Server
```bash
cd backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Variables
Ensure `frontend/.env` has:
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
npx expo start
```

---

## Testing the Implementation

### Quick Test Flow

1. **Start backend** (port 8000)
2. **Start frontend** (Expo)
3. **Record a voice sample** (30-60 seconds recommended)
4. **Submit for analysis**
5. **Check results screen**

### What to Look For

#### ✅ Results Screen Should Show:
- **Voice Personality**: e.g., "Dynamic Storyteller", "Thoughtful Speaker"
- **Headline**: Conversational summary (no technical terms)
- **Key Insights**: 5-7 specific observations in plain language
- **Strengths**: 3-4 things done well
- **Growth Opportunities**: 3-4 actionable improvements
- **Quick Tips**: 1-3 immediate actions

#### ✅ Check MongoDB
```javascript
// In MongoDB shell or Compass
db.assessments.findOne({}, { analysis: 1 })

// Should see structure:
{
  analysis: {
    insights: {
      voice_personality: "Dynamic Storyteller",
      headline: "Your voice is...",
      key_insights: ["...", "..."],
      // ...
    },
    metrics: {
      speaking_pace: 145,
      vocal_variety: "High",
      // ...
    },
    technical: {
      prosody: { pitch_mean: 180.5, pitch_std: 42.3, ... },
      loudness: { rms_mean: 0.042, dynamic_range_db: 12.5, ... },
      // ...
    }
  }
}
```

### Troubleshooting

#### Backend Issues

**ImportError: No module named 'librosa'**
```bash
pip install librosa soundfile
```

**"Sample rate not supported" error**
- WebRTC VAD requires 8000, 16000, 32000, or 48000 Hz
- Our code auto-resamples to 16000 Hz, this should be rare

**Slow processing (>60s)**
- Normal for 2-min audio on CPU
- Consider shorter test clips (30-60s)
- GPU not required but can speed up if available

**GPT analysis fails**
- Check OPENAI_API_KEY in .env
- Verify Kindo.ai routing is working
- Fallback to rule-based insights should still work

#### Frontend Issues

**Results not showing new insights**
- Check backend logs for errors
- Verify API response includes `analysis.insights` object
- Fallback to legacy fields should display something

**TypeScript errors**
- Run `npm install` again
- Restart Expo dev server
- Check that PersonalizedResults.tsx was created

---

## Verifying Acoustic Features

### Test with a Known Sample

Create a test with known characteristics:

**Monotone speech (low pitch variation)**
- Expected: `pitch_std` < 25
- UI should say: "steady, controlled tone"

**Energetic speech (high pitch variation)**
- Expected: `pitch_std` > 45
- UI should say: "rich, expressive melody"

**Many pauses**
- Expected: `pause_count` > 15
- UI should mention: "thoughtful pauses"

**Fast pacing**
- Expected: `speaking_pace` > 160 WPM
- UI should say: "quick pace" or "fast-paced"

---

## Performance Benchmarks

### Expected Processing Times (CPU-only)

| Audio Duration | Processing Time | Notes |
|----------------|----------------|-------|
| 30 seconds | 10-15s | Ideal for testing |
| 60 seconds | 20-30s | Recommended max |
| 120 seconds | 40-60s | Current system limit |

**Breakdown:**
- Audio loading: ~1s
- VAD segmentation: ~2-5s
- Feature extraction: ~5-15s
- Whisper transcription: ~10-30s (depends on audio length)
- GPT analysis: ~5-10s

---

## Common Scenarios

### 1. Fresh Install
```bash
# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn server:app --reload

# Frontend (new terminal)
cd frontend
npm install
npx expo start
```

### 2. Update After Code Changes
```bash
# Backend - restart uvicorn (auto-reloads with --reload flag)

# Frontend - usually hot-reloads automatically
# If not, press 'r' in Expo terminal
```

### 3. Database Reset
```javascript
// In MongoDB shell
db.assessments.deleteMany({});  // Clear old assessments
```

---

## Module Testing

### Test Individual Modules

**Audio Utils**
```python
from backend import audio_utils
import base64

# Load test audio
with open("test.m4a", "rb") as f:
    audio_b64 = base64.b64encode(f.read()).decode()

audio, sr = audio_utils.load_audio_from_base64(audio_b64)
print(f"Loaded: {len(audio)} samples at {sr} Hz")
print(f"Duration: {audio_utils.get_audio_duration(audio, sr):.2f}s")
```

**VAD**
```python
from backend import vad

segments = vad.segment_speech(audio, sr)
metrics = vad.compute_timing_metrics(segments, duration)
print(f"Speech ratio: {metrics['speech_ratio']:.2f}")
print(f"Pauses: {metrics['pause_count']}")
```

**Feature Extraction**
```python
from backend import feature_extractor

features = feature_extractor.extract_all_features(audio, sr, segments)
print(f"Pitch mean: {features['prosody']['pitch_mean']:.1f} Hz")
print(f"Dynamic range: {features['loudness']['dynamic_range_db']:.1f} dB")
```

**Insights Generator**
```python
from backend import insights_generator

all_metrics = {
    "prosody": features["prosody"],
    "loudness": features["loudness"],
    "quality": features["quality"],
    "timing": metrics,
    "filler_words": {"um": 5, "like": 8},
    "word_count": 200,
    "speaking_pace": 145,
    "duration": 60
}

insights = insights_generator.generate_personalized_summary(all_metrics)
print(f"Personality: {insights['voice_personality']}")
print(f"Headline: {insights['headline']}")
```

---

## Next Steps

1. ✅ **Install dependencies** (backend + frontend)
2. ✅ **Start servers** (backend port 8000, frontend Expo)
3. ✅ **Test with a recording** (30-60s recommended)
4. ✅ **Verify personalized insights** appear in results
5. ✅ **Check MongoDB** for full analysis structure
6. 📝 **Gather feedback** on insight quality
7. 🚀 **Deploy** to production when ready

---

## Support

### Logs to Check

**Backend errors:**
```bash
# Terminal running uvicorn will show:
# - Audio loading issues
# - Feature extraction errors
# - GPT API errors
```

**Frontend errors:**
```bash
# Expo terminal shows:
# - API connection issues
# - Rendering errors
# Press Shift+M for dev menu
```

### Debug Mode

Add to `backend/.env`:
```env
LOG_LEVEL=DEBUG
```

This will print detailed feature extraction info.

---

## Success Criteria

✅ Backend starts without import errors  
✅ Audio uploads successfully  
✅ Processing completes in <60s  
✅ Results show personalized insights (not just scores)  
✅ No technical jargon visible to user  
✅ MongoDB contains `analysis.technical` data  
✅ Frontend displays gracefully (no crashes)  

---

**Ready to test!** 🎙️ Record a voice sample and see your personalized analysis.
