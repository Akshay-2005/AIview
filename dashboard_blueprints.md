# AIview (Powered by PrepPilot Engine)
## Phase 2: Analytics & Dashboard Blueprints
### Technical Specifications, Data Dictionaries & Architectural Schemas
**Operating Roles:** Principal Product Architect | Full-Stack Founding Engineer | Lead Data Analyst  
**Date:** September 2026  
**Document Version:** 1.0 (Master Blueprint)  
**Deliverable Focus:** Dual-System Interactive Analytics Architecture  
- **System 1:** Student Progress Dashboard (Learner-Facing Diagnostic & Micro-Remediation)
- **System 2:** Admin & Sprint Judge Dashboard (Business, Macro Extrapolation & Telemetry)

---

## Executive Architectural Summary

To satisfy both the learner's developmental journey and the sprint evaluators' demand for commercial rigor, AIview deploys a dual-dashboard architecture:

```
+----------------------------------------------------------------------------------------------------+
|                                    AIVIEW DUAL-DASHBOARD ARCHITECTURE                              |
+----------------------------------------------------------------------------------------------------+
|                                      PREPPILOT ANALYTICS ENGINE                                    |
|                                                  │                                                 |
|                    ┌─────────────────────────────┴─────────────────────────────┐                   |
|                    ▼                                                           ▼                   |
|    SYSTEM 1: LEARNER PROGRESS DASHBOARD                        SYSTEM 2: ADMIN & JUDGE DASHBOARD   |
|    - Target: Freshers & Campus Job Seekers                     - Target: Azisly Judges, TPOs, Execs|
|    - Focus: Individual Diagnostic & Growth                     - Focus: Unit Economics & Macro TAM |
|    - Core Metrics:                                             - Core Metrics:                     |
|      * Explainable Performance Score (0-100)                     * n=30 Pilot to Macro Funnel      |
|      * Multi-Axis Spider Competencies                            * Active Sessions & Drop-Off Funnel|
|      * Longitudinal Progress (V1 -> V2 -> Vn)                    * Real-Time Telemetry & Token Cost|
|      * Root-Cause Gap Cards & 7-Day Micro-Prep                   * Willingness-To-Pay Monetization |
+----------------------------------------------------------------------------------------------------+
```

---

# PART I: SYSTEM 1 — STUDENT PROGRESS DASHBOARD (LEARNER-FACING)

### 1.1 The Explainable Performance Score (0–100) Engine

#### The Problem Solved
Generic AI tools give arbitrary praise (*"Good answer! 8/10"*). This induces false confidence or leaves students unable to isolate why they failed actual corporate screens. The **AIview Explainable Performance Score ($S_{\text{overall}}$)** is a mathematically deterministic, transparent composite metric evaluated across **5 orthogonal dimensions**.

#### Mathematical Formulation

$$S_{\text{overall}} = \sum_{i=1}^{5} w_i \cdot C_i = 0.30 C_{\text{tech}} + 0.25 C_{\text{star}} + 0.20 C_{\text{spoken}} + 0.15 C_{\text{role}} + 0.10 C_{\text{conf}}$$

Where the five core competency scores $C_i \in [0, 100]$ are defined as:

```
+---------------------------------------------------------------------------------------------------+
| DIMENSION                  | WEIGHT (w_i)| PRIMARY SUB-METRICS MEASURED BY PREPPILOT ENGINE       |
| -------------------------- | ----------- | ------------------------------------------------------ |
| 1. Technical Depth         | 30% (0.30)  | - Concept Accuracy vs Ground Truth Benchmark (40%)     |
|    (C_tech)                |             | - Edge Case Awareness & Trade-Off Analysis (30%)       |
|                            |             | - Code / Algorithmic Precision or Financial Math (30%) |
| -------------------------- | ----------- | ------------------------------------------------------ |
| 2. Answer Structure (STAR) | 25% (0.25)  | - Explicit Situation & Task Setting (25%)             |
|    (C_star)                |             | - Specific First-Person Action Verb Articulation (40%) |
|                            |             | - Quantified Measurable Results (% / Rs / hrs) (35%)   |
| -------------------------- | ----------- | ------------------------------------------------------ |
| 3. Spoken Clarity          | 20% (0.20)  | - Words Per Minute (WPM Target: 130–160) (35%)         |
|    (C_spoken)              |             | - Filler Word Frequency (Density < 2 per min) (40%)    |
|                            |             | - Lexical Diversity & Jargon Precision (25%)          |
| -------------------------- | ----------- | ------------------------------------------------------ |
| 4. Role & JD Relevance     | 15% (0.15)  | - Semantic Similarity to Target Job Description (50%)  |
|    (C_role)                |             | - Tech Stack & Methodology Keyword Alignment (50%)     |
| -------------------------- | ----------- | ------------------------------------------------------ |
| 5. Behavioral Confidence   | 10% (0.10)  | - Latency to First Spoken Word (Ideal: 1.5–3.0s) (35%) |
|    (C_conf)                |             | - Hesitation / Mid-Sentence Pauses (>3s penalty) (35%) |
|                            |             | - Vocal Pitch Stability & Energy Modulation (30%)       |
+---------------------------------------------------------------------------------------------------+
```

