---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
inputDocuments:
  - "_bmad-output/analysis/product-brief-SpringAIS-2025-12-18.md"
  - "_bmad-output/analysis/research/market-ai-talent-mobility-platform-research-2025-12-18.md"
  - "_bmad-output/analysis/research/technical-ai-talent-platform-technical-stack-research-2025-12-18.md"
  - "_bmad-output/analysis/research/domain-ai-talent-mobility-platform-research-2025-12-18.md"
  - "_bmad-output/analysis/research/domain-ey-performance-systems-promotion-evaluation-research-2025-12-18.md"
  - "_bmad-output/analysis/research/domain-ey-career-progression-success-patterns-research-2025-12-20.md"
  - "_bmad-output/analysis/brainstorming-session-2025-12-18.md"
documentCounts:
  briefs: 1
  research: 5
  brainstorming: 1
  projectDocs: 0
workflowType: "prd"
lastStep: 11
project_name: "SpringAIS"
user_name: "Clays"
date: "2025-12-18"
---

# Product Requirements Document - SpringAIS

**Author:** Clays
**Date:** 2025-12-18
**Last Updated:** 2025-12-23 (Refined: text-embedding-3-large for vectorization (3072-D), GPT-5.2 for extraction/generation, proficiency context through aggregate skill profiles, pre-cached common skills, aggregate matching algorithm, threshold-based search, synonym handling, two parallel processes, natural progression always shown, trajectory-based path comparison with wall detection, lateral move display when aligned, multi-skill extraction per quote, per-skill embedding architecture with caching, multiple opt-ins allowed, terminal level handling, trajectory depth limit, time estimate source, translation confidence weighting)

---

## Executive Summary

SpringAIS is an AI-powered internal talent mobility platform that transforms how EY employees discover career opportunities and chart their professional growth. Unlike traditional job-matching systems that simply compare skills to requirements, SpringAIS reveals hidden opportunities employees didn't know existed, then provides a clear, actionable roadmap showing exactly how to get there—backed by patterns from employees who have successfully made similar transitions.

### Market Context

The HR technology market is valued at $40.53B, with talent mobility specifically representing a $9.17B segment. Industry adoption is accelerating—35% of organizations are expected to implement AI-driven talent mobility by 2025. Current market leaders (Workday 15.7%, SAP 11.6%, Oracle 14%) focus on skills matching but miss the behavioral and success pattern dimensions.

### The Problem

EY loses talented employees to competitors because internal opportunities remain invisible, while hiring managers default to external recruiting because finding qualified internal candidates is difficult and time-consuming. This costs EY 3-5x more per hire while eroding institutional knowledge and employee engagement.

Traditional HR systems fail because:

- **Keyword matching is broken** - "cloud architecture" vs "AWS/Azure" creates missed matches
- **Black box recommendations lack actionability** - "You're 73% match" means nothing without explaining the gaps
- **Skills-only focus ignores career reality** - advancement requires visibility, behaviors, and patterns, not just technical competencies

### The Solution

SpringAIS solves this through three breakthrough innovations:

1. **Semantic AI Matching** - GPT-5.2 vector embeddings understand skill relationships beyond keywords
2. **Dual LLM Validation** - Extract skills WITH evidence quotes, then validate—eliminating hallucinations with explainable AI
3. **Success Pattern Analysis** - The insight competitors miss: what ACTUALLY drives advancement across six metric categories (financial, compliance, quality, development, people, feedback themes)

### What Makes This Special

**The "holy shit" moment:** An employee exploring a Manager role sees the Success Pattern overlay: _"Employees who advanced to Manager typically showed 87% effective utilization (you: 78%), 2+ mentees (you: 0), feedback themes emphasizing leadership..."_ Suddenly, vague career advice becomes a concrete, motivating action plan.

**The contrarian bet:** Skills alone don't drive advancement. Behaviors, visibility, and patterns matter equally—and no competitor captures this. SpringAIS does.

## Project Classification

| Attribute           | Value                                  |
| ------------------- | -------------------------------------- |
| **Technical Type**  | SaaS B2B Platform                      |
| **Domain**          | Enterprise HR Tech / Talent Management |
| **Complexity**      | High                                   |
| **Project Context** | Greenfield - new project               |

**Complexity Drivers:**

- AI/LLM integration with dual validation pattern
- Privacy-first architecture with tokenization (EMP-482910)
- Bias mitigation and fairness monitoring requirements
- Multi-system integration (SuccessFactors, Credly, O\*NET)
- Three distinct user types with separate workflows (Employee, Hiring Manager, Admin)
- 8-week competition timeline with full feature scope

## Success Criteria

### User Success

**Primary Success Metric:** Users receive clear, actionable, evidence-backed feedback about their career position and development path.

**What "good feedback" looks like:**

- Every inferred skill shows the supporting evidence quote + confidence level
- Match results explain WHY (reason codes, not just percentages)
- Gap analysis shows exactly what's missing and how long it takes to close
- Success Pattern comparison gives concrete benchmarks: "You're at X, advanced employees were at Y"
- Upskilling path provides sequenced, time-estimated actions

**User Success Indicators:**

- User understands their current skills with confidence (evidence-backed)
- User discovers 2+ opportunities they didn't know existed
- User has a clear 12-week action plan with rationale for each step
- User knows how they compare to successful advancement patterns
- User feels motivated, not discouraged, by the feedback

### Business Success

**For EY (if adopted):**

- Internal fill rate: +10-20% lift in priority skill clusters
- Time-to-fill reduction: 60 → 30 days for internal hires
- Regretted attrition: -2 to -5 percentage points
- External recruiting cost avoidance: measurable $ impact

**For this project:**

- All 5 epics completed within 8-week timeline
- Complete employee workflow functional end-to-end
- Complete hiring manager workflow functional end-to-end
- Complete admin workflow functional end-to-end
- System provides meaningful, defensible feedback (not placeholder data)

### Technical Success

**Core Technical Requirements:**

- Dual LLM validation working (extract + validate with quotes)
- Pure vector semantic matching operational (Chroma + text-embedding-3-large)
- Success pattern analysis across 6 metric categories
- Career Journey Map visualization renders correctly (React Flow)
- Anonymous matching with tokenization functional
- Audit logging captures all sensitive operations

**Performance Benchmarks:**

- Chroma vector queries: <350ms p95 (demo scale), <50ms p95 with Qdrant (production)
- Cached skill inference: <3s (semantic cache hit)
- Uncached skill inference: <15s (full dual LLM pipeline)
- Role matching: <2s for top-10 results
- 0 crashes during operation
- Deterministic outputs (same input → consistent results)

### Measurable Outcomes

| Outcome                   | Target                             | Measurement                      |
| ------------------------- | ---------------------------------- | -------------------------------- |
| Skill extraction accuracy | >85%                               | Manual review of 10 test resumes |
| Evidence quote relevance  | 100% quotes support inferred skill | Dual LLM validation pass rate    |
| Match quality             | Top 5 matches are sensible         | Manual review per test profile   |
| Feedback clarity          | User understands next steps        | Qualitative assessment           |
| Epic completion           | 5/5 epics                          | Sprint tracking                  |
| Timeline adherence        | 8 weeks                            | Calendar                         |

## Product Scope

### MVP - All Epics (8 Weeks)

**Epic 1: Authentication & Infrastructure**

- Docker + docker-compose deployment
- FastAPI backend + PostgreSQL schema
- React frontend + shadcn/ui
- User authentication (login, roles)

**Epic 2: AI Skill Inference Pipeline**

- Document upload (resume, badges, certs)
- Dual LLM validation (extract + validate with quotes)
- Confidence scoring
- Vector embeddings generation

