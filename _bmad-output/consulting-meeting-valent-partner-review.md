# SpringAIS: Consulting Meeting Brief

## Senior Partner Review - Valent

**Date:** 2025-12-20  
**Prepared for:** Senior Partner, Valent  
**Purpose:** Project review and strategic feedback  
**Project:** SpringAIS - AI-Driven Talent Mobility Platform

---

## Executive Summary

SpringAIS is an AI-powered internal talent mobility platform designed for EY's enterprise talent optimization challenge. We're building this for the **EY Artificial Intelligence Competition** at SCLC 2026 (submission deadline: February 16, 2026). The platform uses semantic AI to match employees to roles beyond keyword matching, generates personalized upskilling paths, and provides explainable recommendations with bias mitigation and privacy safeguards.

**Core Innovation:** Unlike traditional HR systems that match skills to job descriptions, SpringAIS reveals what actually drives career advancement—combining skills, performance metrics, behavioral patterns, and success benchmarks from employees who successfully advanced.

---

## Competition Context

**Source:** [EY Artificial Intelligence Competition - SCLC 2026](https://communities.aisnet.org/sclc2026/competitions25/competitions26-ey)

### Problem Statement

Enterprises need agile talent strategies. Traditional HR systems fail to:

- Map evolving skills to open roles
- Provide actionable upskilling paths
- Balance AI automation with governance (bias, explainability, privacy)

### Competition Requirements

1. **Working Prototype:** Skill-role matching + upskilling plans for 5+ synthetic profiles (LLM-based approach required)
2. **Explainability & Governance:** Decision logs, bias checks, privacy safeguards
3. **Presentation:** ≤10-slide deck + demo (video or live)

### Evaluation Rubric (100 points)

- **AI Functionality & Accuracy (20 pts):** Accurate skill-role mapping beyond keyword matching
- **Explainability & Governance (20 pts):** Transparent recommendations, bias detection, privacy safeguards
- **Technical Design (20 pts):** Well-structured, scalable, addresses IT security and AI risks
- **Problem Understanding & Business Value (15 pts):** Real enterprise need, meaningful value
- **User Experience & Presentation (15 pts):** Clear demo, engaging storytelling
- **Innovation & Creativity (10 pts):** Unique, forward-looking approach

**Timeline:**

- February 16, 2026 - Preliminary submissions due
- February 26, 2026 - Finalists notified
- March 27, 2026 - Final presentations & winners announced

**Prizes:** $2,000 (1st), $1,000 (2nd), $500 (3rd)

---

## EY Structure Analysis

### Career Progression Model

**Standard Hierarchy:** Staff → Senior → Manager → Senior Manager → Partner/Executive Director

**Progression Timelines (varies by business unit):**

- Consulting: 2 → 2-3 → 2-4 → 4-8 years
- Tax: 2-3 → 2-3 → 3-4 → 6-8 years
- Audit: 3 → 2-3 → 3 → 2-5+ years

**EY-Parthenon Exception:** Different titles (Associate → Senior Associate → Consultant → Director → Senior Director → Partner)

### Promotion Cycles

- **Regular Promotions:** August (aligned with fiscal year end, July-June)
- **Agile Promotions:** January (rank changes only)
- **Calibration Sessions:** Late May/June (decisions made ~3 months before effective date)

### Success Factors (Beyond Skills)

**Six Metric Categories That Drive Career Advancement:**

SpringAIS analyzes these six categories to understand what actually drives promotions—not just what skills are listed, but how employees perform across the dimensions that matter in calibration sessions.

1. **Financial Performance**

   - **What it measures:** Revenue generation and efficiency metrics
   - **Key metrics:**
     - **Effective utilization:** Percentage of time billed to clients (targets decrease with seniority: 95% for Staff → 70% for Partner)
     - **Billable hours:** Total hours charged to client engagements
     - **Realization rate:** Percentage of billed hours actually collected from clients
   - **Why it matters:** Directly tied to business profitability. Low utilization or poor realization signals inefficiency or client dissatisfaction.
   - **How SpringAIS uses it:** Compares an employee's financial metrics against successful employees who advanced to their target role. Example: "Employees who advanced to Manager averaged 87% utilization (you: 78%)—you're 9 percentage points below the typical promotion threshold."

2. **Compliance & Policy Adherence**

   - **What it measures:** Adherence to EY policies, training requirements, and administrative obligations
   - **Key metrics:**
     - **Timesheet compliance:** Percentage of weeks with timesheets submitted on time (target: 95%+)
     - **CPE hours:** Continuing Professional Education hours completed annually (requirement: 40+)
     - **Policy adherence:** Violations or compliance issues (e.g., independence conflicts, data security breaches)
   - **Why it matters:** Compliance failures can block promotions regardless of performance. Missing CPE hours or timesheet compliance issues signal lack of professionalism.
   - **How SpringAIS uses it:** Flags compliance gaps that could derail advancement. Example: "You're at 35 CPE hours—5 hours short of the 40-hour requirement. This could delay your promotion eligibility."

3. **Quality & Client Satisfaction**

   - **What it measures:** Quality of work delivered and client/engagement feedback
   - **Key metrics:**
     - **Engagement ratings:** Client satisfaction scores from engagement surveys
     - **Technical excellence:** Quality scores from peer reviews, technical assessments, or deliverable reviews
     - **Error rates:** Frequency of rework, corrections, or quality issues
   - **Why it matters:** High-quality work builds reputation and client trust. Poor quality ratings indicate skill gaps or attention to detail issues.
   - **How SpringAIS uses it:** Identifies quality patterns that correlate with advancement. Example: "Employees who advanced to Senior Manager averaged 4.2/5.0 engagement ratings (you: 3.8/5.0). Focus on client communication and deliverable quality."

4. **Development & Learning**

   - **What it measures:** Investment in skill development, certifications, and knowledge sharing
   - **Key metrics:**
     - **Learning hours:** Total hours spent in training, courses, or self-study
     - **Mentoring participation:** Active mentoring relationships (both as mentor and mentee)
     - **EY Badges:** Digital credentials earned through Credly (87 available badges across 5 tiers: Learning → Bronze → Silver → Gold → Platinum)
   - **Why it matters:** Demonstrates growth mindset and commitment to staying current. Badges provide verifiable proof of skills. Mentoring shows leadership potential.
   - **How SpringAIS uses it:** Recommends specific learning paths and badges that successful employees in target roles earned. Example: "Employees who advanced to Manager typically earned 3+ Silver-tier badges. You have 1 Bronze badge—consider pursuing AWS Certified Solutions Architect (Silver tier)."

5. **People & Leadership**

   - **What it measures:** Leadership behaviors, team impact, and people development
   - **Key metrics:**
     - **Upward feedback:** Ratings and comments from direct reports (360-degree feedback)
     - **Team scores:** Team satisfaction, collaboration ratings, or team performance metrics
     - **Mentee count:** Number of employees actively mentored
   - **Why it matters:** Leadership potential is critical for advancement beyond individual contributor roles. Poor upward feedback or low team scores signal leadership gaps.
   - **How SpringAIS uses it:** Highlights leadership gaps compared to successful employees. Example: "Employees who advanced to Manager averaged 2+ active mentees (you: 0). Consider volunteering to mentor a junior staff member to demonstrate leadership capability."

6. **Feedback Themes (NLP Analysis)**
   - **What it measures:** Recurring themes and patterns in performance reviews, feedback, and evaluations
   - **Key metrics:**
     - **Leadership mentions:** Frequency of leadership-related feedback (e.g., "shows leadership," "takes initiative")
     - **Client management:** References to client relationship skills, communication, or business development
     - **Technical depth:** Mentions of technical expertise, problem-solving, or subject matter expertise
   - **Why it matters:** Feedback themes reveal what managers and peers actually notice. Employees who get consistent positive themes around leadership or client management advance faster.
   - **How SpringAIS uses it:** Analyzes feedback text to identify patterns. Example: "Your feedback emphasizes technical depth but rarely mentions leadership. Employees who advanced to Manager had 3x more leadership-themed feedback. Consider taking on team lead responsibilities to shift the narrative."

**Critical Insight:** Utilization targets _decrease_ as seniority increases (95% Staff → 70% Partner), reflecting the shift from billable work to business development and strategic activities. SpringAIS accounts for these role-specific expectations when comparing employees to success patterns.

**Soft Factors:**

- **Sponsor/Advocate:** Someone who fights for you in calibration sessions (politics matter)
- **Visibility Moves:** Internal community leadership, thought leadership, mentoring
- **Personal Brand:** "Go-To Expert" specialization accelerates advancement

### Internal Mobility Context

- **Mobility4U Program:** ~900 employees started new assignments, 4,100+ on mobility assignments
- **Fear of Discovery:** Employees hesitate to explore internal opportunities (manager might find out)
- **Service Line Translation:** Skills translate across service lines (e.g., Audit → Tech Risk, Tax → Advisory)

### EY Technology Stack

- **SuccessFactors:** Core HR platform (employee profiles, performance, learning)
- **EY PX360:** Experience data (X-data) + Operational data (O-data) integration
- **Credly:** Digital badge verification (87 badges, OAuth 2.0 API)
- **LEAD Framework:** Performance management system (launched 2018)

---

## Proposed Solution: SpringAIS

### What We're Building

**SpringAIS** is an AI-powered career discovery and development platform that:

1. **Reveals hidden opportunities** employees didn't know existed (semantic matching across all service lines)
2. **Shows exactly how to get there** with actionable, time-estimated upskilling paths
3. **Provides motivation and clarity** by comparing employees to success patterns from those who advanced

### How It Works

**Phase 1: Discovery**

- Employees upload resume, Credly badges, project descriptions
- **Dual LLM validation** extracts skills WITH evidence quotes (LLM #1 extracts, LLM #2 validates)
- **Pure vector semantic matching** finds role alignments using GPT-5.2 embeddings (1536 dimensions)
- Discovery modes: Best Fit (70%+), Stretch (50-70%), Exploratory (unexpected pivots), Trending (high-demand areas)
- **Anonymous exploration:** Employees explore without manager visibility

**Phase 2: Career Journey Map**

- Interactive skill tree visualization (React Flow)
- **Success Pattern Overlay:** Compares employee's current metrics against successful employees who advanced to target roles across all 6 categories (Financial, Compliance, Quality, Development, People, Feedback Themes). Example: "Employees who advanced to Manager typically showed: 87% effective utilization (you: 78%), 2+ mentees (you: 0), 3+ Silver-tier badges (you: 1 Bronze), feedback themes emphasizing leadership..."
- **Career Competitiveness Dashboard:** Visual indicators showing performance across all 6 metric categories with color-coded status (green = above threshold, yellow = approaching, red = below threshold)
- **Nine Box Position:** Performance × Potential matrix

**Phase 3: Actionable Development**

- Personalized upskilling paths with time estimates (e.g., "AWS cert: 3-4 months, 120 study hours")
- Progress visualization: "50% match → 70% if you complete X, Y, Z"
- Holistic recommendations: skills + behaviors + visibility moves

**Two-Sided Anonymous Matching:**

- **Hiring manager posts role:** System shows candidate COUNT (not names or identities)
- **Employees opt-in to be considered:** Manager sees anonymous tokenized profiles (e.g., "EMP-482910") with skills and qualifications, but no identifying information
- **Identity revealed only after mutual interest:** Employee's real identity is revealed only after manager invites a conversation and employee accepts

### Why This Approach

**1. Semantic AI, Not Keyword Matching**

- Traditional systems break on synonyms ("cloud architecture" vs "AWS/Azure")
- Vector embeddings understand skill relationships automatically
- No manual skill normalization required

**2. Dual LLM Validation for Explainability**

- Addresses AI hallucination concerns
- Every inferred skill shows supporting evidence quote + confidence level
- Human-readable explanations: "Inferred Python expertise because resume states: [quote]"

**3. Success Pattern Analysis (The Breakthrough)**

- Competitors stop at skill matching
- We analyze what ACTUALLY drives advancement across 6 metric categories (Financial, Compliance, Quality, Development, People, Feedback Themes)
- Shows employees where they are vs. where successful employees were in each category
- Transforms vague feedback ("need more visibility") into concrete actions (e.g., "increase mentee count from 0 to 2+ to match Manager promotion patterns")

**4. Privacy-First Architecture**

- **Protects employee privacy during job exploration:** Employees can explore internal opportunities without their current manager knowing, addressing the "fear of discovery" that prevents internal mobility
- **Replaces identifying information with anonymous tokens:** Instead of using names, email addresses, or employee IDs (personally identifiable information, or PII), the system uses anonymous tokens like "EMP-482910" throughout the matching process. This means hiring managers see candidate profiles without knowing who the person is until both parties opt-in to reveal identities
- **Anonymous exploration until mutual opt-in:** Employees browse roles anonymously, and hiring managers see only tokenized candidate counts. Identity is revealed only after a manager invites a conversation and the employee accepts
- **Audit trails for compliance:** All matching activities are logged for compliance and security purposes, but with tokenized identifiers to maintain privacy

**5. Legally Defensible, Ethically Sound**

- "Patterns not promises" language throughout
- Confidence intervals, not absolute predictions
- Reason codes for every recommendation
- Bias monitoring and disparate impact testing

---

## Technical Architecture

### Technology Stack

**Backend:**

- **FastAPI (Python):** High-performance async REST API
- **GPT-5.2 Instant:** Skill inference, validation, embeddings (400K context window)
- **LangChain:** LLM orchestration, aggressive caching (semantic + prompt caching = 68.8% API call reduction)
- **PostgreSQL + pgvector:** Unified structured + vector data storage
- **Chroma (demo) / Qdrant (production):** Vector database for semantic search
- **Redis:** Multi-layer caching (LLM responses, embeddings, match results)

**Frontend:**

- **React + TypeScript:** Component-based UI with type safety
- **shadcn/ui:** Professional UI component library
- **React Flow:** Interactive skill tree visualization
- **Recharts:** Analytics dashboards

**Infrastructure:**

- **Docker + docker-compose:** Single-command deployment (`docker-compose up`)
- **Container Architecture:** Backend, Frontend, PostgreSQL, Chroma, Redis

### Key Technical Innovations

**1. Dual LLM Validation Pattern**

- LLM #1: Extract skills WITH evidence quotes from source documents
- LLM #2: Independently validate that quote actually supports inferred skill
- Output: Confidence scores (high/medium/low) for every skill, with human-readable evidence
- **Why:** Eliminates hallucinations, builds trust through explainability

**2. Pure Vector Semantic Matching**

- GPT-5.2 embeddings (1536-dimensional semantic space)
- Skills that are semantically related cluster together in vector space
- Chroma vector database for local, reliable matching
- **Why:** Handles synonyms, skill hierarchies, related competencies automatically

**3. Multi-Layer Aggressive Caching**

- **Semantic Cache:** Similar query embeddings → cached responses (68.8% API call reduction)
- **Prompt Cache:** Repeated prompt prefixes >1024 tokens (90% cost reduction)
- **Response Cache:** Exact skill inference results (7 days TTL)
- **Embedding Cache:** Generated embeddings per skill/document (indefinite)
- **Why:** Manages LLM API costs, improves response times

**4. Hybrid Data Architecture**

- PostgreSQL + pgvector for structured data + embeddings
- Optional dedicated vector DB (Chroma/Qdrant) for advanced semantic search
- Redis for caching layer
- **Why:** Flexibility to start simple, scale to production

### Integration Architecture (MVP: Mock Data)

**SuccessFactors Mock:**

- OData V4-compatible JSON structure
- Employee profiles, performance metrics, learning records
- Fiscal year alignment (July-June)

**Credly Mock:**

- OAuth 2.0-style badge metadata
- 87 badges, 5-tier structure (Learning → Bronze → Silver → Gold → Platinum)
- Skill tags and issue dates

**Future-Ready Design:**

- Mock data served through same API interface as production
- Configuration flag to switch between mock and live data sources
- Data adapters abstract the source (mock vs. real API)

### Performance Benchmarks

- **Chroma vector queries:** <350ms p95 (demo scale)
- **Cached skill inference:** <3s (semantic cache hit)
- **Uncached skill inference:** <15s (full dual LLM pipeline)
- **Role matching:** <2s for top-10 results
- **Total memory footprint:** ~4.5GB for full stack

---

## Key Differentiators

### What Makes SpringAIS Special

1. **Success Pattern Analysis:** No competitor captures what actually drives advancement across 6 metric categories (Financial, Compliance, Quality, Development, People, Feedback Themes), behavioral patterns, and soft factors

2. **Dual LLM Validation:** Explainable AI with evidence quotes—employees can see WHY skills were inferred

3. **Pure Vector Semantic Matching:** Handles skill relationships automatically (no manual synonym lists)

4. **Privacy-First Anonymous Matching:** Employees explore safely without manager visibility until ready

5. **Career Journey Map Visualization:** Transforms abstract career advice into concrete, motivating progression paths

6. **EY-Specific Deep Integration:** Aligned with EY's promotion cycles, calibration processes, badge system, service line structures

---

## Questions for Feedback

### Strategic Questions

1. **Business Value:** Does this solve a real enterprise need? Is the value proposition clear and compelling?

2. **Competition Positioning:** How does this compare to typical AI/HR solutions? Is the differentiation strong enough?

3. **EY Context:** Are we accurately representing EY's structure and processes? Any critical gaps in our understanding?

4. **Success Pattern Approach:** Is analyzing what actually drives advancement (beyond skills) a compelling differentiator?

### Technical Questions

5. **Architecture:** Is the technical approach sound? Any concerns about scalability, security, or AI risks?

6. **Dual LLM Validation:** Is the explainability approach sufficient? Does it address hallucination concerns effectively?

7. **Caching Strategy:** Is the multi-layer caching approach appropriate for managing LLM API costs?

### Competition Readiness

8. **Demo Strategy:** What should we emphasize in the ≤10-slide presentation? What's the most compelling "holy shit" moment?

9. **Governance & Explainability:** Are our bias mitigation and privacy safeguards sufficient for the competition rubric?

10. **Timeline:** Given the February 16 deadline, are we prioritizing the right features? What's critical vs. nice-to-have?

### Risk Assessment

11. **Technical Risks:** What are the biggest technical risks we should mitigate? (LLM hallucinations, vector matching quality, performance)

12. **Competition Risks:** What could go wrong in the demo? How should we prepare for edge cases or judge questions?

---

## Appendix: Competition Rubric Alignment

| Rubric Category                                     | How SpringAIS Addresses It                                                                                                                                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI Functionality & Accuracy (20 pts)**            | Dual LLM validation ensures accuracy; pure vector semantic matching goes beyond keyword matching; success pattern analysis provides meaningful recommendations                                       |
| **Explainability & Governance (20 pts)**            | Evidence quotes for every skill inference; reason codes for all matches; bias detection framework; privacy safeguards (tokenization, audit logs); "patterns not promises" language                   |
| **Technical Design (20 pts)**                       | Well-structured monolithic architecture (microservices-ready); comprehensive documentation; addresses IT security (HTTPS, encryption, RBAC) and AI risks (bias mitigation, hallucination prevention) |
| **Problem Understanding & Business Value (15 pts)** | Deep EY structure analysis; addresses real enterprise need (internal mobility, retention, cost reduction); clear value proposition (10-20% internal fill rate lift, 30-50% time-to-fill reduction)   |
| **User Experience & Presentation (15 pts)**         | Professional UI (shadcn/ui); clear user journeys; engaging Career Journey Map visualization; strong storytelling (Maya's journey from invisible progress to promotion clarity)                       |
| **Innovation & Creativity (10 pts)**                | Success pattern analysis (unique approach); dual LLM validation (explainable AI innovation); pure vector semantic matching (beyond keyword matching); privacy-first anonymous matching               |

---

**Document Prepared By:** SpringAIS Team  
**Next Steps:** Incorporate partner feedback, refine solution, prepare competition submission
