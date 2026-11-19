# 📊 AI Interview Coach: Executive Cost & Capacity Analysis
**Scale Benchmark:** 500 Active Users • 2 Interviews/Day (30 Mins each) • 30,000 Interviews/Month  
**Prepared for:** Nitya Cloudtech Leadership Team  

---

## 1. Executive Summary & Key Takeaways

| Metric | Google Gemini 2.5/1.5 Flash (Recommended) | Groq Llama-3.3 70B (Ultra Low Latency) | OpenAI GPT-4o-mini (Industry Baseline) |
| :--- | :--- | :--- | :--- |
| **Cost Per 30-Min Interview** | **\$0.0020** (₹0.17) | **\$0.0108** (₹0.91) | **\$0.0040** (₹0.34) |
| **Daily Cost (1,000 Interviews)** | **\$2.01** (₹171) | **\$10.79** (₹917) | **\$4.02** (₹342) |
| **Monthly AI Cost (30,000 Interviews)** | **\$60.30** (₹5,125) | **\$323.70** (₹27,515) | **\$120.60** (₹10,250) |
| **Server Hosting (Render + Vercel)** | **\$27.00** (₹2,295) | **\$27.00** (₹2,295) | **\$27.00** (₹2,295) |
| **Total Monthly Operating Cost** | **~\$87 / month** (~₹7,400) | **~\$350 / month** (~₹29,800) | **~\$148 / month** (~₹12,500) |
| **Monthly Cost Per Active User** | **₹14.80 / user / mo** | **₹59.60 / user / mo** | **₹25.00 / user / mo** |

---

## 2. Traffic & Workload Math

- **500 Daily Users** $\times$ **2 Interviews/day** = **1,000 Interviews / Day**.
- **Monthly Total:** 30,000 Interviews / Month.
- **Tokens per 30-min Interview:**
  - **Input Tokens:** ~14,000 tokens (Resume parsing, question generator, ~15 chat turns with context history, rubric evaluation, final report).
  - **Output Tokens:** ~3,180 tokens (AI replies, hint text, dynamic follow-ups, detailed feedback).
- **Monthly Token Volume:**
  - Total Input: **420 Million Tokens / Month**
  - Total Output: **95.4 Million Tokens / Month**

---

## 3. Cost Per AI Model Option

### Option 1: Google Gemini 2.5 Flash / 1.5 Flash (Best Value & Highly Recommended)
- Input: \$0.075 / 1 Million tokens
- Output: \$0.300 / 1 Million tokens
- **Cost per Interview:** **\$0.0020** (~₹0.17 INR)
- **Monthly AI Bill (30,000 interviews):** **\$60.30** (~₹5,125 INR)

### Option 2: Groq Cloud (Llama-3.3-70B-Versatile) (Ultra-Fast 300+ Tokens/sec)
- Input: \$0.59 / 1 Million tokens
- Output: \$0.79 / 1 Million tokens
- **Cost per Interview:** **\$0.0108** (~₹0.91 INR)
- **Monthly AI Bill (30,000 interviews):** **\$323.70** (~₹27,515 INR)

### Option 3: OpenAI (GPT-4o-mini)
- Input: \$0.15 / 1 Million tokens
- Output: \$0.60 / 1 Million tokens
- **Cost per Interview:** **\$0.0040** (~₹0.34 INR)
- **Monthly AI Bill (30,000 interviews):** **\$120.60** (~₹10,250 INR)

---

## 4. Voice Transcription & Hosting Costs

- **Voice Input (Speech-to-Text):**
  - Browser Web Speech API: **\$0.00 (100% Free)**
  - Groq Whisper Cloud API Fallback: **~\$10.00 / month**
- **Hosting Infrastructure:**
  - Vercel Pro (Frontend Global CDN): **\$20.00 / month**
  - Render Starter Web Service (Backend FastAPI 24/7): **\$7.00 / month**
  - Total Hosting: **\$27.00 / month** (~₹2,295 INR)

---

## 5. Total Monthly Budget (Gemini Flash Architecture)

| Component | Cost (USD) | Cost (INR) | Notes |
| :--- | :--- | :--- | :--- |
| **Gemini 2.5 Flash API** | \$60.30 | ₹5,125 | 30,000 interviews (420M in / 96M out) |
| **Whisper Audio Fallback** | \$10.00 | ₹850 | Audio fallback when browser mic is quiet |
| **Render Web Service** | \$7.00 | ₹595 | 24/7 Python backend server |
| **Vercel Pro** | \$20.00 | ₹1,700 | Production frontend CDN & custom domain |
| **TOTAL** | **\$97.30 / mo** | **~₹8,270 / mo** | **Full production cost for 500 active users** |

### Per-User Cost:
- 1 User doing 60 interviews a month costs you only **₹16.50 INR / month** (\$0.19)!