**Epic 3: Matching Engine**

- Chroma vector database integration
- Semantic similarity matching
- Match scoring with confidence intervals
- Multi-mode discovery (Best Fit, Stretch, Exploratory, Trending)

**Epic 4: Career Journey Map & Visualization**

- React Flow skill tree
- Success Pattern overlay (6 metric categories)
- Career Competitiveness Dashboard
- Progress path visualization

**Epic 5: Upskilling, Governance & Two-Sided Matching**

- Skill gap analysis + upskilling paths
- Hiring manager workflow (post role, see matches, opt-ins)
- Admin workflow (audit logs, fairness dashboard)
- Anonymous matching with mutual opt-in

### Growth Features (Post-MVP)

- Real EY data integration (SuccessFactors, Credly APIs)
- Production infrastructure (Kubernetes, multi-region)
- Mobile apps (iOS/Android)
- Multi-language support (49 languages)

### Vision (Future)

- Proof-of-work verification (project history, contribution graphs)
- Predictive analytics (attrition risk, skill gap forecasting)
- Advanced bias mitigation with third-party auditing
- Market expansion beyond EY

## User Journeys

### Journey 1: Maya R. - From Invisible Progress to Promotion Clarity

Maya is a Senior Consultant in Technology Consulting with 3.5 years at EY. She's a strong performer—her clients love her, her utilization is solid, and she consistently delivers. But when it comes to the Manager promotion she's been targeting for 18 months, she feels stuck. Her counselor says she needs "more visibility" and "leadership experience," but what does that actually mean? She watches peers get promoted and wonders what they did differently.

One Sunday evening, instead of her usual anxiety spiral about career progress, Maya opens SpringAIS and uploads her resume, her Credly badges, and a few project descriptions. Within seconds, she sees her skills extracted with evidence quotes: _"Inferred 'cloud architecture' from: 'Led migration of client's on-premise infrastructure to AWS, reducing costs by 40%'"_—and she realizes the system actually understands what she's done.

She clicks on a Manager role in her practice and sees something she's never seen before: the Success Pattern overlay. _"Employees who advanced to Manager typically showed: 87% effective utilization (you: 78%), 2+ active mentees (you: 0), feedback themes emphasizing 'leadership' and 'client management' (you: strong on 'technical depth', opportunity on 'leadership')."_

The breakthrough hits her: she's been optimizing for the wrong things. She's been heads-down on delivery while missing the visibility moves that actually matter. The Career Journey Map shows her exactly what to do: request 2 mentees from the Staff pool (2 weeks to set up), lead an internal community initiative (ongoing, 2-3 hrs/week), and complete a stakeholder management course (6 weeks).

Three months later, Maya enters her annual review with evidence. Her effective utilization is up to 84%. She has two mentees who've given her glowing upward feedback. Her counselor sees "leadership" appearing in her feedback themes for the first time. She's no longer guessing—she knows she's on track.

**Capabilities revealed:** Document upload, dual LLM skill extraction with evidence, role matching, Success Pattern overlay, Career Competitiveness Dashboard, Career Journey Map, upskilling path generation, progress tracking.

---

### Journey 2: Chris L. - The Anonymous Pivot Explorer

Chris is a Staff 2 in Audit with 1.8 years at EY. He's a solid performer, but deep down he knows Audit isn't his long-term path. He's curious about Tech Risk or Advisory—roles that seem more aligned with his interest in technology—but he's terrified. What if his senior manager finds out he's looking? What if he gets labeled as "not committed"? So he stays quiet, does his work, and privately wonders if he should just leave EY entirely.

Then he hears about SpringAIS from a friend who used it to explore a lateral move. The key selling point: anonymous exploration. Chris uploads his resume late one night, carefully reviewing the extracted skills. He's surprised—the system recognizes that his Audit experience translates to "risk assessment," "control testing," and "compliance frameworks." Skills he didn't realize were transferable.

He switches to Exploratory mode and sees something unexpected: 5 roles in Tech Risk and Data Analytics that show 55-68% match. The system explains the gaps clearly: _"Missing: Python programming (Bronze badge, ~3 months), Data visualization tools (Tableau certification, ~6 weeks)."_ These aren't insurmountable walls—they're achievable bridges.

The anonymous matching kicks in. Chris opts into a Tech Risk role that caught his interest. On the hiring manager's side, they see: "EMP-847291 (64% match) has expressed interest. Strengths: Strong compliance background, SOX experience. Gaps: Python, data tools. Recommended path: 4-month upskilling."

Chris never revealed his identity until he was ready. When the hiring manager invited him for a conversation, Chris felt confident—he knew his gaps, had already started closing them, and had a credible story. Six months later, he's a Senior in Tech Risk, and he never had to leave EY to find the career he wanted.

**Capabilities revealed:** Anonymous profile creation, skill translation across service lines, Exploratory matching mode, gap analysis with time estimates, two-sided anonymous matching, mutual opt-in flow, identity reveal on user's terms.

---

### Journey 3: Alex P. - Staffing at the Speed of Business

Alex is a Senior Manager in Cloud Transformation leading a rapidly growing practice. His problem isn't finding work—it's finding people. Every week brings new project starts, and every week he's scrambling. Internal staffing feels like shouting into a void: he posts roles, gets a trickle of responses, interviews people who look good on paper but lack depth, and eventually defaults to external recruiting. It costs 3x more and takes 2x longer, but at least he gets bodies.

Monday morning, Alex posts a new role in SpringAIS: Senior Consultant, Cloud Architecture, AWS/Azure, client-facing. Within 2 hours—not 2 weeks—he sees: "12 potential matches identified across 4 service lines." He doesn't see names yet, just aggregate data: skill distribution, experience levels, availability signals.

By Wednesday, 5 employees have opted in. Alex reviews tokenized profiles: "EMP-482910 (78% match). Strengths: AWS Solutions Architect certified, 3 years client delivery, strong client management feedback. Gaps: Azure exposure (minor). Success Pattern: 85% effective utilization, 2 mentees, 'leadership' feedback theme." He can see quality signals without seeing private performance reviews.

He invites 3 candidates for conversations. All 3 are internal EY employees he'd never have found through traditional channels—one from Audit (surprise skill match), one from a different geography, one from GDS who'd been invisible to him. He staffs the role in 18 days instead of his usual 45.

The real win: the candidate from Audit transitions smoothly, already understands EY culture, and is billable in week 2 instead of month 2. Alex stops reflexively reaching for external recruiters.

**Capabilities revealed:** Role posting with requirements, anonymous candidate discovery (count only), skill distribution analytics, employee opt-in flow, tokenized candidate review, reason codes and quality signals, match confidence with gaps, interview coordination, time-to-fill tracking.

---

### Journey 4: Sonia K. - Governance Without Guesswork

Sonia is the DEI & Compliance Officer responsible for ensuring SpringAIS doesn't become a liability. She's seen too many AI tools promise "unbiased matching" and deliver encoded historical discrimination. Her job is to verify, not trust. If SpringAIS can't prove it's fair, she'll shut it down.

Her first action: pull the audit logs. She sees every sensitive operation recorded—who accessed what data, when, and why. The tokenization is working: she can see that 847 employees explored roles last month without seeing their names. She can verify that hiring managers only saw identities after mutual opt-in.

Next: the fairness dashboard. She runs the disparate impact analysis: recommendation rate by demographic group (where legally collected), opt-in rates, interview-to-offer ratios. The system shows her parity metrics with statistical significance indicators. One metric catches her attention: opt-in rates for one demographic are 15% lower than baseline. The system flags this and suggests investigation—maybe the role descriptions use language that's inadvertently exclusionary?