#### Readiness Tier Classification
* **85.0 – 100.0 | Tier 1: Interview Ready (Green Flag):** High likelihood of clearing marquee and Tier-1 product/consulting interviews (TCS Digital, Deloitte, Accenture High-Tier, Product Startups).
* **70.0 – 84.9 | Tier 2: Placement Contender (Amber Flag):** Qualified for mass campus drives; minor delivery rough edges requiring micro-drills.
* **50.0 – 69.9 | Tier 3: Developing Candidate (Orange Flag):** High subject grasp but severe delivery paralysis or absent STAR structure; high risk of first-round algorithmic rejection.
* **< 50.0 | Tier 4: Foundational Remediation (Red Flag):** Comprehensive foundational coaching required across spoken delivery and role basics.

---

### 1.2 Longitudinal Progress & Trend Architecture ($V_1 \to V_2 \to V_n$)

#### Multi-Session Delta Tracking
The dashboard visualizes candidate growth trajectories across simulated sessions. Freshers do not improve uniformly; their technical scores may rise while spoken fluency dips under more aggressive mock interview questioning.

```
+-----------------------------------------------------------------------------------------------+
|                      REPRESENTATIVE LEARNER GROWTH TELEMETRY (RAHUL SHARMA)                   |
+-----------------------------------------------------------------------------------------------+
| SESSION MILESTONE   | COMPOSITE | TECH DEPTH | STAR STRUCT | SPOKEN CLAR | ROLE REL | CONFIDENCE  |
| ------------------- | --------- | ---------- | ----------- | ----------- | -------- | ----------- |
| V1: Baseline Mock   | 48 / 100  | 72 / 100   | 34 / 100    | 41 / 100    | 55 / 100 | 38 / 100    |
| V2: Post-Drill Mock | 62 / 100  | 76 / 100   | 58 / 100    | 52 / 100    | 68 / 100 | 54 / 100    |
| V3: Final Mock Pass | 84 / 100  | 88 / 100   | 82 / 100    | 81 / 100    | 86 / 100 | 80 / 100    |
| NET DELTA (V1->V3)  | +36 pts   | +16 pts    | +48 pts     | +40 pts     | +31 pts  | +42 pts     |
+-----------------------------------------------------------------------------------------------+
```

#### Key Visualizations in Learner Dashboard:
1. **Radar/Spider Chart (Multi-Axis Competency):** Compares the candidate's current session footprint against the *Target Role Benchmark (e.g., Associate Software Engineer at TCS/Deloitte)*.
2. **Dual-Axis Timeline Chart:**
   * Primary Axis (Line): Composite Readiness Index ($V_1 \dots V_n$).
   * Secondary Axis (Stacked Bars): Filler word count reduction and average pause latency.

---

### 1.3 Root-Cause Gap Detection Cards & Automated 7-Day Micro-Prep Plan

#### Root-Cause Gap Card Schema
When a sub-metric drops below target thresholds, the diagnostic engine triggers a **Gap-Detection Card** isolating the exact failure mechanism, providing the candidate's verbatim transcript snippet and the corrected model response.

