# Voice Analysis Functionality - End-to-End Documentation

## Overview

Mirror Note is an AI-powered voice analysis platform that analyzes voice recordings to provide communication insights and personalized training recommendations.

**Key Components:**
- Frontend: React Native (Expo) + TypeScript
- Backend: Python FastAPI + MongoDB
- AI: OpenAI Whisper (transcription) + GPT-4 via Kindo.ai (analysis)
- Auth: JWT session tokens

---

## Architecture

```
User Device (React Native)
    ↓ [Record Audio]
    ↓ [Convert to Base64]
    ↓ [HTTP POST]
FastAPI Backend
    ↓ [Decode Audio]
    ↓ [Whisper Transcription]
    ↓ [GPT-4 Analysis]
    ↓ [Generate Questions]
    ↓ [Save to MongoDB]
Results Display
```

---

## Complete Flow

### 1. Recording Phase (`/frontend/app/recording.tsx`)

**User Actions:**
1. Select mode: Free Speaking or Guided Reading
2. Grant microphone permission
3. Start recording (max 2 minutes)
4. Stop recording and submit

**Key Code:**
```typescript
// Start recording
const { recording } = await Audio.Recording.createAsync(
  Audio.RecordingOptionsPresets.HIGH_QUALITY
);

// Save to persistent cache
const targetPath = `${FileSystem.cacheDirectory}recordings/recording-${Date.now()}.m4a`;
await FileSystem.copyAsync({ from: uri, to: targetPath });

// Navigate to processing
router.push({
  pathname: '/processing',
  params: { audioUri: targetPath, mode, recordingTime }
});
```

---

### 2. Processing Phase (`/frontend/app/processing.tsx`)

**Visual Progress:**
- 25%: Uploading - Read file as Base64
- 50%: Transcribing - Send to backend
- 75%: Analyzing - AI processing
- 100%: Generating - Training questions

**Key Code:**
```typescript
// Read audio as Base64
const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
  encoding: 'base64'
});

// Send to backend
const response = await axios.post(`${BACKEND_URL}/api/analyze-voice`, {
  audio_base64: audioBase64,
  user_id: user?.id,
  recording_mode: mode,
  recording_time: recordingTime
});

// Navigate to results
router.replace({
  pathname: '/results',
  params: { assessmentId: response.data.assessment_id }
});
```

---

### 3. Backend Processing (`/backend/server.py`)

**Endpoint:** `POST /api/analyze-voice`

**Processing Steps:**

#### Step 1: Authentication & Usage Check
```python
user = await auth_service.get_current_user(request)
usage_check = await usage_service.check_can_create_assessment(user["id"])
if not usage_check["allowed"]:
    raise HTTPException(status_code=403, detail=usage_check["reason"])
```

#### Step 2: Create Assessment Record
```python
assessment_id = str(uuid.uuid4())
await db.assessments.insert_one({
    "assessment_id": assessment_id,
    "user_id": user["id"],
    "audio_data": request_data.audio_base64,
    "processed": False,
    "created_at": datetime.utcnow()
})
```

#### Step 3: Decode & Transcribe Audio
```python
# Decode Base64 to audio file
audio_bytes = base64.b64decode(request_data.audio_base64)
temp_audio_path = f"{tempfile.gettempdir()}/{assessment_id}.m4a"
with open(temp_audio_path, "wb") as f:
    f.write(audio_bytes)

# Transcribe with Whisper
with open(temp_audio_path, "rb") as audio_file:
    transcription_response = openai_audio_client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        response_format="text"
    )
    transcription = transcription_response.text

os.remove(temp_audio_path)
```

#### Step 4: Analyze Transcription
```python
analysis = analyze_transcription(transcription, request_data.recording_time)
```

**Analysis Function:**
```python
def analyze_transcription(text: str, recording_time: int):
    # Calculate basic metrics
    word_count = len(text.split())
    speaking_pace = int((word_count / recording_time) * 60)
    filler_words = detect_filler_words(text)
    
    # GPT-4 Analysis via Kindo.ai
    prompt = f"""Analyze this voice transcription:
    Transcription: "{text}"
    Speaking pace: {speaking_pace} WPM
    
    Provide JSON:
    - archetype, overall_score, clarity_score, confidence_score
    - tone, strengths[], improvements[]
    - pitch_avg, pitch_range
    """
    
    response = openai_text_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an expert voice coach."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    gpt_analysis = json.loads(response.choices[0].message.content)
    
    return {
        **gpt_analysis,
        "speaking_pace": speaking_pace,
        "filler_words": filler_words,
        "word_count": word_count
    }
```

#### Step 5: Generate Training Questions
```python
def generate_training_questions(analysis, transcription):
    prompt = f"""Generate 10 training questions based on:
    - Archetype: {analysis['archetype']}
    - Improvements: {analysis['improvements']}
    
    Format: JSON array with question, answer, is_free (first 3 true)
    """
    
    response = openai_text_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a communication coach."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)["questions"][:10]
```

