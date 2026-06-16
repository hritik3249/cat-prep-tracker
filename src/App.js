import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
}

function getCurrentWeekNum(startDate) {
  if (!startDate) return null;
  const start = new Date(startDate);
  const today = new Date();
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return null;
  return Math.min(Math.max(Math.floor(diffDays / 7) + 1, 1), 16);
}

function getTodayName() {
  const d = new Date().getDay(); // 0=Sun
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d];
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date(new Date().toDateString());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const data = {
  phases: [
    {
      id: 1, month: "Month 1", label: "Foundation & Diagnosis", color: "#E8532A",
      objective: "Identify exact weak areas, build conceptual base, establish study habits",
      skills: [
        "Complete concept mapping for all 3 sections",
        "Identify your personal error taxonomy (concept gap vs. careless vs. time pressure)",
        "Build reading speed baseline → target 250 wpm",
        "Lock in daily study routine before Month 2 intensity kicks in"
      ],
      weekly: [
        { week: "W1–W2", focus: "VARC: Reading fundamentals + RC strategy | Quant: Arithmetic, Number Theory basics | LRDI: Puzzles, Arrangements" },
        { week: "W3–W4", focus: "Quant: Algebra, Geometry | VARC: VA question types (PJ, Odd-one-out) | LRDI: Blood Relations, Scheduling" }
      ]
    },
    {
      id: 2, month: "Month 2", label: "Concept Completion + Drill", color: "#C8972A",
      objective: "Complete full syllabus, start topic-wise drills, begin sectional mocks",
      skills: [
        "Cover remaining Quant: P&C, Probability, Modern Math",
        "LRDI: Games & Tournaments, Data Sufficiency",
        "VARC: Inference, Tone, Summary questions at speed",
        "Start 1 full sectional mock per week"
      ],
      weekly: [
        { week: "W5–W6", focus: "Quant: P&C + Probability + remaining topics | LRDI: Games & Tournaments | VARC: Inference-heavy RC practice" },
        { week: "W7–W8", focus: "Full syllabus revision sprint | 2 sectional mocks | Error log review + gap filling" }
      ]
    },
    {
      id: 3, month: "Month 3", label: "Mock Test Integration", color: "#4A90D9",
      objective: "CAT-simulation environment, speed + accuracy optimization, eliminate 'mock fear'",
      skills: [
        "2 full mocks per week (Sunday + Wednesday)",
        "Deep mock analysis (3 hrs post each mock)",
        "Identify and fix your 'score-killer' question types",
        "Develop attempt strategy per section"
      ],
      weekly: [
        { week: "W9–W10", focus: "2 mocks/week | Quant: Speed drills (30 Qs in 40 min) | VARC: 3 RCs/day at timed pace" },
        { week: "W11–W12", focus: "2 mocks/week | LRDI: Timed set selection practice | All section accuracy audit" }
      ]
    },
    {
      id: 4, month: "Month 4", label: "Peak Performance & Consolidation", color: "#2AAF6F",
      objective: "3 mocks/week, lock in attempt strategy, mental conditioning for exam day",
      skills: [
        "3 mocks/week with 3-hour post-analysis",
        "Revise only your personal error log—no new topics",
        "Perfect your section-wise attempt order",
        "Simulate exam-day conditions (same time slot as actual CAT)"
      ],
      weekly: [
        { week: "W13–W14", focus: "3 mocks/week | Revision of weakest 5 Quant topics | VARC: Passage selection speed" },
        { week: "W15–W16", focus: "3 mocks/week | Final mock analysis | Freeze strategy | Rest 2 days before CAT" }
      ]
    }
  ],
  sections: [
    {
      name: "VARC", icon: "📖", color: "#E8532A",
      approach: [
        "RC (75% of VARC score): Read 1 editorial daily from The Hindu/Economist. After each RC, write 2-line summaries—this builds inference speed.",
        "VA Questions: PJ (Para Jumbles), Odd-one-out, Para Summary—these are pattern-recognition. Do 10 VA Qs daily in 12 min. Time is the constraint, not difficulty.",
        "Do NOT attempt all 4 RCs. Target 3 RCs perfectly over 4 RCs hastily. Selection skill > reading speed."
      ],
      daily: "3 RC passages (timed: 8 min/passage) + 10 VA questions + 1 editorial reading (15 min, untimed)",
      mistakes: [
        "Reading every word instead of structure-reading",
        "Attempting all 4 RCs under time pressure",
        "Not maintaining a 'wrong RC answer' log",
        "Doing VA questions without checking ALL options"
      ],
      measurement: "Track: RC accuracy % per passage type (factual vs. abstract) | VA accuracy % per question type | Avg time per RC"
    },
    {
      name: "LRDI", icon: "🔢", color: "#C8972A",
      approach: [
        "LRDI is the most score-differentiating section. 99%ilers don't solve more sets—they select the right 4 sets in 60 minutes.",
        "Set selection skill: Spend first 8 minutes reading all 8 set intros. Rank by solvability. Attempt only 4-5 sets.",
        "Practice 'set cracking' speed: If you can't crack the entry point in 3 minutes, move on immediately."
      ],
      daily: "2 LRDI sets/day (timed: 12 min each) + 1 set analysis (why you went wrong or slow)",
      mistakes: [
        "Spending 20+ minutes on an unsolvable set",
        "Not practicing set selection—jumping to the first set you see",
        "Ignoring data-heavy sets (Caselets)—they're actually predictable",
        "Not drawing diagrams/tables immediately on scratch paper"
      ],
      measurement: "Track: Sets attempted vs. sets correctly solved per mock | Time per set | Which set types you consistently avoid"
    },
    {
      name: "Quant", icon: "📐", color: "#4A90D9",
      approach: [
        "Quant at 99%ile = 99% accuracy on 60% of questions + smart skips on remaining 40%. Not speed—precision.",
        "Topic priority: Arithmetic (25% of paper) → Algebra → Geometry → Number Theory → P&C/Probability.",
        "For each topic: Learn concept → Do 20 textbook Qs → Do 20 CAT-level Qs → Identify traps → Redo wrong ones next day."
      ],
      daily: "20 Quant Qs (mixed difficulty: 10 medium + 8 hard + 2 very hard) | Time: 45 minutes",
      mistakes: [
        "Spending time on topics you already know well",
        "Not maintaining a 'formula sheet'—revise it daily for 5 min",
        "Attempting all 22 Quant Qs in mock—selectively skip 5-6",
        "Ignoring TITA (non-MCQ) questions—they have no negative marks"
      ],
      measurement: "Track: Topic-wise accuracy (target 85%+ per topic before moving to next) | Time per question | TITA vs MCQ accuracy separately"
    }
  ],
  schedule: [
    { time: "8:00–8:30 AM",    activity: "Wake up + breakfast. Read 1 editorial (The Hindu/Economist) while eating — untimed.", tag: "VARC" },
    { time: "8:30–9:30 AM",    activity: "VARC: 3 RC passages timed (8 min each) + 10 VA questions (12 min)", tag: "VARC" },
    { time: "9:30–10:00 AM",   activity: "VARC review: Write 1 line explaining every wrong answer. Not just 'B is correct'—why.", tag: "VARC" },
    { time: "10:00–11:00 AM",  activity: "Quant: 20 questions timed (40 min) + 20 min review of every wrong answer", tag: "Quant" },
    { time: "11:00–11:30 AM",  activity: "Break + snack", tag: "break" },
    { time: "11:30 AM–12:30 PM", activity: "LRDI: 2 sets timed (12 min each) + 30 min set analysis", tag: "LRDI" },
    { time: "12:30–1:30 PM",   activity: "Lunch + rest. Full mental break — no content.", tag: "break" },
    { time: "1:30–2:30 PM",    activity: "Concept study: Current week's weakest topic — theory + 15 practice questions", tag: "concept" },
    { time: "2:30–2:45 PM",    activity: "Break", tag: "break" },
    { time: "2:45–3:45 PM",    activity: "Error log review: Redo yesterday's flagged wrong questions cold (no solutions)", tag: "revision" },
    { time: "3:45–4:45 PM",    activity: "Drill session: 25 questions from this week's topic focus, timed", tag: "drill" },
    { time: "4:45–5:15 PM",    activity: "Formula sheet revision (10 min) + Update error log + daily tracker", tag: "revision" },
    { time: "5:15–6:15 PM",    activity: "VARC: 1 additional RC or VA drill + speed reading practice (250 wpm target)", tag: "VARC" },
    { time: "6:15–7:00 PM",    activity: "Wind down. Light: watch 1 concept video on tomorrow's topic. Prep for gym.", tag: "concept" },
    { time: "7:00–10:00 PM",   activity: "GYM — non-negotiable.", tag: "break" },
    { time: "10:00–10:30 PM",  activity: "Post-gym wind down + shower + dinner", tag: "break" },
    { time: "10:30 PM",        activity: "Stop. Sleep by 11:30 PM. Non-negotiable.", tag: "break" }
  ],
  mockStrategy: [
    { step: "01", title: "When to Start", detail: "Week 5 (Month 2): Begin 1 sectional mock/week. Week 9 (Month 3): Shift to 2 full mocks/week. Month 4: 3 full mocks/week." },
    { step: "02", title: "Mock Day Protocol", detail: "Take mock at 8:30 AM (morning, peak brain hours). Strict 2-hr timer. No phone. Same pen/scratch paper setup. After mock—rest 30 min before analysis. Gym as usual at 7 PM." },
    { step: "03", title: "3-Hour Post-Mock Analysis", detail: "Hour 1: Section-by-section score breakdown. Calculate: attempted, correct, incorrect, accuracy %. Hour 2: Re-solve every wrong question without time limit. Categorize: Concept Gap / Calculation Error / Careless / Time Pressure. Hour 3: Update error log. Identify 1 pattern per section that cost you score." },
    { step: "04", title: "Mock-to-Mock Improvement", detail: "Before next mock: Solve 20 questions from your error categories. Set 1 specific process target (e.g., 'I will not attempt more than 3 RCs'). After 4 mocks, review cumulative error patterns." },
    { step: "05", title: "Score Targets by Month", detail: "Month 2 (sectionals): 70%+ accuracy per section. Month 3 (full mocks): Raw score 120+. Month 4 (peak): Raw score 145+ consistently." }
  ],
  milestones: [
    { month: "End of Month 1", varc: "65% accuracy on RC | 60% on VA", lrdi: "Solve 2 sets correctly in 25 min", quant: "80%+ accuracy on Arithmetic, Number Theory", overall: "Baseline mock: 90–100 raw score" },
    { month: "End of Month 2", varc: "70% RC accuracy | 65% VA accuracy", lrdi: "Solve 3 sets correctly in 36 min", quant: "80%+ across 70% of topics", overall: "Sectional mocks: 75th percentile per section" },
    { month: "End of Month 3", varc: "75%+ RC | 70%+ VA | Time per RC under 8 min", lrdi: "4 sets in 48 min (all correct)", quant: "85%+ accuracy | Full topic coverage", overall: "Full mocks: 130–140 raw score (95–97 percentile range)" },
    { month: "End of Month 4", varc: "80%+ RC | 75%+ VA", lrdi: "4–5 sets in 55 min consistently", quant: "90%+ on attempted questions", overall: "Full mocks: 145–155 raw score (99+ percentile)" }
  ],
  weeklyPlan: [
    {
      week: 1, month: "Month 1", phase: "Foundation & Diagnosis", color: "#E8532A",
      quant: { topics: ["Percentages (all types)", "Ratio & Proportion", "Averages & Mixtures"], questions: "20 Qs/day Arun Sharma Level 1–2", goal: "80%+ accuracy before moving to Week 2" },
      varc: { topics: ["RC passage structure: main idea, tone, author's purpose", "Speed reading baseline — measure wpm on Day 1"], questions: "3 RCs/day (untimed) + 10 Para Jumble questions", goal: "Understand why each wrong answer is wrong — no score target yet" },
      lrdi: { topics: ["Linear Arrangements (1-variable)", "Circular Arrangements"], questions: "2 sets/day untimed — focus on diagram-first habit only", goal: "Solve both sets fully correct before next day" },
      mock: "None.", weekGoal: "Establish daily routine. Complete Percentages + Ratio + Averages. Note baseline RC wpm and accuracy %."
    },
    {
      week: 2, month: "Month 1", phase: "Foundation & Diagnosis", color: "#E8532A",
      quant: { topics: ["Time, Speed & Distance (all cases)", "Time & Work + Pipes & Cisterns", "Simple & Compound Interest"], questions: "20 Qs/day Level 1–2", goal: "80%+ on TSD before Week 3" },
      varc: { topics: ["RC: Inference vs Fact questions — how to distinguish", "VA: Odd-One-Out question type + strategy"], questions: "3 RCs/day (untimed) + 10 Odd-One-Out questions", goal: "60%+ accuracy on Odd-One-Out" },
      lrdi: { topics: ["Blood Relations (direct + coded)", "Scheduling / Timetable-based sets"], questions: "2 sets/day untimed", goal: "No set should take more than 20 min at this stage" },
      mock: "None.", weekGoal: "Complete Arithmetic block (Percentages → TSD). Error log should have 30+ entries by end of week."
    },
    {
      week: 3, month: "Month 1", phase: "Foundation & Diagnosis", color: "#E8532A",
      quant: { topics: ["Number Theory: Factors, HCF/LCM, Remainders, Divisibility rules", "Number Theory: Unit digits, Last two digits, Cyclicity"], questions: "20 Qs/day — mix Level 1 and Level 2", goal: "Cover all Number Theory sub-types" },
      varc: { topics: ["Para Jumbles: mandatory first sentence rule + connector pair method", "Para Summary: central argument vs supporting detail"], questions: "3 RCs/day + 10 PJ + 5 Para Summary", goal: "65%+ on Para Jumbles" },
      lrdi: { topics: ["Grid-based Puzzles (deduction logic)", "Matrix Arrangements (2 variables)"], questions: "2 sets/day untimed", goal: "Find the 'fixed cell' entry point in every puzzle before deducing" },
      mock: "None.", weekGoal: "Complete Number Theory. Begin timing RCs — how long does 1 passage + questions take you?"
    },
    {
      week: 4, month: "Month 1", phase: "Foundation & Diagnosis", color: "#E8532A",
      quant: { topics: ["Basic Algebra: Linear + Simultaneous equations", "Quadratic equations, factoring, roots"], questions: "20 Qs/day Level 2", goal: "80%+ accuracy on all equation types" },
      varc: { topics: ["Timed RC begins: 10 minutes per passage this week", "Rotate all 3 VA types daily (PJ, OOO, Summary)"], questions: "3 RCs timed (10 min each) + 10 mixed VA", goal: "Complete 3 RCs within 30 minutes total" },
      lrdi: { topics: ["Venn Diagrams (2 and 3 circle)", "Simple DI: Tables and Bar Charts"], questions: "2 sets/day — begin noting time per set", goal: "Identify which set types you are consistently slow on" },
      mock: "1 VARC sectional on Sunday (any platform). Do not target score — only diagnose.",
      weekGoal: "Month 1 wrap-up: Arithmetic + Number Theory + Basic Algebra done. First sectional taken. Error log active."
    },
    {
      week: 5, month: "Month 2", phase: "Concept Completion + Drill", color: "#C8972A",
      quant: { topics: ["Geometry: Lines, Angles, Triangles (all theorems + CAT traps)", "Geometry: Circles, Chords, Tangents"], questions: "20 Qs/day Level 2 — draw every figure, no mental shortcuts", goal: "Know all triangle + circle theorems without reference" },
      varc: { topics: ["RC timed at 8 min/passage starts now", "Identify your strongest passage type: factual vs abstract"], questions: "3 RCs timed (8 min each) + 15 VA mixed", goal: "70% accuracy on factual RCs" },
      lrdi: { topics: ["Games & Tournaments (knockout, round-robin, league formats)", "Complex Seating (floor + direction + gender constraints)"], questions: "2 sets timed at 12 min each", goal: "Solve at least 1 of 2 sets fully correct daily" },
      mock: "1 Quant sectional on Sunday. Analyze for 1.5 hours: which topics lost you marks?",
      weekGoal: "Geometry concepts locked. Timed RC habit established at 8 min/passage. 2 sectionals done total."
    },
    {
      week: 6, month: "Month 2", phase: "Concept Completion + Drill", color: "#C8972A",
      quant: { topics: ["Mensuration 2D: areas, perimeters (all shapes)", "Mensuration 3D: volume + surface area of cube, cylinder, cone, sphere"], questions: "20 Qs/day Level 2–3", goal: "No formula requires lookup by end of week" },
      varc: { topics: ["Abstract / philosophical RC — practice 3 this week specifically", "RC: Elimination technique for trap answer choices"], questions: "3 RCs timed + 15 VA", goal: "65%+ accuracy on abstract RCs" },
      lrdi: { topics: ["Caselets (text-based DI — most ignored, very solvable)", "Mixed DI: Line graphs + Pie charts"], questions: "2–3 sets timed at 12 min", goal: "Caselets must be your highest-accuracy set type by end of month" },
      mock: "1 LRDI sectional on Sunday. Key question: Did you select the right sets? Track time per set.",
      weekGoal: "Mensuration done. 3 sectionals taken total. Track mock accuracy % in a dedicated sheet from now."
    },
    {
      week: 7, month: "Month 2", phase: "Concept Completion + Drill", color: "#C8972A",
      quant: { topics: ["Permutation & Combination: counting principle, arrangements, selections", "Probability: classical, conditional, basic Bayes"], questions: "20 Qs/day — P&C is logic-based, build cases not formulas", goal: "Solve P&C by case-building, not formula recall" },
      varc: { topics: ["Full VARC simulation: 3 RCs + all VA types in 40 minutes", "Identify your 2 strongest VA types — prioritize these in mocks"], questions: "Full 40-min VARC sim + 10 additional VA from weakest type", goal: "Complete 40-min simulation within time" },
      lrdi: { topics: ["Networks / Connections-based sets", "Revision: Redo 3 hardest sets from Weeks 5–6"], questions: "2 timed sets + 1 revision set", goal: "Revision sets must be solved faster than first attempt" },
      mock: "Sectional mocks: VARC Mon, LRDI Wed, Quant Fri. First full section simulations.",
      weekGoal: "P&C + Probability done. First full 40-min VARC simulation complete. Syllabus 85% covered."
    },
    {
      week: 8, month: "Month 2", phase: "Concept Completion + Drill", color: "#C8972A",
      quant: { topics: ["Modern Math: Set Theory, Functions, Logarithms", "AP, GP, HP + Inequalities + Modulus equations"], questions: "20 Qs/day — complete remaining syllabus by Day 5", goal: "Full Quant syllabus complete by Friday" },
      varc: { topics: ["Error log audit: Which RC question type has your lowest accuracy?", "Targeted drill on weakest question type only — 30 Qs this week"], questions: "3 RCs + 15 VA (all from weakest type)", goal: "Weakest VA type improves by 10% vs Week 5 baseline" },
      lrdi: { topics: ["Full set selection drill: Read 6 intros, rank, solve top 3", "Speed revisit: Blood Relations + Scheduling with time targets"], questions: "3 sets with selection practice daily", goal: "Set selection decision under 2 minutes per set intro" },
      mock: "FIRST FULL MOCK on Sunday. Treat it as a real exam. 3-hour analysis immediately after.",
      weekGoal: "FULL SYLLABUS COMPLETE. First full mock taken. Baseline full-mock score established."
    },
    {
      week: 9, month: "Month 3", phase: "Mock Test Integration", color: "#4A90D9",
      quant: { topics: ["Speed drill: 25 Qs in 40 minutes — all topics mixed", "Revision: Redo all Arithmetic error log entries from Month 1"], questions: "25 Qs/day timed — no topic isolation", goal: "Under 2 min average per question across the drill" },
      varc: { topics: ["RC passage selection: 4 passages, choose 3, justify the skip", "Tighten timing: target 7.5 min per passage"], questions: "4 RCs (attempt 3) + 15 VA timed", goal: "3 RCs completed in 22–23 min total" },
      lrdi: { topics: ["Full 8-set selection simulation: rank all 8, solve top 4", "Revision: Games & Tournaments (most frequent CAT type)"], questions: "Full selection sim daily — 4 sets in 55 min", goal: "3 of 4 attempted sets fully correct daily" },
      mock: "Full mock Wednesday + Full mock Sunday. 3-hour analysis each. Log error types.",
      weekGoal: "2 mocks this week (3 total). Lock your section attempt order. Identify your #1 score-killer pattern."
    },
    {
      week: 10, month: "Month 3", phase: "Mock Test Integration", color: "#4A90D9",
      quant: { topics: ["Fix top 2 Quant error types from mocks so far", "Geometry revision — most formula decay happens here"], questions: "25 Qs/day — 40% from your error categories", goal: "Error category accuracy improves vs Week 9" },
      varc: { topics: ["Abstract RC targeted drilling (3 abstract passages daily)", "Para Jumbles: target under 90 seconds per question"], questions: "3 RCs + 15 VA", goal: "Abstract RC accuracy ≥ 65%" },
      lrdi: { topics: ["Complex constraint sets (4+ variables, multi-condition)", "Mixed DI: table + bar + line combined in one set"], questions: "3 sets timed daily", goal: "No set exceeds 14 minutes" },
      mock: "Full mock Wednesday + Full mock Sunday. After 4th full mock: cumulative error pattern review session.",
      weekGoal: "4 full mocks done total. Cumulative review complete. Top 3 recurring error patterns identified."
    },
    {
      week: 11, month: "Month 3", phase: "Mock Test Integration", color: "#4A90D9",
      quant: { topics: ["P&C + Probability revision from PYQs only", "Number Theory: CAT-level trap questions (2019–2022 PYQs)"], questions: "25 Qs/day — include 5 PYQ questions daily", goal: "PYQ Quant accuracy ≥ 75%" },
      varc: { topics: ["PYQ VARC: 2019 + 2020 full sections timed", "Note which year felt hardest — that's your benchmark"], questions: "Full VARC section from 1 PYQ paper per day", goal: "PYQ VARC accuracy ≥ 65%" },
      lrdi: { topics: ["PYQ LRDI: 2019 + 2020 + 2021 full sections timed", "Review: Were your set selections correct in hindsight?"], questions: "Full LRDI section from 1 PYQ per day", goal: "3–4 sets solved correctly from each PYQ paper" },
      mock: "Full mock Wednesday + Full mock Sunday. Check: are your process targets from Week 9 showing in scores?",
      weekGoal: "PYQs started. 6 full mocks done total. Process improvements from earlier mocks must be visible in scores now."
    },
    {
      week: 12, month: "Month 3", phase: "Mock Test Integration", color: "#4A90D9",
      quant: { topics: ["Full Quant accuracy audit: every topic checked vs 80% target", "Any topic below 75%: 2 focused days of drilling it"], questions: "25 Qs/day + 1 full timed Quant section simulation", goal: "Every topic at 80%+ accuracy" },
      varc: { topics: ["Accuracy audit: RC by passage type, VA by question type", "Fix lowest-accuracy VA type with 30 targeted questions"], questions: "3 RCs + 20 VA from weakest type", goal: "No VA type below 60% accuracy" },
      lrdi: { topics: ["Set type audit: which 2 types have lowest solve rate?", "Targeted drilling: 6 sets from your 2 weakest types this week"], questions: "3 sets/day — 2 from weak types, 1 from strong type", goal: "Weak set type accuracy improves by 15% vs Week 9" },
      mock: "Full mock Wednesday + Full mock Sunday. Target: raw score 130+.",
      weekGoal: "8 full mocks done total. Month 3 milestone hit. Score should be 130–140 range."
    },
    {
      week: 13, month: "Month 4", phase: "Peak Performance", color: "#2AAF6F",
      quant: { topics: ["NO NEW TOPICS. Revision only.", "Redo entire Quant error log — all Type A (concept gap) entries"], questions: "25 Qs/day — 100% from error log and PYQs only", goal: "Error log Quant re-attempts: 85%+ accuracy" },
      varc: { topics: ["PYQ VARC: 2021 + 2022 full sections timed", "RC selection drill: 4 passages, decide which 3 to attempt in 90 seconds"], questions: "Full VARC sim daily (PYQ or mock)", goal: "Selection decision locked in under 90 seconds" },
      lrdi: { topics: ["PYQ LRDI: 2022 + 2023 full sections", "Set rejection speed: No entry point in 3 min → abandon immediately"], questions: "Full LRDI sim daily", goal: "4 sets correctly solved in under 55 minutes" },
      mock: "Full mock Monday + Wednesday + Saturday. 3-hour analysis each.",
      weekGoal: "3 mocks/week rhythm locked. Error log revision in full swing. Raw score: 135–145."
    },
    {
      week: 14, month: "Month 4", phase: "Peak Performance", color: "#2AAF6F",
      quant: { topics: ["Full Quant section simulation daily: 22 Qs in 40 min", "Skip strategy: identify 5 Qs to skip in first 3 minutes of section"], questions: "Full Quant sim + 15 targeted error Qs", goal: "90%+ accuracy on attempted Quant questions" },
      varc: { topics: ["Full VARC section simulation daily (40 min strict)", "Finalize attempt order: VARC first or last? Test both this week, then lock."], questions: "Full VARC section sim daily", goal: "Consistent 75%+ accuracy across 3 RCs per simulation" },
      lrdi: { topics: ["Full LRDI section simulation daily (60 min strict)", "Lock set-selection strategy — do not change after this week"], questions: "Full LRDI section sim daily", goal: "Consistent 3–4 sets solved correctly per simulation" },
      mock: "Full mock Monday + Wednesday + Saturday.",
      weekGoal: "Section attempt order FROZEN. Strategy locked. Do not experiment after this week. Raw score: 140–150."
    },
    {
      week: 15, month: "Month 4", phase: "Peak Performance", color: "#2AAF6F",
      quant: { topics: ["Final error log sweep: Any Quant error not yet re-attempted — do it now", "Formula sheet final polish — should be 1 page, fully memorized"], questions: "20 Qs/day — only from error log", goal: "Zero open Type A errors remaining in Quant log" },
      varc: { topics: ["PYQ VARC: 2023 + 2024 full sections timed", "Final VA type confidence check on your weakest type"], questions: "Full VARC sim + 10 VA from weakest type", goal: "PYQ 2023–24 VARC accuracy ≥ 75%" },
      lrdi: { topics: ["PYQ LRDI: 2023 + 2024 full sections", "Final set-type confidence — practice your 2 strongest types"], questions: "Full LRDI sim from PYQs", goal: "PYQ 2023–24 LRDI: 4 sets correct consistently" },
      mock: "Full mock Monday + Wednesday + Saturday. Saturday mock = exam-day dress rehearsal (exact same time, setup, conditions).",
      weekGoal: "All PYQs 2019–2024 complete. Raw score: 145–155. Saturday = dress rehearsal."
    },
    {
      week: 16, month: "Month 4", phase: "Final Week — Taper", color: "#2AAF6F",
      quant: { topics: ["Monday–Tuesday: Formula sheet revision only (15 min/day)", "Wednesday onwards: Zero Quant practice"], questions: "Mon–Tue: 10 easy confidence Qs only", goal: "Stay sharp, do not fatigue the brain" },
      varc: { topics: ["Monday: 2 RCs light reading (no timed pressure)", "Tuesday: 5 VA questions only. Wed onwards: editorial reading only."], questions: "Minimal — no drilling", goal: "Keep reading brain active, not stressed" },
      lrdi: { topics: ["Monday only: 1 familiar set from your strongest type", "Tuesday onwards: Zero LRDI practice"], questions: "1 set Monday only", goal: "Confidence, not skill-building" },
      mock: "ZERO mocks this week. Last mock was Saturday of Week 15.",
      weekGoal: "Rest. 8 hrs sleep nightly. Eat normally. Review strategy notes only — no new solving. You are ready."
    }
  ],
  resources: [
    { category: "Quant", items: ["Arun Sharma – Quantitative Aptitude (primary textbook)", "2IIM CAT free YouTube channel (best free Quant videos)", "BYJU's CAT or TIME material for extra drills"] },
    { category: "VARC", items: ["The Hindu editorial (daily, non-negotiable)", "Aristotle RC (book) for RC strategy", "2IIM VARC free YouTube for VA question approach"] },
    { category: "LRDI", items: ["Arun Sharma – Logical Reasoning (book)", "CATKing LRDI YouTube for set-cracking strategies", "PYQ LRDI sets from 2017–2024 (most important resource)"] },
    { category: "Mock Platforms", items: ["TIME or IMS (paid, ₹3000–5000): Best mock quality and analysis", "2IIM free mocks: Excellent for LRDI-heavy practice", "Previous year CAT papers (2017–2024): Non-negotiable, do all of them"] },
    { category: "Avoid", items: ["RS Aggarwal for CAT Quant (too basic, wrong difficulty)", "More than 2 coaching platforms simultaneously", "Random YouTube channels without CAT-specific focus"] }
  ]
};