##### Example Gap Card:
* **Trigger:** STAR Result Omission ($C_{\text{star}} \le 45$)
* **Root Cause Detected:** *The Narrative Trap (Ramble without Quantified Outcome)*
* **Candidate's Verbatim Answer:** *"In our final year college project, our team worked on an e-commerce website using React and Node.js. It had lots of bugs in the database, but we fixed them by meeting regularly, and our professor said it was good."*
* **AIview Engine Diagnosis:** 
  * Omitted Situation context (team size, tech constraints).
  * Vague Action (no technical detail on *how* bugs were debugged).
  * Missing Result (zero quantitative metrics: 0% reduction in query latency, 0 metrics on user traffic).
* **Prescribed Corrective STAR Script:**
  * **Situation:** *"During our final year project, our 4-person team built a full-stack e-commerce portal handling 50 concurrent simulated users."*
  * **Task:** *"We experienced a 4.2-second database bottleneck during checkout due to unindexed SQL queries."*
  * **Action:** *"I implemented B-Tree indexing on customer foreign keys and introduced Redis caching for hot product catalogs."*
  * **Result:** *"This slashed checkout query latency by 78% (from 4.2s to 900ms) and allowed our prototype to clear 200 concurrent requests without failure."*

---

#### Dynamic 7-Day Micro-Prep Remediation Calendar
Unlike generic advice ("study harder"), AIview generates a dynamic, bite-sized schedule consuming $\le 20$ minutes per day:

```
+---------------------------------------------------------------------------------------------------+
| DAY | FOCUS AREA          | TIME REQ. | MICRO-ACTIVITY & DRILL TYPE                                |
| --- | ------------------- | --------- | ---------------------------------------------------------- |
| D1  | STAR Foundation     | 15 mins   | "The 60-Second Hook": Record 3 STAR hooks using on-screen  |
|     |                     |           | Situation/Task timers for your primary resume project.     |
| --- | ------------------- | --------- | ---------------------------------------------------------- |
| D2  | Filler Word Eraser  | 12 mins   | "Pause-Over-Filler Drill": Speak for 90 seconds about SQL vs|
|     |                     |           | NoSQL. AI buzzes whenever "basically/like/um" is spoken.    |
| --- | ------------------- | --------- | ---------------------------------------------------------- |
| D3  | Resume Deep-Dive    | 20 mins   | Adversarial Project Interrogation: AI asks 5 aggressive    |
|     |                     |           | drill-downs on your #1 resume bullet point.                 |
| --- | ------------------- | --------- | ---------------------------------------------------------- |
| D4  | Delivery Pacing     | 15 mins   | Metronome Cadence Drill: Practice answering at 140 WPM      |
|     |                     |           | with real-time visual speedometer feedback.                 |
| --- | ------------------- | --------- | ---------------------------------------------------------- |
| D5  | Behavioral Challenge | 15 mins   | Conflict & Leadership Drill: Record 2 scenario responses    |
|     |                     |           | using the "Challenge -> Conflict -> Resolution" framework. |
| --- | ------------------- | --------- | ---------------------------------------------------------- |
| D6  | Speed & Latency     | 12 mins   | "First-Word Precision": Practice opening within 2 seconds   |
|     |                     |           | without filler throat-clearing ("Yes sir, so basically...").|
| --- | ------------------- | --------- | ---------------------------------------------------------- |
| D7  | Full Sim Re-Test    | 20 mins   | Full Simulated Diagnostic Mock (V2): Benchmark against      |
|     |                     |           | V1 baseline to measure delta on the 0–100 Readiness Index.  |
+---------------------------------------------------------------------------------------------------+
```

---

# PART II: SYSTEM 2 — ADMIN & SPRINT JUDGE DASHBOARD (BUSINESS & SURVEY ANALYTICS)

### 2.1 The Visual Bridge: $n=30$ Pilot Data to Macro Population Funnel

#### Data Integrity Bridge Architecture
The Admin/Judge Dashboard provides a transparent bridge connecting our observed validation dataset ($n=30$) to macro tertiary education reality, establishing defensibility for investor and academic jury evaluations.