She digs deeper. The decision logging shows her exactly why each match was made: skill vectors, match percentages, reason codes. No black box. When a hiring manager asks "why wasn't Employee X surfaced for my role?", Sonia can pull the decision record and explain: "72% match, but below the 75% threshold for 'High Confidence' tier. They appeared in 'Medium Confidence' but didn't opt in."

Quarterly, Sonia presents to leadership: "SpringAIS processed 2,400 matches last quarter. Fairness metrics are within acceptable ranges. We identified one potential bias in role language and remediated. Audit trail is complete. Recommend continued operation."

**Capabilities revealed:** Comprehensive audit logging, tokenization verification, fairness dashboard with parity metrics, disparate impact analysis, decision logging with reason codes, bias investigation tools, compliance reporting, "patterns not promises" language enforcement.

---

### Journey Requirements Summary

| Journey                 | Primary Capabilities Required                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| Maya (Promotion Seeker) | Skill extraction, evidence quotes, role matching, Success Pattern overlay, Career Journey Map, upskilling paths |
| Chris (Career Pivoter)  | Anonymous exploration, skill translation, Exploratory mode, gap analysis, two-sided anonymous matching          |
| Alex (Hiring Manager)   | Role posting, candidate discovery, opt-in management, tokenized review, quality signals, time-to-fill tracking  |
| Sonia (Compliance)      | Audit logging, fairness dashboard, decision records, bias detection, compliance reporting                       |

## Innovation & Novel Patterns

### Detected Innovation Areas

SpringAIS introduces four genuinely novel patterns that differentiate it from existing talent mobility solutions:

**1. Dual LLM Validation Pattern**

Traditional skill extraction from resumes suffers from hallucination—AI systems confidently infer skills that aren't actually supported by the document. SpringAIS solves this with a two-pass validation:

- **LLM #1 (Extraction):** Extracts skills AND the exact quote that supports each inference
- **LLM #2 (Validation):** Independently verifies the quote actually supports the skill claim
- **Output:** Confidence scores (high/medium/low) for every skill, with human-readable evidence

**Multi-Skill Extraction:** A single quote can generate multiple skills. The system is not limited to 1-to-1 quote-to-skill mapping. For example:

- Quote: _"Built Python data pipeline processing 2M records daily using Apache Spark"_
- Extracted Skills: "Python" + "Data Pipeline Architecture" + "Big Data Processing" + "Apache Spark"
- Each skill is independently validated by LLM #2 against the same quote

This comprehensive extraction ensures employees receive full credit for all demonstrated competencies, and skills are not artificially limited by quote boundaries.

_Why it matters:_ Employees and hiring managers can trust the inferences because they can see the proof. "Inferred Python expertise because resume states: 'Built data pipeline processing 2M records daily using Python and Apache Spark.'"

**2. Success Pattern Analysis (The Breakthrough Insight)**

Existing platforms match skills to job requirements. But skills alone don't drive advancement—behaviors, visibility, and patterns matter equally. SpringAIS captures what actually predicts success across six metric categories:

| Category    | What It Captures                         | Example Pattern                                         |
| ----------- | ---------------------------------------- | ------------------------------------------------------- |
| Financial   | Utilization, billable hours, realization | "Advanced employees averaged 87% effective utilization" |
| Compliance  | Timesheet, CPE hours, policy adherence   | "95%+ timesheet compliance typical"                     |
| Quality     | Engagement ratings, technical excellence | "4.2+ engagement ratings common"                        |
| Development | Learning hours, mentoring participation  | "2+ active mentees typical"                             |
| People      | Upward feedback, team scores             | "Leadership theme in 80% of feedback"                   |
| Feedback    | NLP theme analysis                       | "Client management" as recurring theme                  |

**Success Pattern Benchmarks by Target Level:**

| Target Level     | Utilization | Mentees   | Primary Feedback Theme  | CPE Hours | Badges      | Timesheet |
| ---------------- | ----------- | --------- | ----------------------- | --------- | ----------- | --------- |
| → Senior         | 90%+        | 0         | "Technical depth"       | 40+       | 1+ Bronze   | 95%+      |
| → Manager        | 85%+        | 1-2       | "Leadership emerging"   | 40+       | 1+ Silver   | 95%+      |
| → Senior Manager | 80%+        | 2+        | "Client management, BD" | 40+       | 1+ Gold     | 95%+      |
| → Partner        | 70%+        | Portfolio | "Strategic, rainmaker"  | 40+       | 1+ Platinum | 95%+      |

**Key Insight:** Utilization targets _decrease_ as seniority increases—reflecting the shift from billable delivery to business development, people leadership, and strategic activities. The model must account for this inverse relationship.

**Utilization Calculation Method:**

- All utilization targets refer to **effective utilization**, which accounts for time off
- **Effective utilization formula:** Hours charged to clients / (40 hours - non-work hours like PTO, holidays, sick time)
- **Full utilization** (hours charged / 40 hours) is not used for performance evaluation
- Example: An employee charging 38 hours/week with 2 hours PTO has 95% effective utilization (38/40), not 100% full utilization

**Realization Rate:**

- **Definition:** Total amount invoiced / Total labor charged for a job
- **Target Range:** Large accounting firms typically have realization in low 80% range (80-85%)
- **Relevance:** Manager+ levels are measured on engagement profitability (realization), not just utilization
- **Use in Success Patterns:** Track realization rate for Manager and above roles as indicator of engagement economics management

_Why it matters:_ Maya stops guessing what "visibility" means. She sees exactly what employees who advanced actually did.

**EY Performance Cycle Alignment:**

- Fiscal year: July 1 - June 30 (annual performance cycle)
- Promotion windows: Twice per year (August regular cycle, January agile promotions)
- Calibration sessions: Late May/June - decisions made ~3 months before promotion date
- Agile promotions: For rank changes only (Staff→Senior, Senior→Manager, Manager→SM)
- LEAD framework: Underlying competency model launched in 2018, encourages frequent feedback
- Minimum time-in-role: ~12 months before promotion eligibility (practical requirement)
- Track record window: New hires need 90+ days of work history before calibration decisions

**3. Pure Vector Semantic Matching**

Traditional HR systems use keyword matching, which breaks constantly:

- "Cloud architecture" doesn't match "AWS/Azure"
- "C#" doesn't match "csharp" or "C Sharp"
- No understanding that React expertise implies JavaScript knowledge

SpringAIS uses **text-embedding-3-large** for semantic skill vectorization. GPT-5.2 handles skill extraction and text generation; text-embedding-3-large handles vectorization. Skills that are semantically related cluster together in vector space.

**Per-Skill Embedding Architecture:** Each extracted skill is independently embedded into a 3072-dimensional vector using text-embedding-3-large. This is NOT a per-resume embedding—each skill gets its own vector:

- "Python" → 3072-dimensional vector
- "Data Pipeline Architecture" → 3072-dimensional vector
- "AWS Solutions Architect" → 3072-dimensional vector

**Proficiency Context:** Proficiency differences (junior Python vs senior Python) are captured through aggregate skill profile matching, not encoded into individual skill vectors. An employee's proficiency level emerges from the full set of extracted skills (e.g., "8-Years-Experience", "Large-Dataset-Handling", "Data-Architecture") combined with the skill vector itself.

**Caching Advantage:** Skill vectors are cached and reused across employees. If 500 employees have "AWS" extracted from their resumes, the system embeds "AWS" once and reuses that vector 500 times. This enables:

- Massive caching efficiency (compute once, reuse indefinitely)
- Precise skill-to-skill matching (not resume-to-role-description)
- Granular reason codes ("You matched on AWS at 92%, but Kubernetes at 30%")
- Skill translation across service lines (compare Audit "risk assessment" vector to Tech Risk "compliance frameworks" vector)

**Pre-Cached Common Skills:** System maintains a pre-embedded cache of ~250 common EY skills (Python, Java, AWS, Leadership, Mentoring, Risk Assessment, etc.). These are embedded once during setup and reused indefinitely. Novel/uncommon skills are embedded on-demand and added to cache.

_Why it matters:_ Alex finds candidates with "AWS architecture" experience when searching for "cloud infrastructure"—without maintaining endless synonym lists. And the system does this efficiently at scale through intelligent caching of common skills.

**Synonym Handling:** The LLM normalizes during extraction (e.g., "js" → "JavaScript", "c#" → "C#"). If duplicates slip through (both "JavaScript" and "js" extracted separately), that's acceptable—they'll cluster very close together in vector space (~0.95+ similarity) and effectively behave as the same skill during matching. No additional deduplication system is required.

**4. Two-Sided Anonymous Matching**

The fear of being discovered exploring internal opportunities prevents employees from even looking. SpringAIS implements privacy-first architecture:

- Employees explore roles anonymously (manager never knows)
- Hiring managers see candidate counts and aggregate skill distributions, not identities
- Employees opt-in to specific roles, revealing only a token (EMP-482910)
- Identity revealed only after hiring manager invites conversation

_Why it matters:_ Chris explores Tech Risk roles without his Audit manager ever knowing—until he's ready to make a move.

**5. Aggregate Matching Algorithm**

Matching is NOT individual skill-to-requirement comparison. It's **employee's full skill profile vs role's full requirement profile**, producing an aggregate match score per role.

**The Matching Matrix:**

```
Employee Skills:        [Python, AWS, Communication, Data Pipeline]
Role Requirements:      [Python, AWS, Leadership, Cloud Architecture]

                    Python(req)  AWS(req)  Leadership(req)  Cloud Arch(req)
Python(emp)            95%         15%         10%              20%
AWS(emp)               15%         92%         8%               45%
Communication(emp)     5%          5%          35%              5%
Data Pipeline(emp)     20%         30%         5%               60%

Aggregate Role Match = function of best matches per requirement
```

**Threshold-Based Search (Not Top-K):**

The system uses threshold-based search rather than arbitrary top-K limits:

- Search ALL role vectors above similarity threshold (≥30% for Exploratory mode)
- Never artificially truncate results—if the 50th and 51st matches are both 70%, show both
- Sort by aggregate match percentage, filter by discovery mode tier
- Accept 2-3 second search latency for comprehensive results (don't prematurely optimize)

**Discovery Mode Thresholds:**

| Mode | Threshold | Purpose |
|------|-----------|---------|
| Best Fit | ≥75% | Roles employee is highly qualified for |
| Stretch | 50-74% | Roles requiring growth but achievable |
| Exploratory | 30-49% | Career pivots, hidden opportunities |
| Trending | N/A | Emerging high-demand roles (separate logic) |

**Two Parallel Processes:**

SpringAIS runs two separate analyses that combine for the full picture:

| Process | Question Answered | Data Source |
|---------|-------------------|-------------|
| **Vector Matching** | "What roles could you DO based on skills?" | Extracted skills vs role requirements |
| **Success Pattern Analysis** | "Will EY actually PROMOTE you to that level?" | EY metrics vs advancement benchmarks |

Both are required. An employee could have perfect skill match for a Manager role but never get promoted due to low utilization and no mentees. Conversely, perfect EY metrics don't help if you lack the technical skills for a specific role.

**6. Natural Progression & Trajectory Comparison**

The system always shows the employee's natural EY progression (next level in their career ladder), regardless of match threshold. This is combined with trajectory analysis to show full career paths.

**Natural Progression States:**

| State | Match to Next Level | UI Behavior |
|-------|---------------------|-------------|
| **Aligned** | ≥75% | Single "Your Path" view, celebratory, show remaining gaps |
| **Stretch** | 50-74% | "Your path is a stretch" with gap closure timeline |
| **Misaligned** | <50% | Honest assessment + prominently surface better alternatives |

**Always Show Natural Progression:** The employee's next EY level bypasses match thresholds because:

- EY will evaluate them for that level whether they match or not
- Hiding it doesn't make the expectation go away
- The value is showing gaps honestly so they can decide

**Trajectory-Based Path Comparison:**

When alternatives exist (especially high-match lateral moves), the system shows FULL trajectories, not just immediate next steps:

```
PATH A: Natural Progression (Stay in Current Track)
├─ Current: Manager
├─ Step 1: Senior Manager (78% match)
│   └─ Gaps: [Business Development, Client Management]
├─ Step 2: Partner (70% match)
│   └─ Gaps: [Rainmaking, Strategic Relationships]
└─ Trajectory: Strong throughout

PATH B: Lateral Move to Analytics
├─ Current: Manager
├─ Step 1: Manager, Analytics (85% match) ← Lateral, high fit
│   └─ Gaps: [Minimal]
├─ Step 2: Senior Manager, Analytics (40% match) ⚠️ Wall
│   └─ Gaps: [Significant - Analytics Domain Expertise, Statistical Methods]
├─ Step 3: Partner, Analytics (??% match)
└─ Trajectory: Easy entry, but hits wall at SM level
```

**When to Show Alternatives:**

- Natural progression is misaligned (<50% match)
- OR a lateral move has equally high match (≥75%) even when natural progression is aligned
- Always show trajectory for each path so employee can make informed career decision

**Walls and Blockers:**

Flag any step in a trajectory with <50% match as a "wall." This helps employees understand:

- Path B might be easier NOW but harder LATER
- Path A might be harder NOW but smoother LONG-TERM
- Some lateral moves open better trajectories; others are dead ends

### Validation Approach

| Innovation               | Validation Method                                       | Success Criteria                                        |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------------------- |
| Dual LLM Validation      | Test with 10 diverse resumes, manual review             | 100% of evidence quotes support inferred skills         |
| Success Pattern Analysis | Compare synthetic "advanced" vs "not advanced" profiles | Patterns clearly differentiate advancement trajectories |
| Vector Semantic Matching | Test synonym pairs, skill hierarchies                   | Related skills cluster correctly in vector space        |
| Anonymous Matching       | End-to-end flow testing                                 | Identity never exposed before mutual opt-in             |

### Risk Mitigation

| Innovation               | Primary Risk            | Mitigation Strategy                                       |
| ------------------------ | ----------------------- | --------------------------------------------------------- |
| Dual LLM Validation      | Cost (2x LLM calls)     | Aggressive caching, batch processing                      |
| Success Pattern Analysis | Encoded historical bias | "Patterns not promises" language, fairness monitoring     |
| Vector Semantic Matching | Unexpected matches      | Confidence thresholds, human review for edge cases        |
| Anonymous Matching       | Privacy breach          | Audit logging, tokenization verification, access controls |

### Bias Testing & Fairness Framework

**Measurement Methodologies:**

- **Four-Fifths Rule:** Selection rate for any protected group must be ≥80% of highest group
- **Disparate Impact Analysis:** Statistical testing across demographic dimensions (where legally collected)
- **Recommendation Parity:** Match rates monitored by demographic group with significance testing
- **Opt-in Rate Equity:** Track if certain groups opt-in at lower rates (may indicate exclusionary language)

**Hallucination Prevention (Beyond Dual LLM):**

- Evidence quotes are REQUIRED—no inference without supporting text
- Validation LLM explicitly checks quote-to-skill logical connection
- Confidence thresholds: LOW confidence skills flagged for human review
- Zero tolerance: if validation fails, skill is NOT inferred (fail safe)

**Cost Monitoring:**

- Per-request cost tracking in audit logs
- Alert thresholds: >$0.50/inference triggers review
- Weekly cost reports for API usage patterns
- Caching effectiveness metrics (target: >60% cache hit rate)

**Bias Investigation Workflow:**

1. Flag triggered (parity metric deviation >10%)
2. Automated data pull for affected recommendations
3. Decision record review (which features drove the outcome?)
4. Root cause analysis (data bias vs. model bias vs. process bias)
5. Remediation action + re-test validation

### Regulatory Compliance Framework

**Federal Employment Law Alignment:**

- Title VII (Civil Rights Act): No discrimination in recommendations
- FCRA: If background data used, disclosure requirements apply
- ADEA: Age cannot be factor in matching algorithms
- ADA: Accessibility in UI, no disability-based filtering

**Emerging AI Regulations:**

- **NYC Local Law 144:** Bias audits required for automated employment decision tools
- **Illinois HB 3773:** AI video interview consent and explanation requirements
- **California SB 1100:** Restrictions on AI in employment decisions
- **EU AI Act:** High-risk classification for employment AI (future consideration)

**Privacy Regulations:**

- GDPR Article 22: Right to explanation for automated decisions
- CCPA/CPRA: Data access and deletion rights
- Employee consent for data processing documented

**Compliance Approach:**

- "Patterns not promises" language throughout (recommendations, not decisions)
- Human-in-the-loop for all final decisions (AI assists, doesn't decide)
- Full audit trail for regulatory inspection
- Bias audit documentation maintained (NYC LL144 ready)

## Career Progression Model

SpringAIS must accurately model EY's career progression to provide meaningful recommendations. This section defines the data model for career trajectories.

### Career Hierarchy

All EY business units follow the same fundamental structure:

**Staff → Senior → Manager → Senior Manager → Partner/Executive Director**

| Destination                 | Description                                                                |
| --------------------------- | -------------------------------------------------------------------------- |
| **Partner**                 | Equity owner, typically requires CPA credential, ~$500K-$1M+ compensation  |
| **Executive Director (ED)** | Non-equity employee role, similar authority, ~$400-500K, terminal for ~90% |

### Progression Timelines by Business Unit

| Business Unit                    | Staff→Senior              | Senior→Manager | Manager→SM | SM→Partner/ED  |
| -------------------------------- | ------------------------- | -------------- | ---------- | -------------- |
| **Consulting**                   | ~2 years                  | 2-3 years      | 2-4 years  | 4-8 years      |
| **Tax**                          | 2-3 years                 | 2-3 years      | 3-4 years  | 6-8 years      |
| **Assurance/Audit**              | 3 years (until qualified) | 2-3 years      | 3 years    | 2-5+ years     |
| **Strategy & Transactions**      | 2 years                   | 2-3 years      | 2-3 years  | 3-7 years      |
| **CBS (Core Business Services)** | ~2 years                  | ~3 years       | ~3 years   | Director track |

**EY-Parthenon Exception:** Uses different titles - Associate (2 years) → Senior Associate (1 year) → Consultant (2 years) → Director (2-3 years) → Senior Director (3-7 years) → Partner

**System Handling:** SpringAIS must detect EY-Parthenon employees (via business unit/service line field) and apply the appropriate career hierarchy. The system maintains two progression models:

- Standard EY progression: Staff → Senior → Manager → Senior Manager → Partner/ED
- EY-Parthenon progression: Associate → Senior Associate → Consultant → Director → Senior Director → Partner

### Role Expectations by Level

| Level              | Primary Focus                                 | Key Metrics                                      | Advancement Signal                          |
| ------------------ | --------------------------------------------- | ------------------------------------------------ | ------------------------------------------- |
| **Staff**          | Learning, task execution                      | Effective utilization 95%+, skill development    | Curiosity, ownership, quick learning        |
| **Senior**         | Project management, coaching juniors          | Effective utilization 90%+, technical depth      | Managing others, site leadership            |
| **Manager**        | Multiple projects, client communication       | Effective utilization 85%+, engagement economics | People management, delivery quality         |
| **Senior Manager** | Client relationships, sales, team development | Effective utilization 80%+, revenue generation   | BD capability, client trust                 |
| **Partner**        | Practice leadership, rainmaking               | Effective utilization 70%+, book of business     | Strategic relationships, thought leadership |

**Note:** All utilization percentages refer to effective utilization (accounts for PTO, holidays, sick time). See "Utilization Calculation Method" in Success Pattern Analysis section for details.

### High Performer Exceptions (Skip Promotions)

The model should account for accelerated advancement:

- At EY, high performers may skip rank levels (e.g., Staff 1 → Staff 2 → Sr 1 → Sr 2 → Manager, skipping Sr 3)
- More common in human capital/management consulting than technical/cyber roles
- Skip promotions can occur at the standard 12-month minimum time-in-role requirement (not 18 months)
- The "skip" refers to skipping rank progression levels, not the time requirement itself
- Requires: Performance rating ≥4.5, effective utilization ≥95%, 2+ Gold badges, active sponsor

## Promotion Eligibility Rules

The recommendation engine must enforce these rules when suggesting promotion readiness:

### Eligibility Criteria

```
promotion_eligibility = {
    "minimum_time_in_role_months": 12,
    "promotion_windows": ["January", "August"],
    "track_record_window_days": 90,
    "agile_promotion_eligible_transitions": [
        "Staff → Senior",
        "Senior → Manager",
        "Manager → Senior Manager"
    ]
}
```

### Promotion Window Logic

| Window      | Timing  | Type              | Notes                                           |
| ----------- | ------- | ----------------- | ----------------------------------------------- |
| **Regular** | August  | All promotions    | Main annual cycle, aligned with fiscal year end |
| **Agile**   | January | Rank changes only | 7.5% raise at agile, remainder at August        |

### Calibration Timeline

- **Late May/June**: Calibration sessions held, promotion decisions made
- **August**: Regular promotions effective
- **January**: Agile promotions effective (moved from May)
- **Implication**: Employees hired after March may miss the next promotion cycle

### Skip Promotion Criteria

```
skip_promotion_eligible = (
    performance_rating >= 4.5 AND
    effective_utilization >= 95% AND
    badges_gold_or_higher >= 2 AND
    has_sponsor == True AND
    time_in_role_months >= 12  # Standard minimum, skip refers to rank levels not time
)
```

## Success Factors Beyond Metrics

Research indicates that Big Four promotions depend significantly on factors beyond pure performance metrics. The model should capture these "soft factors":

### The Sponsor Factor

**Critical Finding:** "Big Four promotions depend more on politics and your boss having your back than your performance."

| Factor       | What It Means                                 | How to Model                                            |
| ------------ | --------------------------------------------- | ------------------------------------------------------- |
| **Sponsor**  | Someone who advocates for you in calibration  | Count of senior relationships, upward feedback requests |
| **Mentor**   | Someone who guides your development           | Formal mentor assignment, meeting frequency             |
| **Champion** | Partner who will "fight for you" in committee | Cross-project senior relationships                      |

**Model Recommendation:** Track `sponsor_score` based on:

- Number of upward feedback requests sent
- Relationships with senior managers/partners across projects
- Participation in sponsor/mentee programs

### Visibility Moves

| Visibility Action                  | Impact     | Time Investment      |
| ---------------------------------- | ---------- | -------------------- |
| Lead internal community initiative | High       | 2-3 hrs/week ongoing |
| Publish thought leadership content | High       | 4-8 hrs per piece    |
| Present at internal events         | Medium     | 2-4 hrs per event    |
| Mentor junior staff                | Medium     | 1-2 hrs/week         |
| Participate in recruiting          | Low-Medium | Variable             |

**Model Recommendation:** Track `visibility_score` based on internal initiative participation, content creation, and recognition patterns.

### Personal Brand

**Key Insight:** "Every business case from a prospective partner mentions their strong brand and how they are the 'Go-To Expert' for some technical specialism."

- Specializing earlier rather than later accelerates advancement
- Being known as a 'Go-To Expert' for specific domain knowledge
- Badge specialization patterns indicate developing expertise

**Model Recommendation:** Track `specialization_score` based on badge concentration in specific domains and recognition as subject matter expert.

### The Politics Reality

The model should surface this reality transparently:

> "Your fate is decided by a collective deliberation in a closed room. The committee doesn't just read your review. They debate you, question your potential, and compare you. This is where merit ends, and politics enters."

**Implications for SpringAIS:**

- Show "sponsor gap" prominently if user lacks senior advocates
- Recommend specific actions to build internal network
- Never guarantee promotion outcomes—only show patterns

## Service Line Translation

When employees explore career pivots across service lines, the model must translate skills appropriately.

### Audit → Tech Risk/Advisory Translation

| Audit Skill                  | Translates To               | Match Confidence |
| ---------------------------- | --------------------------- | ---------------- |
| Risk assessment              | Cybersecurity risk, IT risk | High             |
| Control testing              | IT controls, data analytics | High             |
| Compliance frameworks        | Regulatory technology, GRC  | High             |
| SOX experience               | IT Audit, internal audit    | High             |
| Financial statement analysis | Data analytics, FP&A        | Medium           |
| Client communication         | Consulting delivery         | Medium           |

### Tax → Advisory Translation

| Tax Skill                 | Translates To            | Match Confidence |
| ------------------------- | ------------------------ | ---------------- |
| Research & analysis       | Strategy research        | Medium           |
| Client advisory           | Consulting delivery      | High             |
| Regulatory interpretation | Compliance consulting    | High             |
| International tax         | Global mobility advisory | High             |
| Transaction structuring   | M&A advisory             | Medium           |

### Consulting → Other Service Lines

| Consulting Skill         | Translates To           | Match Confidence |
| ------------------------ | ----------------------- | ---------------- |
| Project management       | Any service line        | High             |
| Client relationship      | Any service line        | High             |
| Business analysis        | Strategy, Tax advisory  | High             |
| Technical implementation | Technology consulting   | High             |
| Change management        | Any transformation role | Medium           |

### Internal Mobility Program (Mobility4U)

- ~900 employees have started new mobility assignments via Mobility4U
- 4,100+ employees on mobility assignments or one-way transfers
- ~600 unique home/host country combinations
- Fear of discovery is real—anonymous exploration is critical

## SaaS B2B Technical Requirements

### API Architecture

**Protocol:** REST with OpenAPI 3.0 specification

- FastAPI auto-generates OpenAPI docs at `/docs` (Swagger UI) and `/redoc`
- TypeScript client types generated from OpenAPI spec using `openapi-typescript`
- Consistent JSON request/response format with Pydantic validation

**Versioning Strategy:** URL path versioning (`/api/v1/...`)

- Most explicit and debuggable approach
- Easy to run multiple versions in parallel if needed
- Clear deprecation path for future versions

**Core API Endpoints:**

| Endpoint Group      | Purpose           | Key Operations                              |
| ------------------- | ----------------- | ------------------------------------------- |
| `/api/v1/auth`      | Authentication    | Login, logout, token refresh                |
| `/api/v1/employees` | Employee profiles | CRUD, skill upload, profile view            |
| `/api/v1/skills`    | Skill inference   | Upload docs, get extracted skills, validate |
| `/api/v1/matches`   | Role matching     | Get matches, match details, opt-in/out      |
| `/api/v1/roles`     | Role management   | CRUD for hiring managers                    |
| `/api/v1/journeys`  | Career paths      | Get journey map, upskilling paths           |
| `/api/v1/admin`     | Governance        | Audit logs, fairness metrics, reports       |

### Real-Time & Processing Architecture

**On-Demand Processing:**

- Skill inference triggered immediately on document upload
- Results displayed as processing completes (not batch)
- Progress indicators during LLM inference (~5-15 seconds)

**Real-Time Notifications:**

- WebSocket connection for live updates
- Notification types:
  - "You've been matched to a new role" (employee)
  - "New candidate opted in" (hiring manager)
  - "Skill inference complete" (processing feedback)
- Fallback to polling if WebSocket unavailable

### Caching Strategy

**Multi-Layer Aggressive Caching:**

| Cache Layer         | What's Cached                               | TTL        | Reduction                   |
| ------------------- | ------------------------------------------- | ---------- | --------------------------- |
| **Semantic Cache**  | Similar query embeddings → cached responses | 24h        | 68.8% API call reduction    |
| **Prompt Cache**    | Repeated prompt prefixes (>1024 tokens)     | Session    | 90% token cost reduction    |
| **Response Cache**  | Exact skill inference results               | 7 days     | Prevents re-processing      |
| **Embedding Cache** | Generated embeddings per skill/document     | Indefinite | Compute once, store forever |

**Cache Implementation:**

- Redis for response and semantic caching
- LangChain caching layer for LLM responses
- Chroma stores embeddings persistently (no regeneration needed)

**Integrity Safeguards:**

- Cache invalidation on document update
- Version tags on cached responses (model version changes = cache bust)
- Confidence scores stored with cached inferences

### Integration Architecture

**MVP Approach: High-Fidelity Mock Data**

For the 8-week build, use mock data that exactly mirrors real API structures:

**SuccessFactors Mock:**

- OData V4-compatible JSON structure
- Employee profiles matching SuccessFactors Employee Central schema
- Performance metrics matching LEAD framework categories
- Learning records matching SuccessFactors Learning module
- Fiscal year alignment (July-June EY performance cycle)

**EY PX360 Platform Alignment:**

- Mock data reflects PX360's unified employee experience architecture
- Performance review data structured for annual cycle (July-June fiscal year)
- Calibration session outputs (ratings, development recommendations) modeled
- Mobility4U program structure reflected (internal mobility portal patterns)
- Agile promotions framework compatibility (twice-yearly: August regular, January agile)

**PX360 Integration Architecture (Post-MVP):**

- **X-data (Experience Data):** Employee satisfaction surveys, feedback themes, engagement scores from Qualtrics
- **O-data (Operational Data):** Performance metrics, utilization rates, learning hours, compliance data from SuccessFactors
- **Integration Pattern:** SpringAIS would consume both X-data and O-data to provide holistic career insights
- **Use Cases:** Real-time employee experience friction indicators, sentiment analysis for feedback themes, combined operational + experience benchmarking

**Credly Mock:**

- OAuth 2.0-style badge metadata structure
- 5-tier badge levels:
  - **Learning**: Foundational learning modules completed
  - **Bronze**: Beginner experience, core work competency
  - **Silver**: Intermediate experience, growing expertise
  - **Gold**: Subject matter expert, supervisor-level competency
  - **Platinum**: Global expert recognition, physical plaque awarded
- **87 different badges available** across domains: Data Analytics, AI, blockchain, automation, transformational leadership, inclusive intelligence, data visualization, cybersecurity, sustainability, and more
- Skill tags and issue dates per Credly API spec
- Badge verification endpoints
- No sequence required - employees can earn any badge regardless of category

**O\*NET Mock:**

- Skill taxonomy subset (most relevant 500 skills)
- Skill-to-occupation mappings
- Technology skills categories

**Future-Ready Design:**

- Mock data served through same API interface as production would use
- Configuration flag to switch between mock and live data sources
- Data adapters abstract the source (mock vs. real API)
- Fallback strategies: graceful degradation if EY data sources unavailable
- Data lifecycle management: retention policies, employee departure handling

### Deployment Architecture

**Single Laptop Requirement:** Must run entirely via `docker-compose up`

**Container Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    docker-compose                            │
├─────────────┬─────────────┬──────────┬─────────┬────────────┤
│   Frontend  │   Backend   │ PostgreSQL│  Chroma │   Redis    │
│   (React)   │  (FastAPI)  │  + pgvector│ (Vector)│  (Cache)   │
│   :3000     │    :8000    │   :5432   │  :8001  │   :6379    │
└─────────────┴─────────────┴──────────┴─────────┴────────────┘
```

**Hardware Considerations:**

- 3050 Ti GPU (4GB VRAM): Not sufficient for local LLM inference
- All LLM operations via OpenAI API (GPT-5.2 Instant)
- GPU could potentially accelerate local embedding generation (future optimization)
- Primary compute: API calls, not local inference

**Resource Allocation:**

- Backend: 2GB RAM minimum
- Frontend: 512MB RAM
- PostgreSQL: 1GB RAM
- Chroma: 512MB RAM
- Redis: 256MB RAM
- Total: ~4.5GB RAM for full stack

### Explainability UI - Visible Thought Process

**Critical Requirement:** Users must SEE the AI's decision-making process, not just the results.

**Dual LLM Validation Display:**

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Skill Extraction - "Python"                              │
├─────────────────────────────────────────────────────────────┤
│ Step 1: Extraction                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ LLM #1 found skill: "Python"                            │ │
│ │ Evidence quote: "Built data pipeline processing 2M      │ │
│ │ records daily using Python and Apache Spark"            │ │
│ │ Initial confidence: HIGH                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                           ↓                                 │
│ Step 2: Validation                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ LLM #2 validated: ✅ Quote supports inference           │ │
│ │ Reasoning: "Quote explicitly mentions Python usage      │ │
│ │ in production data pipeline context"                    │ │
│ │ Final confidence: HIGH (validated)                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Match Reasoning Display:**

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Match Analysis - "Senior Cloud Architect" (78% match)    │
├─────────────────────────────────────────────────────────────┤
│ WHY THIS MATCH:                                             │
│ ✅ AWS Solutions Architect (required) - MATCHED             │
│ ✅ Cloud migration experience (required) - MATCHED          │
│ ⚠️ Azure experience (preferred) - PARTIAL (AWS only)        │
│ ✅ Client-facing skills (required) - MATCHED                │
│                                                             │
│ GAP ANALYSIS:                                               │
│ • Azure certification would improve match to 85%            │
│ • Estimated time to close: 6-8 weeks                        │
│                                                             │
│ SUCCESS PATTERN COMPARISON:                                 │
│ • Your effective utilization: 78% → Target: 87% (gap: 9%) │
│ • Your mentees: 0 → Typical: 2+ (action needed)            │
│ • Leadership feedback: Emerging → Target: Strong            │
└─────────────────────────────────────────────────────────────┘
```

**UI Components for Thought Process:**

- Collapsible "Show reasoning" panels on every inference
- Step-by-step processing visualization during inference
- Confidence meters with explanation tooltips
- "Why this recommendation?" buttons throughout
- Audit trail accessible from any decision point

### RBAC Matrix

| Capability                | Employee | Hiring Manager | Admin    |
| ------------------------- | -------- | -------------- | -------- |
| View own profile          | ✅       | ✅             | ✅       |
| Upload documents          | ✅       | ❌             | ❌       |
| View skill inferences     | ✅ (own) | ❌             | ✅ (all) |
| Explore roles anonymously | ✅       | ❌             | ❌       |
| View matches              | ✅ (own) | ✅ (opted-in)  | ✅ (all) |
| Opt-in to roles           | ✅       | ❌             | ❌       |
| Post roles                | ❌       | ✅             | ✅       |
| View candidate counts     | ❌       | ✅             | ✅       |
| Invite candidates         | ❌       | ✅             | ✅       |
| View audit logs           | ❌       | ❌             | ✅       |
| View fairness dashboard   | ❌       | ❌             | ✅       |
| Manage users              | ❌       | ❌             | ✅       |

## Functional Requirements

### 1. User Authentication & Profile Management

- FR1: Users can create accounts with role assignment (Employee, Hiring Manager, Admin)
- FR2: Users can authenticate using email/password credentials
- FR3: Users can view and edit their own profile information
- FR4: Employees can upload documents (resume, certifications, project descriptions)
- FR5: Employees can view their Credly badges imported from the system
- FR6: Employees can see their complete skill profile with confidence levels
- FR7: Admins can manage user accounts and role assignments
- FR8: System maintains session state with secure token refresh

### 2. Skill Extraction & Inference

- FR9: System can extract skills from uploaded documents using dual LLM validation
- FR9A: System extracts multiple skills per evidence quote where applicable (e.g., "Built Python data pipeline" → "Python" + "Data Pipeline Architecture")
- FR9B: Skills are not limited by quote boundaries—comprehensive extraction captures all demonstrated competencies
- FR10: System provides evidence quotes for each inferred skill (same quote may support multiple skills)
- FR11: System assigns confidence levels (high/medium/low) to each skill inference
- FR12: Employees can view the reasoning chain for each skill inference
- FR13: Employees can accept, reject, or modify inferred skills
- FR14: System generates a 3072-dimensional vector embedding for each extracted skill using text-embedding-3-large (per-skill, not per-resume)
- FR14A: Skill vectors are cached and reused across employees (embed once, reuse indefinitely)
- FR14B: Matching uses skill-to-skill vector comparison for granular reason codes
- FR14C: System maintains pre-cached vectors for ~250 common EY skills (Python, AWS, Leadership, etc.), embedded once and reused indefinitely
- FR15: System caches inference results to avoid redundant processing

### 3. Role & Opportunity Discovery

- FR16: Employees can browse available roles across all service lines
- FR17: System matches employees to roles using aggregate semantic similarity (full skill profile vs full role requirements)
- FR17A: System calculates aggregate match by comparing all employee skill vectors against all role requirement vectors
- FR17B: System uses threshold-based search (≥30% for Exploratory) rather than arbitrary top-K limits
- FR17C: System accepts 2-3 second search latency to ensure comprehensive results without artificial truncation
- FR17D: If two matches have similar scores (e.g., 70% and 71%), both are shown—no arbitrary cutoffs
- FR18: Employees can view matches in multiple modes (Best Fit ≥75%, Stretch 50-74%, Exploratory 30-49%, Trending)
- FR19: System provides match percentages with confidence intervals
- FR20: Employees can filter and sort role matches by various criteria
- FR21: System explains why each role was matched (reason codes showing per-skill contribution to aggregate score)
- FR22: System identifies skill gaps between employee and role requirements (calculated AFTER matching, not as filter)

### 4. Career Journey Mapping

- FR23: Employees can view an interactive skill tree visualization
- FR24: System displays current skills, required skills, and growth skills distinctly
- FR25: System shows multiple paths to the same target role with full trajectory comparison
- FR25A: Each path shows match percentages at every step (current → next level → future levels)
- FR25B: System flags "walls" when any future step in a trajectory has <50% match
- FR25C: Trajectory comparison enables informed career decisions (easy now vs smooth later trade-offs)
- FR26: Employees can see progress visualization ("50% → 70% if you complete X, Y, Z")
- FR27: System generates personalized upskilling paths with time estimates
- FR27A: Time estimates are generated by LLM based on: EY Badges Learning module durations, O*NET skill acquisition data, and industry-standard certification timelines
- FR28: System recommends specific actions (certifications, courses, experiences)
- FR29: Employees can track progress against their development plan

### 4A. Natural Progression Handling

- FR29A: System ALWAYS displays employee's natural EY progression (next level in career ladder) regardless of match threshold
- FR29B: Natural progression shows one of three states based on match: Aligned (≥75%), Stretch (50-74%), Misaligned (<50%)
- FR29C: When aligned, system shows unified "Your Path" view with remaining gaps
- FR29D: When misaligned, system shows honest assessment AND prominently surfaces better-fitting alternatives
- FR29E: When natural progression is aligned BUT a lateral move also has ≥75% match, system shows BOTH paths for comparison
- FR29F: System shows full trajectory for each path option (not just immediate next step)
- FR29G: System calculates match percentages for Step 2, Step 3, etc. in each trajectory to reveal long-term viability
- FR29H: For employees at terminal level (Partner/ED), natural progression section displays "You've reached the highest level" with lateral opportunities and practice leadership roles instead
- FR29I: Trajectories display up to 3 levels forward (current → +1 → +2 → +3) or until Partner/ED level, whichever comes first

### 5. Success Pattern Analysis

- FR30: System displays success patterns across six metric categories (Financial, Compliance, Quality, Development, People, Feedback)
- FR31: Employees can compare their metrics to advancement benchmarks specific to their target level
- FR32: System shows Career Competitiveness Dashboard with visual indicators for each metric category
- FR33: Employees can view Nine Box position indicators (Performance × Potential matrix)
- FR34: System provides specific behavioral recommendations based on patterns (sponsor gap, visibility moves, badge recommendations)
- FR35: System generates nudges when metrics deviate from success patterns (e.g., "Your effective utilization is 72% - patterns show 87% average for Manager advancement")
- FR35A: System calculates and displays `sponsor_score` based on senior relationships and upward feedback requests
- FR35B: System calculates and displays `visibility_score` based on internal initiatives and content creation
- FR35C: System accounts for inverse utilization relationship (targets decrease as seniority increases)
- FR35D: System validates promotion eligibility against minimum time-in-role and promotion window timing
- FR35E: System applies service line translation when matching employees to cross-service-line opportunities
- FR35F: System calculates effective utilization (accounts for PTO, holidays, sick time) for all utilization targets
- FR35G: System detects EY-Parthenon employees and applies appropriate career hierarchy model
- FR35H: Service line translation confidence affects match calculation: High confidence = 100% similarity weight, Medium = 80%, Low = 60%

### 6. Two-Sided Anonymous Matching

- FR36: Employees can explore roles without revealing identity to managers
- FR37: System tokenizes employee identities (EMP-XXXXXX format)
- FR38: Hiring managers can see candidate counts without identities
- FR39: Employees can opt-in to specific roles to express interest
- FR39A: Employees can opt into multiple roles simultaneously (no limit)
- FR40: Hiring managers can view tokenized profiles of opted-in candidates
- FR41: Hiring managers can invite candidates for conversation (triggers identity reveal)
- FR41A: When multiple hiring managers invite the same employee, employee sees all invitations and can accept/decline each independently
- FR42: System maintains anonymity until mutual opt-in completes

### 7. Hiring Manager Workflow

- FR43: Hiring managers can create and post internal role listings
- FR44: Hiring managers can define role requirements (skills, constraints, preferences)
- FR45: Hiring managers can view aggregate skill distribution of potential matches
- FR46: Hiring managers can review opted-in candidates with match details
- FR47: Hiring managers can see quality signals (feedback themes, performance indicators)
- FR48: Hiring managers can track candidate pipeline status
- FR49: Hiring managers can view time-to-fill and staffing analytics
- FR50: System notifies hiring managers when new candidates opt in

### 8. Governance & Compliance

- FR51: System logs all sensitive operations with timestamp and actor
- FR52: Admins can view comprehensive audit logs
- FR53: Admins can access fairness dashboard with parity metrics
- FR54: System provides decision records with reason codes for all matches
- FR55: Admins can investigate potential bias in recommendations
- FR56: System enforces "patterns not promises" language in all outputs
- FR57: Admins can generate compliance reports
- FR58: System tracks all data access for privacy compliance
- FR59: Managers can generate calibration-ready employee summaries with evidence and metrics
- FR60: Managers can export calibration session materials (evidence summaries, peer comparables, KPI trends)
- FR61: System provides peer comparables (anonymized benchmarking) for calibration sessions
- FR62: System tracks calibration outcomes (rating adjustments, rationale) for audit trail

### 9. Explainability & Transparency

- FR63: Users can view "Show reasoning" panels for any inference or match
- FR64: System displays step-by-step processing during skill inference
- FR65: Users can access confidence meters with explanation tooltips
- FR66: Users can click "Why this recommendation?" on any suggestion
- FR67: System provides audit trail access from any decision point

### 10. Real-Time Communication

- FR68: System sends real-time notifications for key events
- FR69: Employees receive notifications when matched to new roles
- FR70: Hiring managers receive notifications when candidates opt in
- FR71: Users receive feedback on processing status during inference

## Non-Functional Requirements

### Performance

- NFR1: Skill inference completes within 15 seconds for uncached requests
- NFR2: Cached skill inference completes within 3 seconds
- NFR3: Role matching queries return results within 2 seconds
- NFR4: Career Journey Map renders within 3 seconds
- NFR5: Real-time notifications delivered within 1 second of trigger event
- NFR6: UI remains responsive during background processing (no blocking)

### Security & Privacy

- NFR7: All employee PII is tokenized before use in matching algorithms
- NFR8: User passwords are hashed using bcrypt before storage
- NFR9: All API communications use HTTPS/TLS encryption
- NFR10: JWT tokens expire after 15 minutes with refresh mechanism
- NFR11: Audit logs capture all sensitive operations with immutable timestamps
- NFR12: Identity is never revealed to hiring managers until mutual opt-in
- NFR13: Database at rest encryption enabled for production deployment

### Reliability & Availability

- NFR14: System operates without crashes during demo scenarios
- NFR15: Same input produces consistent output (deterministic within tolerance)
- NFR16: Graceful degradation when external APIs (OpenAI) are slow or unavailable
- NFR17: Error messages are user-friendly and actionable
- NFR18: System recovers from container restart without data loss

### Integration & Interoperability

- NFR19: Mock data structures match SuccessFactors OData V4 schema
- NFR20: Mock data structures match Credly OAuth 2.0 API format
- NFR21: Architecture supports future swap from mock to live data sources
- NFR22: OpenAPI 3.0 specification auto-generated for all endpoints
- NFR23: TypeScript types generated from OpenAPI spec for frontend

### Usability & Accessibility

- NFR24: UI follows WCAG 2.1 AA guidelines for basic accessibility
- NFR25: All interactive elements are keyboard navigable
- NFR26: Color choices maintain sufficient contrast ratios
- NFR27: Loading states clearly indicate processing in progress
- NFR28: Error states provide clear recovery guidance

### Maintainability & Deployability

- NFR29: Entire system deployable via single `docker-compose up` command
- NFR30: Hot-reload enabled for development (no restart for code changes)
- NFR31: Structured logging (JSON format) for all application events
- NFR32: Environment variables for all configuration (no hardcoded secrets)
- NFR33: Total memory footprint under 6GB for full stack