#### Step 6: Save Results
```python
# Update assessment
await db.assessments.update_one(
    {"assessment_id": assessment_id},
    {"$set": {
        "transcription": transcription,
        "analysis": analysis,
        "processed": True,
        "processed_at": datetime.utcnow()
    }}
)

# Save training questions
await db.training_questions.insert_one({
    "assessment_id": assessment_id,
    "questions": training_questions
})

return {"assessment_id": assessment_id, "status": "completed"}
```

---

### 4. Results Display (`/frontend/app/results.tsx`)

**Fetch Assessment:**
```typescript
const response = await axios.get(
  `${BACKEND_URL}/api/assessment/${assessmentId}`
);
setAssessment(response.data);
```

**Display Components:**
1. **Overall Score** - Circular score display (0-100)
2. **Voice Archetype** - e.g., "Confident Presenter"
3. **Key Metrics** - Clarity, Confidence, Speaking Pace (WPM)
4. **Pitch Analysis** - Average Hz + Range (Low/Medium/High)
5. **Filler Words** - Bar chart visualization
6. **Strengths** - 3-4 key strengths
7. **Improvements** - 3-4 areas to work on
8. **Training Questions** - First 3 free, rest premium
9. **Upgrade CTA** - For free users

---

## Key Algorithms

### Filler Words Detection
```python
def detect_filler_words(text: str) -> Dict[str, int]:
    filler_patterns = {
        "um": r'\bum\b',
        "uh": r'\buh\b',
        "like": r'\blike\b',
        "you know": r'\byou know\b',
        "so": r'\bso\b',
        "actually": r'\bactually\b',
        "basically": r'\bbasically\b'
    }
    
    text_lower = text.lower()
    return {
        filler: len(re.findall(pattern, text_lower))
        for filler, pattern in filler_patterns.items()
        if len(re.findall(pattern, text_lower)) > 0
    }
```

---

## Security & Authentication

### JWT Token Flow
1. User logs in via Clerk (frontend)
2. Frontend exchanges session ID for JWT token
3. Token stored in AsyncStorage
4. Token sent in Authorization header: `Bearer <token>`
5. Backend validates token on each request

```python
async def get_current_user(self, request: Request):
    auth_header = request.headers.get("Authorization")
    token = auth_header.replace("Bearer ", "")
    
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    user = await self.db.users.find_one({"id": payload["user_id"]})
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
```

---

## Usage Limits

### Plans
- **Free**: 5 assessments (lifetime)
- **Premium**: 30 assessments per month (₹499/month)

### Usage Check
```python
async def check_can_create_assessment(self, user_id: str):
    user = await self.db.users.find_one({"id": user_id})
    is_premium = user.get("isPremium", False)
    
    if is_premium:
        # Count this month
        start_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0)
        count = await self.db.assessments.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": start_of_month}
        })
        limit = 30
    else:
        # Count total
        count = await self.db.assessments.count_documents({"user_id": user_id})
        limit = 5
    
    if count >= limit:
        return {"allowed": False, "reason": "Limit reached"}
    return {"allowed": True}
```

---

## Error Handling

### Frontend
```typescript
catch (err) {
  if (err.response?.status === 401) {
    setError('Not authenticated. Please log in.');
  } else if (err.response?.status === 403) {
    setError('Usage limit reached. Upgrade to premium.');
  } else {
    setError('Processing failed. Try again.');
  }
}
```

### Backend
```python
@api_router.post("/analyze-voice")
async def analyze_voice(...):
    try:
        # ... processing ...
    except HTTPException:
        raise  # Re-raise auth/usage errors
    except Exception as e:
        logger.error(f"Error: {e}")
        await db.assessments.update_one(
            {"assessment_id": assessment_id},
            {"$set": {"processed": True, "error": str(e)}}
        )
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Data Models

### Assessment Document
```json
{
  "assessment_id": "uuid",
  "user_id": "user-uuid",
  "recording_mode": "free",
  "recording_time": 45,
  "transcription": "Full text...",
  "analysis": {
    "archetype": "Confident Presenter",
    "overall_score": 82,
    "clarity_score": 85,
    "confidence_score": 80,
    "tone": "Professional",
    "strengths": ["Clear articulation", "Good pacing"],
    "improvements": ["Reduce filler words"],
    "pitch_avg": 150,
    "pitch_range": "Medium",
    "speaking_pace": 145,
    "filler_words": {"um": 3, "like": 5},
    "filler_count": 8,
    "word_count": 250
  },
  "processed": true,
  "created_at": "2024-01-01T00:00:00Z",
  "processed_at": "2024-01-01T00:01:30Z"
}
```

---

## Summary

The voice analysis system follows this end-to-end flow:

1. **Record** - User records audio (React Native)
2. **Upload** - Audio converted to Base64 and sent via HTTP
3. **Transcribe** - Backend uses OpenAI Whisper
4. **Analyze** - GPT-4 analyzes transcription for metrics
5. **Generate** - AI creates personalized training questions
6. **Store** - Results saved to MongoDB
7. **Display** - Frontend fetches and presents results

The system integrates authentication, usage tracking, AI processing, and premium features to provide a comprehensive voice analysis platform.