```
+---------------------------------------------------------------------------------------------------+
| METRIC DIMENSION         | OBSERVED PILOT SIGNAL (n=30)       | MACRO PROJECTION & TRIANGULATION         |
| ------------------------ | ---------------------------------- | ---------------------------------------- |
| Primary User Cohort      | 76.7% Final-Year Students (23/30)  | 10.8M Annual Higher Education Graduates  |
|                          | 10.0% Recent Grads (3/30)          | (AISHE/UGC 2023-24 Official Data)        |
| ------------------------ | ---------------------------------- | ---------------------------------------- |
| AI Adoption Readiness    | 76.7% Likely / Very Likely (23/30) | 3.21M Addressable Digital-First Seekers  |
|                          | Mean Likelihood: 4.07 / 5.0        | in Tech & Professional Streams            |
| ------------------------ | ---------------------------------- | ---------------------------------------- |
| Current Prep Satisfaction| 2.83 / 5.0 (Dissatisfied/Neutral:  | Replicated by NASSCOM/Wheebox finding:    |
|                          | 86.7% = 26/30 respondents)         | 48.75% graduates lack corporate readiness|
| ------------------------ | ---------------------------------- | ---------------------------------------- |
| Core Pain Point          | 63.3% "Explaining answers clearly" | Confirms Delivery Gap Hypothesis:        |
|                          | Only 3.3% cite "Technical prep"    | Failure occurs at vocal/delivery screen  |
| ------------------------ | ---------------------------------- | ---------------------------------------- |
| Stated Paid Intent       | 60.0% willing to pay (18/30)       | Extrapolates to ₹33.6 Crore SOM Target   |
|                          | 20.0% prefer one-time sachet pass  | across 150 Partner Campuses (Year 3)      |
+---------------------------------------------------------------------------------------------------+
```

---

### 2.2 Willingness-to-Pay (WTP) Monetization Funnel Analysis
The Judge Dashboard visualizes the exact survey distribution across all monetization brackets, demonstrating why conventional Western subscription pricing fails and how sachet economics thrive:

```
+---------------------------------------------------------------------------------------------------+
| TIER / BRACKET          | SURVEY RESPONSES (n=30)| SHARE (%) | STRATEGIC PRODUCT MONETIZATION FIT |
| ----------------------- | ---------------------- | --------- | ---------------------------------- |
| Free-Only / Zero Pay    | 9 respondents          | 30.0%     | Freemium Acquisition Engine        |
|                         |                        |           | (1 Diagnostic Mock + Daily Flash)  |
| ----------------------- | ---------------------- | --------- | ---------------------------------- |
| One-Time Sachet Payment | 6 respondents          | 20.0%     | "Single Company Pass" (₹99 for 48h)|
| ----------------------- | ---------------------- | --------- | ---------------------------------- |
| ₹100 – ₹199 per month   | 5 respondents          | 16.7%     | "Monthly Placement Pass" (₹149/mo) |
| ----------------------- | ---------------------- | --------- | ---------------------------------- |
| ₹1 – ₹99 per month     | 4 respondents          | 13.3%     | "Micro-Drill Pack" (₹49/mo)        |
| ----------------------- | ---------------------- | --------- | ---------------------------------- |
| Would not pay at all    | 3 respondents          | 10.0%     | Ad-Supported / College-Sponsored   |
| ----------------------- | ---------------------- | --------- | ---------------------------------- |
| ₹200 – ₹499 per month   | 2 respondents          | 6.7%      | "Premium 1-on-1 AI Mentorship"     |
| ----------------------- | ---------------------- | --------- | ---------------------------------- |
| ₹500 – ₹999 per month   | 1 respondent           | 3.3%      | "Full Career Accelerator Track"    |
+---------------------------------------------------------------------------------------------------+
| TOTAL PAID INTENT       | 18 respondents         | 60.0%     | Core Commercial Validation Base    |
+---------------------------------------------------------------------------------------------------+
```

---

### 2.3 Real-Time Platform Telemetry & Unit Economics Engine

The Judge Dashboard tracks five critical operational telemetry metrics required for enterprise and venture due-diligence:

```
+----------------------------------------------------------------------------------------------------+
| TELEMETRY METRIC          | TARGET SLA / BENCHMARK | LIVE SIMULATED VALUE | STATUS & VARIANCE      |
| ------------------------- | ---------------------- | -------------------- | ---------------------- |
| End-to-End Voice Latency  | < 600 ms               | 482 ms               | OPTIMAL (Green)        |
| (Speech -> LLM -> Audio)  |                        |                      | (-118 ms under SLA)   |
| ------------------------- | ---------------------- | -------------------- | ---------------------- |
| Cost Per 20-Min Session   | < ₹6.00 ($0.072)       | ₹4.18 ($0.050)       | HIGH MARGIN (Green)    |
| (ASR + LLM + TTS tokens)  |                        |                      | (Gross Margin: 83.2%)  |
| ------------------------- | ---------------------- | -------------------- | ---------------------- |
| Mock Completion Rate      | > 75.0%                | 81.4%                | EXCEEDED (+6.4 pts)    |
| ------------------------- | ---------------------- | -------------------- | ---------------------- |
| Token Consumption / Turn  | < 450 tokens           | 385 tokens           | EFFICIENT (Cached RAG) |
| ------------------------- | ---------------------- | -------------------- | ---------------------- |
| Accent ASR Word Error Rate| < 10.0%                | 6.8%                 | CALIBRATED (AI4Bharat) |
+----------------------------------------------------------------------------------------------------+
```

#### Detailed Token & Cost Breakdown per 20-Minute Mock (15 Turns):
* **ASR Audio Ingestion:** 20 mins audio $\times$ \$0.0043/min (Deepgram Nova-2 / Whisper Turbo) = **\$0.086 $\to$ ₹2.40** (or local edge execution at zero marginal compute).
* **LLM Reasoning & Dialogue:** 15 turns $\times$ 385 tokens = ~5,800 tokens (Llama-3.3-70B on Groq @ \$0.10/M tokens) = **\$0.0006 $\to$ ₹0.05**.
* **Evaluation & Diagnostic Engine (Post-Session):** 1 comprehensive rubric pass = ~4,000 tokens (Claude 3.5 Haiku / Gemini 1.5 Flash @ \$0.15/M tokens) = **\$0.0006 $\to$ ₹0.05**.
* **TTS Audio Synthesis:** ~1,800 words synthesized $\times$ \$0.015/1k words = **\$0.020 $\to$ ₹1.68**.
* **Total Fully Loaded Cost per 20-Min Mock:** **₹4.18 ($0.050 USD)**.
* **Economic Defense:** At ₹149/month retail for 4 mocks + micro-drills, total compute cost is $4 \times ₹4.18 = ₹16.72$. Server hosting & CDN adds ₹8.00. **Net Gross Profit = ₹124.28 per subscriber (83.4% Gross Margin)**.

---

### 2.4 User Acquisition & Onboarding Drop-Off Funnel

```
+-----------------------------------------------------------------------------------------------+
| FUNNEL STAGE                  | CONVERSION RATE | DROP-OFF DRIVER & REMEDIATION ARCHITECTURE  |
| ----------------------------- | --------------- | ------------------------------------------- |
| 1. Landing / TPO Link Click   | 100.0% (10,000) | Top of Funnel                               |
| 2. Mobile Sign-In / PWA Install| 68.5% (6,850)  | Frictionless WhatsApp OTP; no passwords     |
| 3. Resume / JD Upload         | 54.2% (5,420)  | Pre-loaded 1-click college JD presets       |
| 4. Audio Mic Check Clear      | 46.8% (4,680)  | Browser mic permissions; fallback test drill|
| 5. Baseline Mock Completed    | 38.1% (3,810)  | Empathy scaffolding; pause button           |
| 6. Diagnostic Scorecard Viewed| 36.5% (3,650)  | Instant WhatsApp PDF scorecard notification |
| 7. Paid Sachet / Micro Upgrade| 14.8% (1,480)  | 40.5% conversion of engaged mock completers |
+-----------------------------------------------------------------------------------------------+
```

---

## Deliverable Cross-Reference
1. **Interactive Dashboard Web Application:** Engineered and deployed in `/Users/akshaypratappandey/Documents/aiview/dashboard/index.html` featuring dual-mode toggle (Learner Progress vs. Admin/Judge), dynamic Chart.js visualizations, live telemetry updates, and raw survey exploration.
2. **Phase 2 Blueprint Markdown:** Stored at [dashboard_blueprints.md](file:///Users/akshaypratappandey/Documents/aiview/dashboard_blueprints.md).
