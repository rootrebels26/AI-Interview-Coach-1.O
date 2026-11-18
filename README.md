# 🚀 AI Interview Coach (Standalone Edition)

An intelligent, production-ready, standalone web application designed exclusively for students and job seekers to practice technical and behavioral mock interviews with a realistic AI interviewer.

---

## 🎯 Project Vision & Boundaries

This application is built with **single-purpose focus**:
- ❌ **No login or registration**
- ❌ **No user dashboard or accounts**
- ❌ **No database (SQLite, Postgres, MongoDB, etc.)**
- ❌ **No permanent file storage** (Uploaded resumes are processed in-memory and immediately discarded)
- ❌ **No payment or subscription paywalls**
- ❌ **No pre-defined hardcoded question banks** (Questions are generated in real-time using live web-scraped company benchmarks and candidate resume context)
- ❌ **No heavy local AI model downloads** (Uses verified high-speed free-tier APIs)

---

## 🛠️ Architecture & Tech Stack

```
ai-interview-coach/
├── backend/                  # FastAPI 0.115+ (Python 3.10+)
│   ├── app/
│   │   ├── config.py         # Config validation & settings
│   │   ├── main.py           # Application entrypoint & CORS
│   │   ├── routes/           # REST API endpoints
│   │   │   ├── resume.py     # PDF/DOCX parsing (zero-persistence)
│   │   │   ├── interview.py  # Session lifecycle & 6-question generator
│   │   │   └── evaluation.py # 6-factor evaluator & Whisper audio transcription
│   │   ├── services/
│   │   │   ├── ai_provider.py        # Groq (Qwen) -> Gemini -> OpenRouter fallback
│   │   │   ├── resume_parser.py      # PyMuPDF & python-docx extractor
│   │   │   ├── web_scraper.py        # Live company/role question scraper
│   │   │   ├── question_generator.py # Personalized 6-question curriculum
│   │   │   ├── answer_evaluator.py   # Strict 6-factor answer evaluator
│   │   │   └── report_generator.py   # In-depth candidate feedback report
│   │   └── utils/
│   │       └── validators.py # File type and size security checks
│   ├── requirements.txt      # Backend Python dependencies
│   └── .env.example          # Sample environment variables
│
└── frontend/                 # React 19 + Vite 6 + Tailwind CSS
    ├── src/
    │   ├── components/       # AIInterviewer, CameraMonitor, VoiceRecorder, etc.
    │   ├── context/          # Zero-database in-memory browser session
    │   ├── hooks/            # MediaPipe camera, speech synthesis, tab detector
    │   ├── pages/            # Home -> Setup -> Resume -> Interview -> Report
    │   └── services/         # Axios API client
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## ⚡ Key Features

1. **Focused 5-Step Journey**:
   - `Home`: Clear, distraction-free hero section explaining the 4-step interview journey.
   - `Setup`: Target company (13 tech leaders + custom), job role (13 specialties + custom), interview type (Technical, HR, Coding, etc.), difficulty, and optional job description.
   - `Resume Upload`: Supports PDF and DOCX using PyMuPDF and python-docx. Extracts candidate skills, languages, projects, and work experience. Shows an interactive editable summary before starting.
   - `Interactive Interview`: Dynamic AI interviewer session. Candidates can practice **unlimited questions** (Question 1, 2, 3... 7, 8, etc.) dynamically generated on the fly. Features realistic AI voice synthesis, microphone recording with Groq Whisper transcription fallback, and manual text fallback.
   - `Comprehensive Report (Min 6 Questions)`: A **minimum of 6 questions** must be answered and evaluated to unlock the report. Once 6 questions are completed, candidates can either conclude and view their complete report or continue practicing unlimited questions. Aggregates performance, technical gaps, readiness rating, and 5 tailored practice questions with Print & PDF export.

2. **6-Factor Answer Evaluation Matrix**:
   - **Technical Correctness**: 25%
   - **Relevance**: 20%
   - **Communication Clarity**: 15%
   - **Problem Solving**: 15%
   - **Practical Examples**: 15%
   - **Answer Structure**: 10%
   - **Total**: 100% (Strict mathematical weighting and clamping)

3. **Optional Privacy-First Monitoring**:
   - **Local Camera Posture Analysis**: Runs Google MediaPipe Face Detection 100% inside the browser. No camera frames are ever sent to the backend or saved anywhere. Gentle notifications for downward head tilt or prolonged off-center gaze (>4s).
   - **Tab-Switch Detection**: Tracks browser visibility events and displays a subtle counter when switching tabs.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python**: 3.10, 3.11, 3.12, 3.13, or 3.14
- **Node.js**: v18 or higher (v20+ recommended)
- **Groq API Key**: Free at [console.groq.com](https://console.groq.com)

---

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd ai-interview-coach/backend

# Create and activate virtual environment (optional but recommended)
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env
# Edit .env and supply your GROQ_API_KEY
```

**Start the Backend Server**:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend runs on `http://localhost:8000` (API documentation available at `http://localhost:8000/docs`).*

---

### 3. Frontend Setup

```bash
# In a new terminal, navigate to the frontend directory
cd ai-interview-coach/frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Running Automated Tests

Run the full end-to-end integration test validating the entire candidate workflow:

```bash
cd ai-interview-coach/backend
$env:PYTHONPATH="."
python app/test_end_to_end_workflow.py
```

All 7 test suites validate:
1. `GET /health` API readiness.
2. File upload validation (rejects invalid extensions and oversized files).
3. `POST /api/interview/analyse-resume` parsing PDF and extracting structured data.
4. `POST /api/interview/start` web-scraping interview benchmarks and generating 6 tailored questions.
5. `POST /api/interview/evaluate-answer` sequential evaluation with strict 6-factor scoring.
6. `POST /api/interview/final-report` generating aggregate metrics and 5 practice questions.
7. Edge case handling (e.g. blank answers receive 0 points and constructive feedback).

---

## 🔒 Privacy & Data Retention Policy

- **Zero Database**: No database engine is installed or connected.
- **Zero Session Persistence**: All interview state lives temporarily in browser session memory.
- **Immediate File Deletion**: Resumes parsed via PyMuPDF/python-docx are processed as in-memory byte streams and never written to permanent disk.
- **Client-Side Computer Vision**: MediaPipe vision processing runs entirely on the candidate's browser WebAssembly runtime.
