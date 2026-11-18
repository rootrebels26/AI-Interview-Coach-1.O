# PERFORMANCE_AUDIT.md — Performance, Latency & Optimization Audit

**Audit Date:** November 2026  
**Auditor:** Performance Engineering Team  
**Status:** AUDITED — LATENCY PROFILES & RESOURCE UTILIZATION

---

## 1. Latency & Response Time Profiles

| Interaction Pipeline | Typical Latency | Bottleneck Source | Assessment |
| :--- | :---: | :--- | :---: |
| **Acknowledge / Mic Check Turn** | **15 - 45 ms** | In-memory regex match in FastAPI | **Ultra-Fast** |
| **Conversational Turn (Groq)** | **450 - 950 ms** | Groq LPU inference (Qwen 27B) | **High Speed** |
| **Single Answer Evaluation** | **650 - 1200 ms** | JSON structured parsing & scoring | **Good** |
| **Resume Parsing (PDF / DOCX)** | **80 - 180 ms** | Local regex & string parsing | **Very Fast** |
| **Live Web Scraping Benchmark** | **300 - 850 ms** | Outbound GitHub raw requests | **Acceptable** |
| **Final Report Synthesis** | **1800 - 3200 ms**| High token output generation | **Moderate** |

---

## 2. Frontend Bundle Size & Chunking Analysis

Upon running `npm run build`:
```text
dist/index.html                   0.91 kB │ gzip:   0.50 kB
dist/assets/index-CFIS0V-x.css   71.34 kB │ gzip:  11.38 kB
dist/assets/index-U8_ABgbw.js   564.31 kB │ gzip: 166.59 kB
```

### Warning Observed
```text
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking
```

### Analysis
- The monolithic JavaScript bundle `564 kB` combines:
  - `@mediapipe/tasks-vision`
  - `framer-motion`
  - `lucide-react`
  - `react-router-dom`
  - All pages (`Home`, `Setup`, `Interview`, `Report`, `Resume`) in a single bundle.
- **Recommended Optimization:** Apply `React.lazy()` for route-level code splitting so `Home` and `Setup` load under 100 kB, with `Interview` and `Report` loaded on demand.

---

## 3. Groq Token Consumption & Rate Limits

- **OTPM (Output Tokens Per Minute):** On Groq free tier, models like `qwen/qwen3.8-27b` have strict OTPM limits (often 4,000 to 6,000 TPM).
- **Optimization Already in Place:** `ai_provider.py` dynamically clamps `max_tokens` to `450` for `qwen3.8-27b` and switches models on `429` rate limits.
- **Remaining Gap:** `report_generator.py` requests `max_tokens=650`, which occasionally triggers `json_validate_failed` if the prompt is too verbose.
- **Correction:** Tighten report prompt schemas to keep output tokens under 400 without omitting critical insights.