const tagColors = {
  VARC:     { bg: "#2A1208", text: "#E8532A", border: "#E8532A55" },
  LRDI:     { bg: "#221800", text: "#C8972A", border: "#C8972A55" },
  Quant:    { bg: "#0D1A2A", text: "#4A90D9", border: "#4A90D955" },
  break:    { bg: "#0A1A12", text: "#2AAF6F", border: "#2AAF6F55" },
  revision: { bg: "#1A1028", text: "#7B5EA7", border: "#7B5EA755" },
  concept:  { bg: "#1A1A1A", text: "#888",    border: "#44444455" },
  drill:    { bg: "#2A0A18", text: "#D6367A", border: "#D6367A55" }
};

// ─── DAILY TASKS GENERATOR ───────────────────────────────────────────────────
// Each task is { time, activity, tag } matching the daily routine schedule

function getDailyTasks(w) {
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const isTaper = w.week === 16;
  const tasks = {};
  days.forEach((day, i) => {
    const hasMockWed = w.mock.includes("Wednesday");
    const hasMockMon = w.mock.includes("Monday");
    const hasMockSat = w.mock.includes("Saturday");
    const hasMockSun = w.mock.includes("Sunday") || w.mock.startsWith("FIRST");
    const isMockDay = (day==="Wednesday"&&hasMockWed)||(day==="Monday"&&hasMockMon)||(day==="Saturday"&&hasMockSat)||(day==="Sunday"&&hasMockSun);
    const isSectionalDay = !isTaper && (
      (day==="Monday"&&w.mock.includes("VARC Mon"))||
      (day==="Wednesday"&&w.mock.includes("LRDI Wed"))||
      (day==="Friday"&&w.mock.includes("Quant Fri"))||
      (day==="Sunday"&&(w.mock.includes("sectional")||w.mock.includes("Sectional")))
    );

    let t = [];

    const gymBlock = [
      { time:"7:00–10:00 PM",  activity:"GYM — non-negotiable.", tag:"break" },
      { time:"10:00–10:30 PM", activity:"Post-gym wind down + shower + dinner", tag:"break" },
      { time:"10:30 PM",       activity:"Stop. Sleep by 11:30 PM. Non-negotiable.", tag:"break" },
    ];

    if (isTaper) {
      if (i===0) {
        t = [
          { time:"8:00–8:30 AM",  activity:"Wake up + breakfast. Read editorial (The Hindu) — light, no pressure", tag:"VARC" },
          { time:"8:30–9:00 AM",  activity:"Formula sheet revision — 15 min only", tag:"revision" },
          { time:"9:00–9:30 AM",  activity:"10 easy Quant Qs — confidence only, no hard problems", tag:"Quant" },
          { time:"9:30–10:30 AM", activity:"2 RCs light reading — no timer, no score pressure", tag:"VARC" },
          { time:"10:30 AM–7:00 PM", activity:"Rest. No more CAT content until gym.", tag:"break" },
          ...gymBlock,
        ];
      } else if (i===1) {
        t = [
          { time:"8:00–8:30 AM", activity:"Wake up + breakfast. Read editorial — light reading only", tag:"VARC" },
          { time:"8:30–9:00 AM", activity:"Formula sheet revision — 15 min only", tag:"revision" },
          { time:"9:00–9:30 AM", activity:"5 VA questions only — no drilling", tag:"VARC" },
          { time:"9:30–10:00 AM", activity:"1 LRDI set from your strongest type — confidence", tag:"LRDI" },
          { time:"10:00 AM–7:00 PM", activity:"Rest. Sleep 8 hours tonight after gym.", tag:"break" },
          ...gymBlock,
        ];
      } else {
        t = [
          { time:"8:00–8:30 AM", activity:"Wake up + breakfast. Read editorial only — no solving whatsoever", tag:"VARC" },
          { time:"8:30–9:00 AM", activity:"Review strategy notes: section attempt order, set selection plan", tag:"revision" },
          { time:"9:00 AM–7:00 PM", activity:"Rest. No CAT content.", tag:"break" },
          ...gymBlock,
        ];
      }
    } else if (isMockDay) {
      t = [
        { time:"8:00–8:30 AM",   activity:"Wake up + breakfast + editorial read", tag:"break" },
        { time:"8:30–10:30 AM",  activity:"Full mock — strict 2-hour timer, phone off, rough paper ready", tag:"mock" },
        { time:"10:30–11:00 AM", activity:"Rest after mock — do not start analysis yet", tag:"break" },
        { time:"11:00 AM–12:00 PM", activity:"Mock analysis Hour 1: score breakdown — attempted / correct / incorrect / accuracy % per section", tag:"revision" },
        { time:"12:00–1:00 PM",  activity:"Mock analysis Hour 2: re-solve every wrong Q without timer, classify error type A/B/C/D", tag:"revision" },
        { time:"1:00–2:00 PM",   activity:"Mock analysis Hour 3: update error log, identify 1 dominant pattern per section", tag:"revision" },
        { time:"2:00–2:30 PM",   activity:"Write down 1 specific process target for next mock", tag:"revision" },
        { time:"2:30–7:00 PM",   activity:"Completely off — no more CAT content", tag:"break" },
        ...gymBlock,
      ];
    } else if (isSectionalDay) {
      t = [
        { time:"8:00–8:30 AM",    activity:"Wake up + breakfast + editorial read", tag:"break" },
        { time:"8:30–9:10 AM",    activity:"Sectional mock — 40 min strict timer, no pausing", tag:"mock" },
        { time:"9:10–10:40 AM",   activity:"1.5-hour sectional analysis: mark every wrong answer with error type", tag:"revision" },
        { time:"10:40–11:00 AM",  activity:"Update error log from today's sectional", tag:"revision" },
        { time:"11:00 AM–12:00 PM", activity:"Break + lunch", tag:"break" },
        { time:"12:00–1:00 PM",   activity:"VARC: " + w.varc.questions, tag:"VARC" },
        { time:"1:00–2:00 PM",    activity:"Quant: " + w.quant.questions, tag:"Quant" },
        { time:"2:00–2:30 PM",    activity:"Formula sheet revision — 5 min + update daily tracker", tag:"revision" },
        { time:"2:30–7:00 PM",    activity:"Free time / buffer", tag:"break" },
        ...gymBlock,
      ];
    } else {
      t = [
        { time:"8:00–8:30 AM",    activity:"Wake up + breakfast. Read 1 editorial while eating — untimed", tag:"VARC" },
        { time:"8:30–9:30 AM",    activity:"VARC: " + w.varc.questions, tag:"VARC" },
        { time:"9:30–10:00 AM",   activity:"VARC review: 1-line explanation for every wrong answer — why wrong, not just what is correct", tag:"VARC" },
        { time:"10:00–11:00 AM",  activity:"Quant: " + w.quant.questions, tag:"Quant" },
        { time:"11:00–11:30 AM",  activity:"Break + snack", tag:"break" },
        { time:"11:30 AM–12:30 PM", activity:"LRDI: " + w.lrdi.questions, tag:"LRDI" },
        { time:"12:30–1:30 PM",   activity:"Lunch + rest — full mental break, no content", tag:"break" },
        { time:"1:30–2:30 PM",    activity:"Quant concept: " + w.quant.topics[i % w.quant.topics.length], tag:"concept" },
        { time:"2:30–2:45 PM",    activity:"Break", tag:"break" },
        { time:"2:45–3:45 PM",    activity:"Error log: redo yesterday's flagged wrong questions cold (no solutions)", tag:"revision" },
        { time:"3:45–4:45 PM",    activity:"Drill session: 25 questions from this week's topic focus, timed", tag:"drill" },
        { time:"4:45–5:15 PM",    activity:"Formula sheet revision — 5 min + update error log + daily tracker", tag:"revision" },
        { time:"5:15–6:15 PM",    activity:"VARC: 1 additional RC or VA drill + speed reading practice (250 wpm target)", tag:"VARC" },
        { time:"6:15–7:00 PM",    activity:"Wind down. Watch 1 concept video on tomorrow's topic. Prep for gym.", tag:"concept" },
        ...gymBlock,
      ];
    }
    tasks[day] = t;
  });
  return tasks;
}


