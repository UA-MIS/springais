---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
inputDocuments:
  - "_bmad-output/analysis/product-brief-SpringAIS-2025-12-18.md"
  - "_bmad-output/analysis/research/market-ai-talent-mobility-platform-research-2025-12-18.md"
  - "_bmad-output/analysis/research/technical-ai-talent-platform-technical-stack-research-2025-12-18.md"
  - "_bmad-output/analysis/research/domain-ai-talent-mobility-platform-research-2025-12-18.md"
  - "_bmad-output/analysis/research/domain-ey-performance-systems-promotion-evaluation-research-2025-12-18.md"
  - "_bmad-output/analysis/brainstorming-session-2025-12-18.md"
documentCounts:
  briefs: 1
  research: 4
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

**The "holy shit" moment:** An employee exploring a Manager role sees the Success Pattern overlay: _"Employees who advanced to Manager typically showed 87% utilization (you: 78%), 2+ mentees (you: 0), feedback themes emphasizing leadership..."_ Suddenly, vague career advice becomes a concrete, motivating action plan.

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
- Pure vector semantic matching operational (Chroma + GPT-5.2 embeddings)
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

She clicks on a Manager role in her practice and sees something she's never seen before: the Success Pattern overlay. _"Employees who advanced to Manager typically showed: 87% utilization (you: 78%), 2+ active mentees (you: 0), feedback themes emphasizing 'leadership' and 'client management' (you: strong on 'technical depth', opportunity on 'leadership')."_

The breakthrough hits her: she's been optimizing for the wrong things. She's been heads-down on delivery while missing the visibility moves that actually matter. The Career Journey Map shows her exactly what to do: request 2 mentees from the Staff pool (2 weeks to set up), lead an internal community initiative (ongoing, 2-3 hrs/week), and complete a stakeholder management course (6 weeks).

Three months later, Maya enters her annual review with evidence. Her utilization is up to 84%. She has two mentees who've given her glowing upward feedback. Her counselor sees "leadership" appearing in her feedback themes for the first time. She's no longer guessing—she knows she's on track.

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

By Wednesday, 5 employees have opted in. Alex reviews tokenized profiles: "EMP-482910 (78% match). Strengths: AWS Solutions Architect certified, 3 years client delivery, strong client management feedback. Gaps: Azure exposure (minor). Success Pattern: 85% utilization, 2 mentees, 'leadership' feedback theme." He can see quality signals without seeing private performance reviews.

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

_Why it matters:_ Employees and hiring managers can trust the inferences because they can see the proof. "Inferred Python expertise because resume states: 'Built data pipeline processing 2M records daily using Python and Apache Spark.'"

**2. Success Pattern Analysis (The Breakthrough Insight)**

Existing platforms match skills to job requirements. But skills alone don't drive advancement—behaviors, visibility, and patterns matter equally. SpringAIS captures what actually predicts success across six metric categories:

| Category    | What It Captures                         | Example Pattern                               |
| ----------- | ---------------------------------------- | --------------------------------------------- |
| Financial   | Utilization, billable hours, realization | "Advanced employees averaged 87% utilization" |
| Compliance  | Timesheet, CPE hours, policy adherence   | "95%+ timesheet compliance typical"           |
| Quality     | Engagement ratings, technical excellence | "4.2+ engagement ratings common"              |
| Development | Learning hours, mentoring participation  | "2+ active mentees typical"                   |
| People      | Upward feedback, team scores             | "Leadership theme in 80% of feedback"         |
| Feedback    | NLP theme analysis                       | "Client management" as recurring theme        |

_Why it matters:_ Maya stops guessing what "visibility" means. She sees exactly what employees who advanced actually did.

**EY Performance Cycle Alignment:**

- Fiscal year: July-June (annual performance cycle)
- Calibration sessions: Ratings normalized across peer groups
- Agile promotions: Quarterly promotion windows (not just annual)
- LEAD framework: Underlying competency model for performance metrics

**3. Pure Vector Semantic Matching**

Traditional HR systems use keyword matching, which breaks constantly:

- "Cloud architecture" doesn't match "AWS/Azure"
- "C#" doesn't match "csharp" or "C Sharp"
- No understanding that React expertise implies JavaScript knowledge

SpringAIS uses GPT-5.2 embeddings (1536-dimensional semantic space) where meaning is captured, not just words. Skills that are semantically related cluster together in vector space.

_Why it matters:_ Alex finds candidates with "AWS architecture" experience when searching for "cloud infrastructure"—without maintaining endless synonym lists.

**4. Two-Sided Anonymous Matching**

The fear of being discovered exploring internal opportunities prevents employees from even looking. SpringAIS implements privacy-first architecture:

- Employees explore roles anonymously (manager never knows)
- Hiring managers see candidate counts and aggregate skill distributions, not identities
- Employees opt-in to specific roles, revealing only a token (EMP-482910)
- Identity revealed only after hiring manager invites conversation

_Why it matters:_ Chris explores Tech Risk roles without his Audit manager ever knowing—until he's ready to make a move.

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
- Agile promotions framework compatibility (quarterly promotion windows)

**Credly Mock:**

- OAuth 2.0-style badge metadata structure
- 4-tier badge levels (Bronze/Silver/Gold/Platinum)
- Skill tags and issue dates per Credly API spec
- Badge verification endpoints

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
│ • Your utilization: 78% → Target: 87% (gap: 9%)            │
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
- FR10: System provides evidence quotes for each inferred skill
- FR11: System assigns confidence levels (high/medium/low) to each skill inference
- FR12: Employees can view the reasoning chain for each skill inference
- FR13: Employees can accept, reject, or modify inferred skills
- FR14: System generates vector embeddings for all extracted skills
- FR15: System caches inference results to avoid redundant processing

### 3. Role & Opportunity Discovery

- FR16: Employees can browse available roles across all service lines
- FR17: System matches employees to roles using semantic similarity
- FR18: Employees can view matches in multiple modes (Best Fit, Stretch, Exploratory, Trending)
- FR19: System provides match percentages with confidence intervals
- FR20: Employees can filter and sort role matches by various criteria
- FR21: System explains why each role was matched (reason codes)
- FR22: System identifies skill gaps between employee and role requirements

### 4. Career Journey Mapping

- FR23: Employees can view an interactive skill tree visualization
- FR24: System displays current skills, required skills, and growth skills distinctly
- FR25: System shows multiple paths to the same target role
- FR26: Employees can see progress visualization ("50% → 70% if you complete X, Y, Z")
- FR27: System generates personalized upskilling paths with time estimates
- FR28: System recommends specific actions (certifications, courses, experiences)
- FR29: Employees can track progress against their development plan

### 5. Success Pattern Analysis

- FR30: System displays success patterns across six metric categories
- FR31: Employees can compare their metrics to advancement benchmarks
- FR32: System shows Career Competitiveness Dashboard with visual indicators
- FR33: Employees can view Nine Box position indicators (Performance × Potential)
- FR34: System provides specific behavioral recommendations based on patterns
- FR35: System generates nudges when metrics deviate from success patterns

### 6. Two-Sided Anonymous Matching

- FR36: Employees can explore roles without revealing identity to managers
- FR37: System tokenizes employee identities (EMP-XXXXXX format)
- FR38: Hiring managers can see candidate counts without identities
- FR39: Employees can opt-in to specific roles to express interest
- FR40: Hiring managers can view tokenized profiles of opted-in candidates
- FR41: Hiring managers can invite candidates for conversation (triggers identity reveal)
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

### 9. Explainability & Transparency

- FR59: Users can view "Show reasoning" panels for any inference or match
- FR60: System displays step-by-step processing during skill inference
- FR61: Users can access confidence meters with explanation tooltips
- FR62: Users can click "Why this recommendation?" on any suggestion
- FR63: System provides audit trail access from any decision point

### 10. Real-Time Communication

- FR64: System sends real-time notifications for key events
- FR65: Employees receive notifications when matched to new roles
- FR66: Hiring managers receive notifications when candidates opt in
- FR67: Users receive feedback on processing status during inference

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