// ─── FLOATING POMODORO TIMER ────────────────────────────────────────────────

function FloatingPomodoro() {
  const DEFAULT = { work: 25, shortBreak: 5, longBreak: 15, rounds: 4 };
  const [settings, setSettings] = useState(DEFAULT);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(DEFAULT);
  const [mode, setMode] = useState("work");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT.work * 60);
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(1);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef(null);
  const audioCtx = useRef(null);
  const autoAdvanceRef = useRef(null);
  const settingsRef = useRef(DEFAULT);
  const roundRef = useRef(1);
  const modeRef = useRef("work");

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const modeLabels = { work: "FOCUS", shortBreak: "SHORT BREAK", longBreak: "LONG BREAK" };
  const modeColors = { work: "#E8532A", shortBreak: "#2AAF6F", longBreak: "#4A90D9" };
  const modeDurations = { work: settings.work, shortBreak: settings.shortBreak, longBreak: settings.longBreak };

  const playBeep = () => {
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtx.current;
      [0, 0.15, 0.3].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.13);
      });
    } catch(e) {}
  };

  useEffect(() => {
    if (!running && autoAdvanceRef.current) {
      const { nextMode, nextSeconds, nextRound, addSession } = autoAdvanceRef.current;
      autoAdvanceRef.current = null;
      if (addSession) setSessionsToday(n => n + 1);
      if (nextRound !== undefined) setRound(nextRound);
      setMode(nextMode);
      setSecondsLeft(nextSeconds);
      setTimeout(() => setRunning(true), 200);
    }
  }, [running]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            playBeep();
            const st = settingsRef.current;
            const r = roundRef.current;
            const m = modeRef.current;
            if (m === "work") {
              if (r >= st.rounds) {
                autoAdvanceRef.current = { nextMode: "longBreak", nextSeconds: st.longBreak * 60, nextRound: 1, addSession: true };
              } else {
                autoAdvanceRef.current = { nextMode: "shortBreak", nextSeconds: st.shortBreak * 60, nextRound: r + 1, addSession: true };
              }
            } else {
              autoAdvanceRef.current = { nextMode: "work", nextSeconds: st.work * 60, addSession: false };
            }
            setRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const switchMode = (m) => { setRunning(false); setMode(m); setSecondsLeft(modeDurations[m] * 60); };
  const reset = () => { setRunning(false); setSecondsLeft(modeDurations[mode] * 60); };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const total = modeDurations[mode] * 60;
  const progress = ((total - secondsLeft) / total) * 100;
  const color = modeColors[mode];
    
  return (
    <div style={{ position:"fixed", bottom:"24px", right:"24px", zIndex:1000, fontFamily:"'Georgia', serif" }}>

      {/* Expanded panel */}
      {open && (
        <div style={{ background:"#141414", border:`1px solid #2A2A2A`, borderTop:`3px solid ${color}`, padding:"20px", marginBottom:"10px", width:"320px", boxShadow:"0 8px 32px rgba(0,0,0,0.6)" }}>

          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
            <div style={{ color:color, fontFamily:"monospace", fontSize:"10px", letterSpacing:"3px", fontWeight:"bold" }}>POMODORO</div>
            <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
              <span style={{ color:"#444", fontFamily:"monospace", fontSize:"9px" }}>{sessionsToday} sessions · R{round}/{settings.rounds}</span>
              <button onClick={() => { setDraft(settings); setEditing(!editing); }} style={{ background:"#0D0D0D", border:"1px solid #2A2A2A", color:"#555", padding:"3px 10px", fontFamily:"monospace", fontSize:"9px", cursor:"pointer" }}>⚙</button>
            </div>
          </div>

          {/* Settings Panel */}
          {editing && (
            <div style={{ background:"#0D0D0D", border:"1px solid #1A1A1A", padding:"14px", marginBottom:"16px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"8px", marginBottom:"12px" }}>
                {[{ key:"work", label:"Focus" },{ key:"shortBreak", label:"S.Break" },{ key:"longBreak", label:"L.Break" },{ key:"rounds", label:"Rounds" }].map(({ key, label }) => (
                  <div key={key}>
                    <div style={{ color:"#555", fontSize:"8px", fontFamily:"monospace", letterSpacing:"1px", marginBottom:"4px" }}>{label.toUpperCase()}</div>
                    <input type="number" min="1" max="120" value={draft[key]}
                      onChange={e => setDraft(prev => ({ ...prev, [key]: Math.max(1, parseInt(e.target.value)||1) }))}
                      style={{ width:"100%", background:"#141414", border:"1px solid #2A2A2A", color:"#F0EDE8", padding:"5px 4px", fontFamily:"monospace", fontSize:"12px", textAlign:"center" }} />
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:"6px" }}>
                <button onClick={() => { setSettings(draft); setEditing(false); setRunning(false); setSecondsLeft(draft[mode] * 60); setRound(1); }} style={{ background:color, color:"#000", border:"none", padding:"5px 14px", fontFamily:"monospace", fontSize:"9px", cursor:"pointer", fontWeight:"bold" }}>APPLY</button>
                <button onClick={() => setDraft(DEFAULT)} style={{ background:"transparent", color:"#555", border:"1px solid #2A2A2A", padding:"5px 10px", fontFamily:"monospace", fontSize:"9px", cursor:"pointer" }}>RESET</button>
                <button onClick={() => setEditing(false)} style={{ background:"transparent", color:"#444", border:"none", padding:"5px 8px", fontFamily:"monospace", fontSize:"9px", cursor:"pointer" }}>✕</button>
              </div>
            </div>
          )}

          <div style={{ display:"flex", gap:"20px", alignItems:"center" }}>
            {/* Circle */}
            <div style={{ position:"relative", width:"100px", height:"100px", flexShrink:0 }}>
              <svg width="100" height="100" style={{ transform:"rotate(-90deg)" }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1A1A1A" strokeWidth="5" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="5"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 - (progress / 100) * 2 * Math.PI * 42}
                  strokeLinecap="round" style={{ transition:"stroke-dashoffset 0.5s linear" }} />
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <div style={{ fontFamily:"monospace", fontSize:"22px", color:"#F0EDE8", letterSpacing:"1px", lineHeight:1 }}>{mins}:{secs}</div>
                <div style={{ fontFamily:"monospace", fontSize:"8px", color:color, letterSpacing:"1px", marginTop:"3px" }}>{modeLabels[mode]}</div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ flex:1 }}>
              {/* Mode buttons */}
              <div style={{ display:"flex", gap:"4px", marginBottom:"12px", flexWrap:"wrap" }}>
                {Object.keys(modeLabels).map(m => (
                  <button key={m} onClick={() => switchMode(m)} style={{ background: mode===m ? color : "#0D0D0D", color: mode===m ? "#000" : "#444", border:`1px solid ${mode===m ? color : "#222"}`, padding:"3px 8px", fontFamily:"monospace", fontSize:"8px", cursor:"pointer", fontWeight: mode===m ? "bold" : "normal" }}>
                    {modeLabels[m]}
                  </button>
                ))}
              </div>

              {/* Start/Pause + Reset */}
              <div style={{ display:"flex", gap:"6px", marginBottom:"12px" }}>
                <button onClick={() => setRunning(r => !r)} style={{ background:color, color:"#000", border:"none", padding:"8px 0", fontFamily:"monospace", fontSize:"11px", cursor:"pointer", fontWeight:"bold", flex:1 }}>
                  {running ? "⏸ PAUSE" : "▶ START"}
                </button>
                <button onClick={reset} style={{ background:"transparent", color:"#555", border:"1px solid #2A2A2A", padding:"8px 10px", fontFamily:"monospace", fontSize:"11px", cursor:"pointer" }}>↺</button>
                <button onClick={() => { setRunning(false); setRound(1); setSessionsToday(0); switchMode("work"); }} style={{ background:"transparent", color:"#444", border:"1px solid #1A1A1A", padding:"8px 10px", fontFamily:"monospace", fontSize:"11px", cursor:"pointer" }}>✕</button>
              </div>

              {/* Round dots */}
              <div style={{ display:"flex", gap:"5px", alignItems:"center" }}>
                {Array.from({ length: settings.rounds }).map((_, i) => (
                  <div key={i} style={{ width:"7px", height:"7px", borderRadius:"50%", background: i < round - 1 ? color : i === round - 1 && mode === "work" ? color + "66" : "#1A1A1A", border:`1px solid ${i < round ? color : "#2A2A2A"}`, transition:"all 0.3s" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ background: running ? color : "#141414", border:`2px solid ${color}`, color: running ? "#000" : color, padding:"10px 16px", fontFamily:"monospace", fontSize:"11px", cursor:"pointer", letterSpacing:"1px", display:"flex", alignItems:"center", gap:"8px", boxShadow:"0 4px 16px rgba(0,0,0,0.5)", transition:"all 0.2s" }}
        >
          <span style={{ fontSize:"16px" }}>{running ? "⏱" : "🍅"}</span>
          <span style={{ fontWeight:"bold" }}>{running ? `${mins}:${secs}` : "POMODORO"}</span>
          <span style={{ fontSize:"10px", opacity:0.7 }}>{open ? "▼" : "▲"}</span>
        </button>
      </div>
    </div>
  );
}
// ─── HELPER COMPONENTS ───────────────────────────────────────────────────────

function SectionTitle({ children, style }) {
  return (
    <h2 style={{ fontSize:"13px", fontFamily:"monospace", letterSpacing:"3px", color:"#555", textTransform:"uppercase", borderBottom:"1px solid #1A1A1A", paddingBottom:"10px", marginBottom:"24px", marginTop:"32px", ...style }}>
      {children}
    </h2>
  );
}
function Label({ children, style }) {
  return <div style={{ fontSize:"10px", fontFamily:"monospace", letterSpacing:"2px", color:"#555", textTransform:"uppercase", marginBottom:"10px", ...style }}>{children}</div>;
}
function BulletItem({ children, color }) {
  return (
    <div style={{ display:"flex", gap:"10px", marginBottom:"8px" }}>
      <span style={{ color: color||"#E8532A", flexShrink:0, fontSize:"12px" }}>▸</span>
      <span style={{ color:"#CCC", fontSize:"13px", lineHeight:1.5 }}>{children}</span>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function CATPrep() {
  const [activeTab, setActiveTab] = useState("roadmap");
  const [checkedTasks, setCheckedTasks] = useState({});
  const [checkedWeekGoals, setCheckedWeekGoals] = useState({});
  const [taskOrders, setTaskOrders] = useState({});
  const [customTimes, setCustomTimes] = useState({});
  const [editingTime, setEditingTime] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [examDate, setExamDate] = useState("2026-11-29");
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastActiveDate, setLastActiveDate] = useState("");
  const [editingExamDate, setEditingExamDate] = useState(false);
  const [editingStartDate, setEditingStartDate] = useState(false);
  const isMobile = useIsMobile();
  const [syncStatus, setSyncStatus] = useState("idle");
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  // Load from Supabase on mount
  useEffect(() => {
    async function loadProgress() {
      const { data: row, error } = await supabase
        .from("progress")
        .select("checked_tasks, checked_week_goals, task_orders, custom_times, start_date, exam_date, current_streak, last_active_date")
        .eq("id", "default")
        .single();
      if (!error && row) {
        setCheckedTasks(row.checked_tasks || {});
        setCheckedWeekGoals(row.checked_week_goals || {});
        setTaskOrders(row.task_orders || {});
        setCustomTimes(row.custom_times || {});
        if (row.start_date) setStartDate(row.start_date);
        if (row.exam_date) setExamDate(row.exam_date);
        if (row.current_streak) setCurrentStreak(row.current_streak);
        if (row.last_active_date) setLastActiveDate(row.last_active_date);
        // auto-select current week based on start date
        const wk = getCurrentWeekNum(row.start_date);
        if (wk) setSelectedWeek(wk);
      }
    }
    loadProgress();
  }, []);

  // Save to Supabase whenever state changes (debounced)
  const saveProgress = useCallback(async (tasks, goals, orders, times, streak, lastDate, startDt, examDt) => {
    setSyncStatus("saving");
    const { error } = await supabase
      .from("progress")
      .update({ checked_tasks: tasks, checked_week_goals: goals, task_orders: orders, custom_times: times, current_streak: streak, last_active_date: lastDate, start_date: startDt, exam_date: examDt, updated_at: new Date().toISOString() })
      .eq("id", "default");
    if (error) { setSyncStatus("error"); }
    else { setSyncStatus("saved"); setTimeout(() => setSyncStatus("idle"), 2000); }
  }, []);

  useEffect(() => {
    if (Object.keys(checkedTasks).length === 0 && Object.keys(checkedWeekGoals).length === 0 && Object.keys(taskOrders).length === 0 && Object.keys(customTimes).length === 0 && !startDate && !examDate) return;
    const timer = setTimeout(() => saveProgress(checkedTasks, checkedWeekGoals, taskOrders, customTimes, currentStreak, lastActiveDate, startDate, examDate), 800);
    return () => clearTimeout(timer);
  }, [checkedTasks, checkedWeekGoals, taskOrders, customTimes, currentStreak, lastActiveDate, startDate, examDate, saveProgress]);

  const toggleTask = (key) => {
    setCheckedTasks(prev => {
      const newVal = !prev[key];
      if (newVal) {
        const today = new Date().toISOString().split("T")[0];
        if (lastActiveDate !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
          setCurrentStreak(s => lastActiveDate === yesterday ? s + 1 : 1);
          setLastActiveDate(today);
        }
      }
      return { ...prev, [key]: newVal };
    });
  };
  const toggleWeekGoal = (weekNum) => setCheckedWeekGoals(prev => ({ ...prev, [weekNum]: !prev[weekNum] }));

  // Reorder tasks for a given week+day
  const reorderTasks = (weekNum, day, fromIdx, toIdx) => {
    const orderKey = `${weekNum}-${day}`;
    setTaskOrders(prev => {
      const wData = data.weeklyPlan.find(w => w.week === weekNum);
      const baseTasks = wData ? getDailyTasks(wData)[day] || [] : [];
      const current = prev[orderKey] || baseTasks.map((_, i) => i);
      const updated = [...current];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return { ...prev, [orderKey]: updated };
    });
  };

  // Get ordered tasks for a day (applying saved order, redistributing times)
  const getOrderedTasks = (weekNum, day, baseTasks) => {
    const orderKey = `${weekNum}-${day}`;
    const order = taskOrders[orderKey];
    if (!order || order.length !== baseTasks.length) return baseTasks;
    const times = baseTasks.map(t => t.time);
    return order.map((origIdx, newIdx) => ({
      ...baseTasks[origIdx],
      time: times[newIdx],
      origIdx
    }));
  };

  const resetOrder = (weekNum, day) => {
    const orderKey = `${weekNum}-${day}`;
    setTaskOrders(prev => { const n = { ...prev }; delete n[orderKey]; return n; });
  };

  const tabs = [
    { id: "roadmap",    label: "4-Month Roadmap",    short: "Roadmap" },
    { id: "weekly",     label: "Week-by-Week Plan",  short: "Weekly" },
    { id: "dailytasks", label: "Daily Tasks",         short: "Tasks" },
    { id: "sections",   label: "Section Strategy",   short: "Sections" },
    { id: "daily",      label: "Daily Routine",       short: "Routine" },
    { id: "mocks",      label: "Mock Strategy",       short: "Mocks" },
    { id: "milestones", label: "Milestones",          short: "Goals" },
    { id: "resources",  label: "Resources",           short: "Resources" },
  ];

  const currentWeekNum = getCurrentWeekNum(startDate);
  const todayName = getTodayName();
  const daysLeft = daysUntil(examDate);

  const syncColor = syncStatus === "saving" ? "#C8972A" : syncStatus === "saved" ? "#2AAF6F" : syncStatus === "error" ? "#E8532A" : "#333";
  const syncText = syncStatus === "saving" ? "● SYNCING..." : syncStatus === "saved" ? "✓ SAVED" : syncStatus === "error" ? "✗ SYNC ERROR" : "● CLOUD SYNC";

  return (
    <div style={{ fontFamily:"'Georgia', 'Times New Roman', serif", background:"#0D0D0D", minHeight:"100vh", color:"#F0EDE8" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg, #0D0D0D 0%, #1A1208 50%, #0D0D0D 100%)", borderBottom:"1px solid #2A2520", padding: isMobile ? "24px 16px 20px" : "40px 32px 32px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, right:0, width:"300px", height:"300px", background:"radial-gradient(circle, rgba(232,83,42,0.08) 0%, transparent 70%)", pointerEvents:"none" }} />
        <div style={{ maxWidth:"900px", margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"8px", flexWrap:"wrap" }}>
            {/* CAT countdown */}
            {editingExamDate ? (
              <input autoFocus type="date" defaultValue={examDate}
                onBlur={e => { if(e.target.value) setExamDate(e.target.value); setEditingExamDate(false); }}
                onKeyDown={e => { if(e.key==="Enter") e.target.blur(); if(e.key==="Escape") setEditingExamDate(false); }}
                style={{ background:"#1A1A1A", border:"1px solid #E8532A", color:"#F0EDE8", padding:"3px 8px", fontFamily:"monospace", fontSize:"11px" }} />
            ) : (
              <div onClick={() => setEditingExamDate(true)} title="Click to set exam date" style={{ background:"#E8532A", color:"#fff", padding:"4px 12px", fontSize:"10px", fontFamily:"monospace", letterSpacing:"3px", fontWeight:"bold", cursor:"pointer" }}>
                {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft}D TO CAT` : daysLeft === 0 ? "CAT TODAY" : "CAT DONE") : "SET EXAM DATE"}
              </div>
            )}
            {/* Start date / current week */}
            {editingStartDate ? (
              <input autoFocus type="date" defaultValue={startDate}
                onBlur={e => { if(e.target.value){ setStartDate(e.target.value); const wk=getCurrentWeekNum(e.target.value); if(wk) setSelectedWeek(wk); } setEditingStartDate(false); }}
                onKeyDown={e => { if(e.key==="Enter") e.target.blur(); if(e.key==="Escape") setEditingStartDate(false); }}
                style={{ background:"#1A1A1A", border:"1px solid #555", color:"#F0EDE8", padding:"3px 8px", fontFamily:"monospace", fontSize:"11px" }} />
            ) : (
              <div onClick={() => setEditingStartDate(true)} title="Click to set Day 1 start date" style={{ border:`1px solid ${currentWeekNum ? "#444" : "#888"}`, color: currentWeekNum ? "#888" : "#F0EDE8", background: currentWeekNum ? "transparent" : "#2A2A2A", padding:"4px 12px", fontSize:"10px", fontFamily:"monospace", letterSpacing:"2px", cursor:"pointer" }}>
                {currentWeekNum ? `WEEK ${currentWeekNum} OF 16` : "✎ SET START DATE"}
              </div>
            )}
            {currentStreak > 0 && (
              <div style={{ color:"#C8972A", fontSize:"10px", fontFamily:"monospace", letterSpacing:"1px" }}>🔥 {currentStreak} DAY STREAK</div>
            )}
            <div style={{ marginLeft:"auto", color:syncColor, fontSize:"10px", fontFamily:"monospace", letterSpacing:"1px" }}>{syncText}</div>
          </div>
          <h1 style={{ fontSize:"clamp(28px, 5vw, 48px)", fontWeight:"normal", letterSpacing:"-1px", margin:"0 0 8px", lineHeight:1.1 }}>
            99 Percentile<br /><span style={{ color:"#E8532A" }}>Execution Blueprint</span>
          </h1>
          <p style={{ color:"#888", fontSize:"14px", margin:0, fontFamily:"'Courier New', monospace", letterSpacing:"1px" }}>
            4 Months · 3 Sections · Zero Fluff · Maximum Execution
          </p>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ background:"#111", borderBottom:"1px solid #222", padding:"0 32px", overflowX:"auto" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto", display:"flex" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background:"none", border:"none", cursor:"pointer", padding: isMobile ? "12px 10px" : "16px 20px", fontSize: isMobile ? "10px" : "12px", fontFamily:"'Courier New', monospace", letterSpacing: isMobile ? "0.5px" : "1.5px", color: activeTab===tab.id ? "#E8532A" : "#555", borderBottom: activeTab===tab.id ? "2px solid #E8532A" : "2px solid transparent", transition:"all 0.2s", whiteSpace:"nowrap", textTransform:"uppercase" }}>
              {isMobile ? tab.short : tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:"900px", margin:"0 auto", padding: isMobile ? "16px" : "32px" }}>

        {/* WEEKLY PLAN TAB */}
        {activeTab === "weekly" && (
          <div>
            <SectionTitle>Week-by-Week Execution Plan — All 16 Weeks</SectionTitle>
            <p style={{ color:"#666", fontSize:"12px", fontFamily:"monospace", marginBottom:"28px", padding:"12px", background:"#141414", borderLeft:"3px solid #4A90D9" }}>
              Each week has exact topics, daily question targets, mocks, and a weekly goal. Follow in sequence — do not skip ahead.
            </p>
            {["Month 1","Month 2","Month 3","Month 4"].map(month => {
              const weeks = data.weeklyPlan.filter(w => w.month === month);
              const monthColor = weeks[0]?.color || "#E8532A";
              return (
                <div key={month} style={{ marginBottom:"40px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"20px" }}>
                    <div style={{ background:monthColor, color:"#fff", padding:"6px 18px", fontSize:"11px", fontFamily:"monospace", letterSpacing:"3px", fontWeight:"bold" }}>{month.toUpperCase()}</div>
                    <div style={{ height:"1px", flex:1, background:`linear-gradient(to right, ${monthColor}44, transparent)` }} />
                    <div style={{ color:"#444", fontSize:"11px", fontFamily:"monospace" }}>{weeks[0]?.phase}</div>
                  </div>
                  {weeks.map((w, i) => (
                    <div key={i} style={{ background:"#141414", border:"1px solid #1E1E1E", borderLeft:`3px solid ${w.color}`, marginBottom:"16px", overflow:"hidden" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", background:"#111", borderBottom:"1px solid #1A1A1A", flexWrap:"wrap", gap:"10px" }}>
                        <div style={{ background:w.color, color:"#000", padding:"3px 12px", fontSize:"11px", fontFamily:"monospace", fontWeight:"bold", letterSpacing:"1px" }}>WEEK {w.week}</div>
                        <div style={{ color:"#666", fontSize:"11px", fontFamily:"monospace", background:"#0D0D0D", padding:"4px 12px", border:"1px solid #222" }}>
                          {w.mock.startsWith("None") ? "🚫 NO MOCK" : w.mock.startsWith("ZERO") ? "🚫 NO MOCK" : w.mock.startsWith("FIRST") ? "⚡ FIRST FULL MOCK" : w.mock.includes("Full mock") ? "📋 FULL MOCK" : "📝 SECTIONAL"}
                        </div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", borderBottom:"1px solid #1A1A1A" }}>
                        {[{ label:"QUANT", data:w.quant, color:"#4A90D9" },{ label:"VARC", data:w.varc, color:"#E8532A" },{ label:"LRDI", data:w.lrdi, color:"#C8972A" }].map((sec, j) => (
                          <div key={j} style={{ padding:"16px 18px", borderRight: j<2 ? "1px solid #1A1A1A" : "none" }}>
                            <div style={{ color:sec.color, fontSize:"10px", fontFamily:"monospace", letterSpacing:"2px", marginBottom:"10px", fontWeight:"bold" }}>{sec.label}</div>
                            {sec.data.topics.map((t, k) => {
                              const tKey = `w${w.week}-${sec.label}-topic-${k}`;
                              const tDone = !!checkedTasks[tKey];
                              return (
                                <div key={k} onClick={() => toggleTask(tKey)} style={{ display:"flex", gap:"8px", marginBottom:"5px", alignItems:"flex-start", cursor:"pointer", padding:"4px 6px", borderRadius:"2px", background: tDone ? "#0A0A0A" : "transparent" }}>
                                  <div style={{ flexShrink:0, width:"13px", height:"13px", borderRadius:"2px", marginTop:"2px", border:`1.5px solid ${tDone ? sec.color : "#333"}`, background: tDone ? sec.color : "transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                    {tDone && <span style={{ color:"#000", fontSize:"8px", fontWeight:"bold" }}>✓</span>}
                                  </div>
                                  <span style={{ color: tDone ? "#444" : "#CCC", fontSize:"11px", lineHeight:1.5, textDecoration: tDone ? "line-through" : "none", textDecorationColor:"#555", transition:"all 0.2s" }}>{t}</span>
                                </div>
                              );
                            })}
                            <div style={{ background:"#0D0D0D", padding:"8px 10px", marginTop:"8px", marginBottom:"6px" }}>
                              <div style={{ color:"#555", fontSize:"9px", fontFamily:"monospace", letterSpacing:"1px", marginBottom:"3px" }}>DAILY TARGET</div>
                              <div style={{ color:"#AAA", fontSize:"11px", fontFamily:"monospace" }}>{sec.data.questions}</div>
                            </div>
                            {(() => {
                              const gKey = `w${w.week}-${sec.label}-goal`;
                              const gDone = !!checkedTasks[gKey];
                              return (
                                <div onClick={() => toggleTask(gKey)} style={{ display:"flex", gap:"8px", alignItems:"flex-start", cursor:"pointer", padding:"4px 6px", borderRadius:"2px", background: gDone ? "#0A0A0A" : "transparent" }}>
                                  <div style={{ flexShrink:0, width:"13px", height:"13px", borderRadius:"2px", marginTop:"2px", border:`1.5px solid ${gDone ? "#2AAF6F" : "#2AAF6F55"}`, background: gDone ? "#2AAF6F" : "transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                    {gDone && <span style={{ color:"#000", fontSize:"8px", fontWeight:"bold" }}>✓</span>}
                                  </div>
                                  <span style={{ color: gDone ? "#444" : "#2AAF6F", fontSize:"11px", lineHeight:1.4, textDecoration: gDone ? "line-through" : "none", transition:"all 0.2s" }}>{sec.data.goal}</span>
                                </div>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
                        <div style={{ padding:"12px 18px", borderRight: isMobile ? "none" : "1px solid #1A1A1A", borderBottom: isMobile ? "1px solid #1A1A1A" : "none" }}>
                          <div style={{ color:"#555", fontSize:"9px", fontFamily:"monospace", letterSpacing:"1px", marginBottom:"5px" }}>MOCK / TEST THIS WEEK</div>
                          <div style={{ color: w.mock.startsWith("None")||w.mock.startsWith("ZERO") ? "#444" : "#F0EDE8", fontSize:"12px", lineHeight:1.5 }}>{w.mock}</div>
                        </div>
                        <div style={{ padding:"12px 18px" }}>
                          <div style={{ color:"#555", fontSize:"9px", fontFamily:"monospace", letterSpacing:"1px", marginBottom:"8px" }}>WEEK GOAL</div>
                          <div style={{ display:"flex", gap:"10px", alignItems:"flex-start" }}>
                            <button onClick={() => toggleWeekGoal(w.week)} style={{ flexShrink:0, width:"18px", height:"18px", borderRadius:"3px", border:`2px solid ${checkedWeekGoals[w.week] ? w.color : "#444"}`, background: checkedWeekGoals[w.week] ? w.color : "transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", marginTop:"1px", padding:0 }}>
                              {checkedWeekGoals[w.week] && <span style={{ color:"#000", fontSize:"11px", fontWeight:"bold" }}>✓</span>}
                            </button>
                            <div style={{ color: checkedWeekGoals[w.week] ? "#444" : w.color, fontSize:"12px", lineHeight:1.5, textDecoration: checkedWeekGoals[w.week] ? "line-through" : "none", transition:"all 0.2s" }}>{w.weekGoal}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* DAILY TASKS TAB */}
        {activeTab === "dailytasks" && (() => {
          const wData = data.weeklyPlan.find(w => w.week === selectedWeek);
          const dailyTasks = wData ? getDailyTasks(wData) : {};
          const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
          const dayColors = { Monday:"#4A90D9", Tuesday:"#7B5EA7", Wednesday:"#E8532A", Thursday:"#C8972A", Friday:"#2AAF6F", Saturday:"#D6367A", Sunday:"#888" };
          return (
            <div>
              <SectionTitle>Daily Task Checklist</SectionTitle>
              <p style={{ color:"#666", fontSize:"12px", fontFamily:"monospace", marginBottom:"20px", padding:"12px", background:"#141414", borderLeft:"3px solid #E8532A" }}>
                Select a week. Check off each task as you complete it. Progress syncs across all your devices automatically.
              </p>
              {/* Progress / streak card */}
              <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap:"10px", marginBottom:"24px" }}>
                {[
                  { label:"CURRENT WEEK", value: currentWeekNum ? `Week ${currentWeekNum}` : "—", sub: currentWeekNum ? `of 16` : "Set start date", color:"#E8532A" },
                  { label:"STREAK", value: currentStreak > 0 ? `${currentStreak} days` : "0 days", sub: currentStreak > 0 ? "🔥 keep going" : "check off a task", color:"#C8972A" },
                  { label:"THIS WEEK", value: (() => { const all=days.flatMap(d=>(dailyTasks[d]||[]).map((_,ti)=>`${wData ? wData.week : selectedWeek}-${d}-${ti}`)); const done=all.filter(k=>checkedTasks[k]).length; return `${all.length ? Math.round(done/all.length*100) : 0}%`; })(), sub: "tasks complete", color:"#4A90D9" },
                  { label:"DAYS TO CAT", value: daysLeft !== null ? (daysLeft > 0 ? daysLeft : daysLeft === 0 ? "Today!" : "Done") : "—", sub: examDate || "Click header to set", color:"#2AAF6F" },
                ].map((card, i) => (
                  <div key={i} style={{ background:"#141414", border:"1px solid #1E1E1E", borderTop:`2px solid ${card.color}`, padding:"14px" }}>
                    <div style={{ color:"#555", fontSize:"8px", fontFamily:"monospace", letterSpacing:"2px", marginBottom:"6px" }}>{card.label}</div>
                    <div style={{ color:card.color, fontSize:"22px", fontFamily:"monospace", fontWeight:"bold", lineHeight:1 }}>{card.value}</div>
                    <div style={{ color:"#444", fontSize:"10px", marginTop:"4px" }}>{card.sub}</div>
                  </div>
                ))}
              </div>

              {/* Month-grouped week selector */}
              <div style={{ marginBottom:"28px" }}>
                <div style={{ color:"#555", fontSize:"10px", fontFamily:"monospace", letterSpacing:"2px", marginBottom:"12px" }}>SELECT WEEK</div>
                {["Month 1","Month 2","Month 3","Month 4"].map(month => {
                  const monthWeeks = data.weeklyPlan.filter(w => w.month === month);
                  const monthColor = monthWeeks[0]?.color;
                  return (
                    <div key={month} style={{ marginBottom:"10px", display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
                      <div style={{ color:monthColor, fontSize:"9px", fontFamily:"monospace", letterSpacing:"2px", width:"56px", flexShrink:0 }}>{month.toUpperCase()}</div>
                      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                        {monthWeeks.map(w => {
                          const allKeys = days.flatMap(d => (getDailyTasks(w)[d]||[]).map((_,ti) => `${w.week}-${d}-${ti}`));
                          const done = allKeys.filter(k => checkedTasks[k]).length;
                          const pct = allKeys.length > 0 ? Math.round((done/allKeys.length)*100) : 0;
                          const isSel = selectedWeek === w.week;
                          const isCurrent = currentWeekNum === w.week;
                          return (
                            <button key={w.week} onClick={() => setSelectedWeek(w.week)} style={{ background: isSel ? w.color : "#141414", border:`1px solid ${isSel ? w.color : isCurrent ? monthColor : "#2A2A2A"}`, color: isSel ? "#000" : pct===100 ? "#2AAF6F" : isCurrent ? monthColor : "#666", padding:"5px 12px", cursor:"pointer", fontFamily:"monospace", fontSize:"11px", fontWeight: isSel || isCurrent ? "bold" : "normal", position:"relative" }}>
                              W{w.week}{pct===100 && !isSel ? " ✓" : pct>0 && pct<100 ? ` ${pct}%` : ""}
                              {isCurrent && !isSel && <span style={{ position:"absolute", top:"-3px", right:"-3px", width:"6px", height:"6px", borderRadius:"50%", background:monthColor }} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              {wData && (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px", flexWrap:"wrap" }}>
                    <div style={{ background:wData.color, color:"#000", padding:"5px 16px", fontFamily:"monospace", fontSize:"11px", fontWeight:"bold", letterSpacing:"2px" }}>WEEK {wData.week} — {wData.month}</div>
                    <div style={{ color:"#555", fontFamily:"monospace", fontSize:"11px" }}>{wData.phase}</div>
                    <div style={{ marginLeft:"auto", color:"#444", fontFamily:"monospace", fontSize:"11px" }}>
                      {(() => { const all=days.flatMap(d=>(dailyTasks[d]||[]).map((_,ti)=>`${wData.week}-${d}-${ti}`)); return `${all.filter(k=>checkedTasks[k]).length}/${all.length} tasks done`; })()}
                    </div>
                  </div>
                  {(() => {
                    const all=days.flatMap(d=>(dailyTasks[d]||[]).map((_,ti)=>`${wData.week}-${d}-${ti}`));
                    const pct=all.length>0?(all.filter(k=>checkedTasks[k]).length/all.length)*100:0;
                    return <div style={{ background:"#1A1A1A", height:"4px", marginBottom:"24px", borderRadius:"2px" }}><div style={{ background:wData.color, height:"4px", width:`${pct}%`, borderRadius:"2px", transition:"width 0.3s" }} /></div>;
                  })()}
                  {days.map(day => {
                    const baseTasks = dailyTasks[day]||[];
                    const tasks = getOrderedTasks(wData.week, day, baseTasks);
                    const orderKey = `${wData.week}-${day}`;
                    const isCustomOrdered = !!(taskOrders[orderKey] && taskOrders[orderKey].length === baseTasks.length);
                    const done = tasks.filter((_,ti)=>checkedTasks[`${wData.week}-${day}-${ti}`]).length;
                    const dc = dayColors[day];
                    const isMockD = tasks.some(t=>t.tag==="mock"&&t.activity.includes("Full mock"));
                    const isSectD = tasks.some(t=>t.tag==="mock"&&t.activity.includes("Sectional"));
                    const isToday = day === todayName && currentWeekNum === wData.week;
                    return (
                      <div key={day} style={{ background:"#141414", border:`1px solid ${isToday ? dc+"55" : "#1A1A1A"}`, borderLeft:`3px solid ${dc}`, marginBottom:"12px" }}>
                        {/* Day header */}
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", background: isToday ? "#0F0F0F" : "#0F0F0F", borderBottom:"1px solid #1A1A1A" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                            <span style={{ color:dc, fontFamily:"monospace", fontSize:"11px", fontWeight:"bold", letterSpacing:"2px" }}>{day.toUpperCase()}</span>
                            {isToday && <span style={{ background:dc+"22", color:dc, fontSize:"9px", fontFamily:"monospace", padding:"2px 8px", border:`1px solid ${dc}44` }}>TODAY</span>}
                            {isMockD && <span style={{ background:"#E8532A22", color:"#E8532A", fontSize:"9px", fontFamily:"monospace", padding:"2px 8px", border:"1px solid #E8532A44" }}>⚡ MOCK DAY</span>}
                            {isSectD && <span style={{ background:"#C8972A22", color:"#C8972A", fontSize:"9px", fontFamily:"monospace", padding:"2px 8px", border:"1px solid #C8972A44" }}>📝 SECTIONAL</span>}
                            {isCustomOrdered && (
                              <button onClick={() => resetOrder(wData.week, day)} style={{ background:"transparent", border:"1px solid #333", color:"#555", padding:"1px 8px", fontFamily:"monospace", fontSize:"8px", cursor:"pointer", letterSpacing:"1px" }}>↺ RESET ORDER</button>
                            )}
                          </div>
                          <span style={{ color: done===tasks.length ? "#2AAF6F" : "#444", fontFamily:"monospace", fontSize:"10px" }}>{done}/{tasks.length}{done===tasks.length&&tasks.length>0?" ✓ DONE":""}</span>
                        </div>
                        {/* Task rows */}
                        <div style={{ padding:"8px 0" }}>
                          {tasks.map((task, ti) => {
                            const origIdx = task.origIdx !== undefined ? task.origIdx : ti;
                            const key=`${wData.week}-${day}-${origIdx}`;
                            const isDone=!!checkedTasks[key];
                            const tc = { VARC:"#E8532A", Quant:"#4A90D9", LRDI:"#C8972A", revision:"#7B5EA7", concept:"#888", drill:"#D6367A", mock:"#E8532A", break:"#2A2A2A" }[task.tag] || "#444";
                            const isBreak = task.tag==="break";
                            return (
                              <div
                                key={`${origIdx}-${ti}`}
                                draggable={!isBreak}
                                onDragStart={() => { dragItem.current = ti; }}
                                onDragEnter={() => { dragOver.current = ti; }}
                                onDragEnd={() => {
                                  if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
                                    reorderTasks(wData.week, day, dragItem.current, dragOver.current);
                                  }
                                  dragItem.current = null;
                                  dragOver.current = null;
                                }}
                                onDragOver={e => e.preventDefault()}
                                onClick={()=>{ if(!isBreak) toggleTask(key); }}
                                style={{ display:"flex", gap:"0", alignItems:"stretch", background: isDone ? "#0A0A0A" : "transparent", opacity: isBreak ? 0.5 : 1, transition:"background 0.15s", cursor: isBreak ? "default" : "grab", borderBottom:"1px solid #111", userSelect:"none" }}
                              >
                                {/* Drag handle */}
                                {!isBreak && (
                                  <div style={{ width:"20px", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#2A2A2A", fontSize:"12px", borderRight:"1px solid #111" }}>⠿</div>
                                )}
                                {isBreak && <div style={{ width:"20px", flexShrink:0 }} />}
                                {/* Time column */}
                                {(() => {
                                  const timeKey = `${wData.week}-${day}-${origIdx}`;
                                  const displayTime = customTimes[timeKey] || task.time;
                                  const isEditingThisTime = editingTime === timeKey;
                                  return (
                                    <div style={{ width:"115px", flexShrink:0, borderRight:"1px solid #1A1A1A", display:"flex", alignItems:"center", position:"relative" }}>
                                      {isEditingThisTime ? (
                                        <input
                                          autoFocus
                                          defaultValue={displayTime}
                                          onBlur={e => {
                                            const val = e.target.value.trim();
                                            if (val) {
                                              setCustomTimes(prev => ({ ...prev, [timeKey]: val }));
                                              // Auto-reorder: parse start hour from time string and sort
                                              const parseHour = (str) => {
                                                const m = str.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                                                if (!m) return 9999;
                                                let h = parseInt(m[1]);
                                                const min = parseInt(m[2]);
                                                const ampm = (m[3]||"").toUpperCase();
                                                if (ampm === "PM" && h !== 12) h += 12;
                                                if (ampm === "AM" && h === 12) h = 0;
                                                return h * 60 + min;
                                              };
                                              // Rebuild order after slight delay so customTimes state is updated
                                              setTimeout(() => {
                                                setCustomTimes(prev => {
                                                  const updated = { ...prev, [timeKey]: val };
                                                  // Get all tasks for this day with their effective times
                                                  const wD = data.weeklyPlan.find(w => w.week === wData.week);
                                                  if (!wD) return updated;
                                                  const base = getDailyTasks(wD)[day] || [];
                                                  // Build list of { origIdx, effectiveTime }
                                                  const ordered = base.map((t, idx) => {
                                                    const tKey = `${wData.week}-${day}-${idx}`;
                                                    return { origIdx: idx, timeStr: updated[tKey] || t.time };
                                                  });
                                                  ordered.sort((a, b) => parseHour(a.timeStr) - parseHour(b.timeStr));
                                                  setTaskOrders(prev2 => ({ ...prev2, [`${wData.week}-${day}`]: ordered.map(x => x.origIdx) }));
                                                  return updated;
                                                });
                                              }, 0);
                                            }
                                            setEditingTime(null);
                                          }}
                                          onKeyDown={e => {
                                            if (e.key === "Enter") e.target.blur();
                                            if (e.key === "Escape") { setEditingTime(null); }
                                          }}
                                          onClick={e => e.stopPropagation()}
                                          style={{ width:"100%", background:"#0D0D0D", border:"none", borderBottom:"1px solid #E8532A", color:"#F0EDE8", padding:"10px 8px", fontFamily:"monospace", fontSize:"9px", outline:"none", lineHeight:1.3 }}
                                        />
                                      ) : (
                                        <div
                                          onClick={e => { e.stopPropagation(); if (!isBreak) setEditingTime(timeKey); }}
                                          title={isBreak ? "" : "Click to edit time"}
                                          style={{ width:"100%", padding:"10px 8px", fontFamily:"monospace", fontSize:"10px", color: isDone ? "#333" : isBreak ? "#444" : "#CCC", lineHeight:1.3, cursor: isBreak ? "default" : "text", display:"flex", alignItems:"center", gap:"4px" }}
                                        >
                                          <span style={{ flex:1 }}>{displayTime}</span>
                                          {!isBreak && <span style={{ color:"#2A2A2A", fontSize:"8px", opacity:0.6 }}>✎</span>}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                                {/* Tag strip */}
                                <div style={{ width:"3px", flexShrink:0, background: isBreak ? "#1A1A1A" : tc }} />
                                {/* Activity */}
                                <div style={{ flex:1, padding:"10px 14px", display:"flex", alignItems:"center", gap:"10px" }}>
                                  {!isBreak && (
                                    <div onClick={e=>{e.stopPropagation(); toggleTask(key);}} style={{ flexShrink:0, width:"15px", height:"15px", borderRadius:"2px", border:`2px solid ${isDone ? tc : "#333"}`, background: isDone ? tc : "transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s", cursor:"pointer" }}>
                                      {isDone && <span style={{ color:"#000", fontSize:"8px", fontWeight:"bold" }}>✓</span>}
                                    </div>
                                  )}
                                  <span style={{ color: isDone ? "#333" : isBreak ? "#444" : "#CCC", fontSize:"12px", lineHeight:1.5, textDecoration: isDone ? "line-through" : "none", textDecorationColor:"#555", transition:"all 0.2s", flex:1 }}>{task.activity}</span>
                                  {!isBreak && (
                                    <span style={{ color: tc, fontSize:"9px", fontFamily:"monospace", letterSpacing:"1px", flexShrink:0, opacity:0.8 }}>{task.tag.toUpperCase()}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ background:"#141414", border:`1px solid ${wData.color}33`, padding:"16px 20px", marginTop:"8px" }}>
                    <div style={{ color:"#555", fontSize:"9px", fontFamily:"monospace", letterSpacing:"2px", marginBottom:"10px" }}>WEEK COMPLETION GOAL</div>
                    <div style={{ display:"flex", gap:"12px", alignItems:"flex-start" }}>
                      <button onClick={()=>toggleWeekGoal(wData.week)} style={{ flexShrink:0, width:"20px", height:"20px", borderRadius:"3px", border:`2px solid ${checkedWeekGoals[wData.week] ? wData.color : "#444"}`, background: checkedWeekGoals[wData.week] ? wData.color : "transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>
                        {checkedWeekGoals[wData.week] && <span style={{ color:"#000", fontSize:"12px", fontWeight:"bold" }}>✓</span>}
                      </button>
                      <div style={{ color: checkedWeekGoals[wData.week] ? "#444" : wData.color, fontSize:"13px", lineHeight:1.6, textDecoration: checkedWeekGoals[wData.week] ? "line-through" : "none", transition:"all 0.2s" }}>{wData.weekGoal}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ROADMAP TAB */}
        {activeTab === "roadmap" && (
          <div>
            <SectionTitle>4-Month Phase-by-Phase System</SectionTitle>
            {data.phases.map((phase, i) => (
              <div key={i} style={{ background:"#141414", border:`1px solid #222`, borderLeft:`4px solid ${phase.color}`, marginBottom:"24px", padding:"28px" }}>
                <div style={{ display:"flex", gap:"16px", alignItems:"flex-start", flexWrap:"wrap" }}>
                  <div style={{ background:phase.color, color:"#fff", padding:"6px 16px", fontSize:"11px", fontFamily:"monospace", letterSpacing:"2px", fontWeight:"bold", flexShrink:0 }}>{phase.month}</div>
                  <h2 style={{ margin:0, fontSize:"20px", fontWeight:"normal", color:"#F0EDE8", flex:1 }}>{phase.label}</h2>
                </div>
                <p style={{ color:"#AAA", fontSize:"13px", fontFamily:"monospace", marginTop:"16px", marginBottom:"16px", padding:"12px", background:"#0D0D0D", borderLeft:`2px solid ${phase.color}` }}>
                  OBJECTIVE: {phase.objective}
                </p>
                <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:"20px" }}>
                  <div>
                    <Label>Skills to Build</Label>
                    {phase.skills.map((s, j) => <BulletItem key={j} color={phase.color}>{s}</BulletItem>)}
                  </div>
                  <div>
                    <Label>Weekly Focus</Label>
                    {phase.weekly.map((w, j) => (
                      <div key={j} style={{ marginBottom:"12px" }}>
                        <div style={{ fontSize:"10px", color:phase.color, fontFamily:"monospace", letterSpacing:"2px", marginBottom:"4px" }}>{w.week}</div>
                        <div style={{ fontSize:"12px", color:"#CCC", lineHeight:1.5 }}>{w.focus}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ background:"#141414", border:"1px solid #2A2520", padding:"28px" }}>
              <SectionTitle style={{ marginTop:0 }}>Handling Bad Mocks & Burnout</SectionTitle>
              {[
                { q:"After a bad mock (score drops 20+ points)", a:"Do NOT re-take a mock immediately. Spend 2 hrs reviewing the specific error category. Then solve 25 questions only from that category next day. Bad mocks are data, not failure." },
                { q:"Inconsistency trigger (missed 3+ days)", a:"Reduce targets by 50% for 3 days. Do only 1 hour per day. Rebuild habit before rebuilding intensity. Never try to 'compensate' missed days—it causes burnout." },
                { q:"Preventing burnout", a:"Sunday afternoons = complete off. No studying. Non-negotiable. One hobby maintained throughout prep. Don't discuss CAT with people who haven't given it." },
                { q:"Motivation dip in Month 3", a:"This is universal. Expected. Switch to PYQ solving (2019–2023)—it gives direct confidence feedback. Your score on actual old papers is more meaningful than any self-doubt." }
              ].map((item, i) => (
                <div key={i} style={{ borderBottom:"1px solid #1A1A1A", paddingBottom:"16px", marginBottom:"16px" }}>
                  <div style={{ color:"#E8532A", fontSize:"12px", fontFamily:"monospace", marginBottom:"6px" }}>▸ {item.q}</div>
                  <div style={{ color:"#CCC", fontSize:"13px", lineHeight:1.6 }}>{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTIONS TAB */}
        {activeTab === "sections" && (
          <div>
            <SectionTitle>Section-wise Execution Strategy</SectionTitle>
            {data.sections.map((sec, i) => (
              <div key={i} style={{ background:"#141414", border:`1px solid #222`, borderTop:`3px solid ${sec.color}`, marginBottom:"28px", padding:"28px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
                  <span style={{ fontSize:"28px" }}>{sec.icon}</span>
                  <h2 style={{ margin:0, fontSize:"24px", fontWeight:"normal", color:sec.color }}>{sec.name}</h2>
                </div>
                <Label>Exact Approach</Label>
                {sec.approach.map((a, j) => (
                  <div key={j} style={{ display:"flex", gap:"12px", marginBottom:"10px" }}>
                    <span style={{ color:sec.color, fontFamily:"monospace", fontSize:"12px", flexShrink:0, marginTop:"2px" }}>{String(j+1).padStart(2,"0")}.</span>
                    <p style={{ margin:0, color:"#CCC", fontSize:"13px", lineHeight:1.6 }}>{a}</p>
                  </div>
                ))}
                <div style={{ background:"#0D0D0D", border:`1px solid #1A1A1A`, padding:"14px 18px", margin:"20px 0", borderLeft:`3px solid ${sec.color}` }}>
                  <Label style={{ marginBottom:"6px" }}>Daily Practice Target</Label>
                  <p style={{ margin:0, color:"#F0EDE8", fontSize:"13px", fontFamily:"monospace" }}>{sec.daily}</p>
                </div>
                <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:"20px" }}>
                  <div>
                    <Label>Common Mistakes to Avoid</Label>
                    {sec.mistakes.map((m, j) => (
                      <div key={j} style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
                        <span style={{ color:"#E8532A", flexShrink:0, fontSize:"12px" }}>✗</span>
                        <span style={{ color:"#999", fontSize:"12px", lineHeight:1.5 }}>{m}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label>How to Measure Improvement</Label>
                    <div style={{ background:"#0D0D0D", padding:"14px", fontSize:"12px", color:"#CCC", lineHeight:1.7, fontFamily:"monospace" }}>{sec.measurement}</div>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ background:"#141414", border:"1px solid #222", padding:"28px" }}>
              <SectionTitle style={{ marginTop:0 }}>Daily Targets & Difficulty Progression</SectionTitle>
              <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap:"16px" }}>
                {[
                  { phase:"Month 1", varc:"3 RCs + 10 VA Qs", lrdi:"2 sets (untimed)", quant:"20 Qs (70% medium)", color:"#E8532A" },
                  { phase:"Month 2", varc:"3 RCs (timed) + 15 VA Qs", lrdi:"2–3 sets (timed)", quant:"20 Qs (50% hard)", color:"#C8972A" },
                  { phase:"Month 3–4", varc:"4 RCs + 15 VA Qs (full timed)", lrdi:"3 sets (CAT speed)", quant:"25 Qs (30% very hard)", color:"#4A90D9" }
                ].map((t, i) => (
                  <div key={i} style={{ background:"#0D0D0D", padding:"16px", borderTop:`3px solid ${t.color}` }}>
                    <div style={{ color:t.color, fontSize:"11px", fontFamily:"monospace", letterSpacing:"2px", marginBottom:"12px" }}>{t.phase}</div>
                    <div style={{ fontSize:"11px", color:"#AAA", marginBottom:"6px" }}><span style={{ color:"#E8532A" }}>VARC:</span> {t.varc}</div>
                    <div style={{ fontSize:"11px", color:"#AAA", marginBottom:"6px" }}><span style={{ color:"#C8972A" }}>LRDI:</span> {t.lrdi}</div>
                    <div style={{ fontSize:"11px", color:"#AAA" }}><span style={{ color:"#4A90D9" }}>Quant:</span> {t.quant}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DAILY ROUTINE TAB */}
        {activeTab === "daily" && (
          <div>
            <SectionTitle>Daily Schedule (Weekday)</SectionTitle>
            <p style={{ color:"#666", fontSize:"12px", fontFamily:"monospace", marginBottom:"24px", padding:"12px", background:"#141414", borderLeft:"3px solid #E8532A" }}>
              Total study time: ~8 hrs/day | Adjust timings to your schedule, keep the sequence intact
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
              {data.schedule.map((item, i) => {
                const tc = tagColors[item.tag]||tagColors.concept;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"stretch", background: item.tag==="break" ? "#0A0A0A" : "#141414", opacity: item.tag==="break" ? 0.7 : 1 }}>
                    <div style={{ width:"120px", flexShrink:0, padding:"12px 16px", fontFamily:"monospace", fontSize:"11px", color:"#555", borderRight:"1px solid #1A1A1A", display:"flex", alignItems:"center" }}>{item.time}</div>
                    <div style={{ padding:"12px 16px", flex:1, fontSize:"13px", color: item.tag==="break" ? "#555" : "#CCC", display:"flex", alignItems:"center" }}>{item.activity}</div>
                    <div style={{ padding:"12px 12px", flexShrink:0, display:"flex", alignItems:"center" }}>
                      <span style={{ background:tc.bg, color:tc.text, padding:"2px 8px", fontSize:"9px", fontFamily:"monospace", letterSpacing:"1px", fontWeight:"bold", border:`1px solid ${tc.border}`, textTransform:"uppercase" }}>{item.tag}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background:"#141414", border:"1px solid #222", padding:"24px", marginTop:"24px" }}>
              <Label>Sunday Schedule (Different from Weekday)</Label>
              {["8:00 AM: Wake up + breakfast + settle down","8:30–10:30 AM: Full mock (2 hours, strictly timed — phone off, rough paper ready)","10:30–11:00 AM: Rest after mock. Do not start analysis yet.","11:00 AM–2:00 PM: Full 3-hour mock analysis (non-negotiable — this is where improvement happens)","2:00–7:00 PM: Completely OFF. No studying, no CAT content.","7:00–10:00 PM: GYM as usual.","10:00–10:30 PM: Post-gym wind down + dinner. Sleep by 11:30 PM."].map((item, i) => (
                <BulletItem key={i} color="#E8532A">{item}</BulletItem>
              ))}
            </div>
          </div>
        )}

        {/* MOCKS TAB */}
        {activeTab === "mocks" && (
          <div>
            <SectionTitle>Mock Test System (Your Most Critical Lever)</SectionTitle>
            <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
              {data.mockStrategy.map((item, i) => (
                <div key={i} style={{ background:"#141414", border:"1px solid #222", padding:"24px", display:"flex", gap:"20px" }}>
                  <div style={{ fontSize:"36px", fontFamily:"monospace", color:"#1E1E1E", fontWeight:"bold", flexShrink:0, lineHeight:1, WebkitTextStroke:"1px #333" }}>{item.step}</div>
                  <div>
                    <h3 style={{ margin:"0 0 10px", fontSize:"16px", fontWeight:"normal", color:"#E8532A" }}>{item.title}</h3>
                    <p style={{ margin:0, color:"#CCC", fontSize:"13px", lineHeight:1.7 }}>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background:"#141414", border:"1px solid #2A2520", padding:"28px", marginTop:"24px" }}>
              <SectionTitle style={{ marginTop:0 }}>The Error Log System (Non-Negotiable)</SectionTitle>
              <p style={{ color:"#888", fontSize:"12px", fontFamily:"monospace", marginBottom:"20px" }}>Maintain a Google Sheet with the following columns for every wrong question:</p>
              <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap:"12px" }}>
                {[{col:"Date",desc:"When you got it wrong"},{col:"Section",desc:"VARC / LRDI / Quant"},{col:"Topic",desc:"Specific sub-topic"},{col:"Error Type",desc:"Concept / Calc / Careless / Time"},{col:"Correct Approach",desc:"2-line explanation of right method"},{col:"Re-attempt date",desc:"Redo after 5–7 days cold"}].map((col, i) => (
                  <div key={i} style={{ background:"#0D0D0D", padding:"14px", borderTop:"2px solid #E8532A" }}>
                    <div style={{ color:"#E8532A", fontSize:"11px", fontFamily:"monospace", marginBottom:"6px" }}>{col.col}</div>
                    <div style={{ color:"#777", fontSize:"11px" }}>{col.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MILESTONES TAB */}
        {activeTab === "milestones" && (
          <div>
            <SectionTitle>Monthly Performance Milestones</SectionTitle>
            <p style={{ color:"#666", fontSize:"12px", fontFamily:"monospace", marginBottom:"24px", padding:"12px", background:"#141414", borderLeft:"3px solid #2AAF6F" }}>
              If you're below target at end of month → spend 3 extra days on your weakest section before moving to next phase.
            </p>
            {data.milestones.map((m, i) => {
              const colors=["#E8532A","#C8972A","#4A90D9","#2AAF6F"]; const c=colors[i];
              return (
                <div key={i} style={{ background:"#141414", border:"1px solid #222", borderLeft:`4px solid ${c}`, marginBottom:"20px", padding:"24px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
                    <div style={{ background:c, color:"#fff", padding:"4px 14px", fontSize:"11px", fontFamily:"monospace", letterSpacing:"2px" }}>{m.month}</div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap:"16px" }}>
                    {[{label:"VARC",value:m.varc,color:"#E8532A"},{label:"LRDI",value:m.lrdi,color:"#C8972A"},{label:"Quant",value:m.quant,color:"#4A90D9"},{label:"Overall Mock",value:m.overall,color:c}].map((item, j) => (
                      <div key={j} style={{ background:"#0D0D0D", padding:"14px", borderTop:`2px solid ${item.color}` }}>
                        <div style={{ color:item.color, fontSize:"10px", fontFamily:"monospace", letterSpacing:"2px", marginBottom:"6px" }}>{item.label}</div>
                        <div style={{ color:"#CCC", fontSize:"12px", lineHeight:1.5 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div style={{ background:"#141414", border:"1px solid #222", padding:"24px" }}>
              <SectionTitle style={{ marginTop:0 }}>Weekly Performance Benchmarks</SectionTitle>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {[{label:"Quant topic accuracy",target:"≥ 80% before moving to next topic"},{label:"RC accuracy per passage",target:"≥ 70% (3 out of 4 questions)"},{label:"LRDI set solve rate",target:"≥ 75% of attempted sets fully correct"},{label:"VA accuracy",target:"≥ 65% (these are most unpredictable—don't over-target)"},{label:"Mock percentile growth",target:"5–10 percentile points per month"}].map((b, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background: i%2===0 ? "#0D0D0D" : "transparent", gap:"16px" }}>
                    <span style={{ color:"#999", fontSize:"12px" }}>{b.label}</span>
                    <span style={{ color:"#2AAF6F", fontSize:"12px", fontFamily:"monospace", flexShrink:0 }}>{b.target}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === "resources" && (
          <div>
            <SectionTitle>Curated Resource List</SectionTitle>
            <p style={{ color:"#666", fontSize:"12px", fontFamily:"monospace", marginBottom:"24px", padding:"12px", background:"#141414", borderLeft:"3px solid #4A90D9" }}>
              Rule: Max 1–2 sources per section. More resources = less depth. Depth beats breadth every time.
            </p>
            {data.resources.map((cat, i) => {
              const isAvoid = cat.category==="Avoid";
              return (
                <div key={i} style={{ background:"#141414", border:`1px solid ${isAvoid ? "#3A1515" : "#222"}`, marginBottom:"16px", padding:"24px", borderTop:`3px solid ${isAvoid ? "#E83A3A" : "#4A90D9"}` }}>
                  <h3 style={{ margin:"0 0 16px", fontSize:"14px", letterSpacing:"2px", color: isAvoid ? "#E83A3A" : "#4A90D9", fontFamily:"monospace", textTransform:"uppercase" }}>
                    {isAvoid ? "✗ AVOID" : `▸ ${cat.category}`}
                  </h3>
                  {cat.items.map((item, j) => (
                    <div key={j} style={{ display:"flex", gap:"10px", marginBottom:"8px" }}>
                      <span style={{ color: isAvoid ? "#E83A3A" : "#4A90D9", fontSize:"12px", flexShrink:0 }}>{isAvoid ? "✗" : "→"}</span>
                      <span style={{ color: isAvoid ? "#885555" : "#CCC", fontSize:"13px", lineHeight:1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              );
            })}
            <div style={{ background:"#0D0D0D", border:"1px solid #2A2520", padding:"24px", marginTop:"8px" }}>
              <div style={{ color:"#E8532A", fontSize:"11px", fontFamily:"monospace", letterSpacing:"3px", marginBottom:"16px" }}>THE NON-NEGOTIABLE RULE</div>
              <p style={{ color:"#F0EDE8", fontSize:"15px", lineHeight:1.7, margin:0 }}>
                Previous Year CAT Papers (2017–2024) are your single most important resource. Do every single paper. Analyze every wrong answer. These 8 papers contain 99% of the patterns that will appear in your exam. Everything else is supplementary.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ borderTop:"1px solid #1A1A1A", padding:"20px 32px", textAlign:"center" }}>
        <div style={{ color:"#333", fontSize:"11px", fontFamily:"monospace", letterSpacing:"2px" }}>
          EXECUTE DAILY · REVIEW WEEKLY · ADJUST MONTHLY · TARGET 99
        </div>
      </div>

      {/* Floating Pomodoro */}
      <FloatingPomodoro />

    </div>
  );
}
