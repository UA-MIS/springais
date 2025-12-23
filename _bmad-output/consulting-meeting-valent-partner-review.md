# SpringAIS: Consulting Meeting Brief

## Senior Partner Review - Valent

**Date:** 2025-12-23
**Prepared for:** Senior Partner, Valent
**Purpose:** Project review and strategic feedback
**Project:** SpringAIS - Career Discovery and Development Platform
**Last Updated:** 2025-12-23 (Refined matching algorithm, trajectory comparison, natural progression handling, multiple opt-ins, terminal level, trajectory depth, time estimates, translation confidence)

---

## Executive Summary

**What is SpringAIS?** SpringAIS is a software tool that helps employees find new job opportunities within their company and shows them exactly what they need to do to get promoted. Think of it like a career GPS: instead of just telling you where you are, it shows you where you could go and gives you turn-by-turn directions to get there.

**The Competition:** We're building this for the **EY Artificial Intelligence Competition** at SCLC 2026 (Student Conference on Leadership and Change, hosted by the Association for Information Systems). Our submission is due February 16, 2026.

**How It's Different from Traditional Systems:** Most job-matching systems work like a simple search engine—they look for exact word matches. For example, if a job requires "cloud architecture" experience, but your resume says "AWS" or "Azure," the system won't recognize that these are the same thing. SpringAIS understands that these terms mean the same thing, just like a human would.

**What It Does:**

1. **Finds hidden opportunities:** Shows employees job openings they didn't know existed, even in different departments
2. **Creates personalized learning plans:** Tells employees exactly what skills to learn and how long it will take (e.g., "Get AWS certification: takes 3-4 months, 120 study hours")
3. **Shows why recommendations are made:** Instead of just saying "you're a good fit," it explains the reasoning (e.g., "We matched you to this role because your resume mentions [specific quote], which shows you have the required experience")
4. **Prevents unfair bias:** The system checks itself to make sure it's not accidentally favoring certain groups of people
5. **Protects privacy:** Employees can explore opportunities without their current boss finding out

**Core Innovation:** Most systems only look at what skills you have versus what skills a job requires. SpringAIS goes deeper—it analyzes what actually got people promoted in the past. It looks at things like: How many hours did they bill to clients? How many people did they mentor? What did their performance reviews say? Then it compares where you are now to where those successful people were before they got promoted. This turns vague advice like "you need more visibility" into concrete actions like "employees who got promoted to Manager typically mentored 2+ people—you're currently mentoring 0, so consider taking on a mentee."

---

## Competition Context

**Source:** [EY Artificial Intelligence Competition - SCLC 2026](https://communities.aisnet.org/sclc2026/competitions25/competitions26-ey)

### Problem Statement

**The Challenge:** Large companies struggle to help their employees find new opportunities within the company. When someone wants to change roles or get promoted, they often don't know:

- What jobs are available that match their skills
- What skills they need to learn to qualify for those jobs
- How long it will take to learn those skills

**Why Traditional Systems Fail:**

- They can't understand that "cloud architecture" and "AWS" mean the same thing (they only look for exact word matches)
- They can't create personalized learning plans—they just list required skills without saying how to get them
- They don't explain why they're making recommendations, which makes it hard to trust them
- They might accidentally favor certain groups of people (like men over women, or younger employees over older ones) without anyone realizing it

### Competition Requirements

1. **Working Prototype:** We need to build a working version that can match at least 5 fake employee profiles to job openings and create learning plans for them. The system must use AI (artificial intelligence) to understand skills and make recommendations.
2. **Explainability & Governance:** The system must be able to explain why it made each recommendation, check itself for unfair bias, and protect employee privacy.
3. **Presentation:** We need to create a presentation (10 slides or fewer) and demonstrate the system working (either live or in a video).

### Evaluation Rubric (100 points)

Judges will score us on:

- **Does the AI work well? (20 points):** Does it accurately match people to jobs? Does it understand that related skills are similar (not just looking for exact word matches)?
- **Can we trust it? (20 points):** Does it explain its recommendations? Does it check for unfair bias? Does it protect privacy?
- **Is it built well? (20 points):** Is the code organized and secure? Can it handle growth? Are there safeguards against AI mistakes?
- **Does it solve a real problem? (15 points):** Is this something companies actually need? Will it provide real value?
- **Is it easy to use and present? (15 points):** Is the demo clear and engaging? Can people understand what it does?
- **Is it innovative? (10 points):** Does it do something new and creative that others haven't done?

**Timeline:**

- February 16, 2026 - Preliminary submissions due
- February 26, 2026 - Finalists notified
- March 27, 2026 - Final presentations & winners announced

**Prizes:** $2,000 (1st), $1,000 (2nd), $500 (3rd)

---

## Understanding EY's Structure

**Note:** EY (Ernst & Young) is a large professional services firm. To build SpringAIS effectively, we need to understand how careers work at EY.

### Career Progression Model

**The Job Ladder:** At EY, employees typically move through these job levels:

- Staff (entry level)
- Senior
- Manager
- Senior Manager
- Partner or Executive Director (top level)

**How Long It Takes:** The time between promotions varies by department:

- **Consulting department:** 2 years → 2-3 years → 2-4 years → 4-8 years
- **Tax department:** 2-3 years → 2-3 years → 3-4 years → 6-8 years
- **Audit department:** 3 years → 2-3 years → 3 years → 2-5+ years

**One Exception:** EY-Parthenon (a specialized division) uses different job titles, but the concept is the same—people move up through levels over time.

### When Promotions Happen

- **Regular Promotions:** Most promotions happen in August, which aligns with EY's fiscal year (July to June)
- **Agile Promotions:** Some promotions happen in January, but these are usually just title changes without major role changes
- **Calibration Sessions:** In late May or June, managers meet to decide who gets promoted. These decisions are made about 3 months before the promotions actually take effect in August

### What Actually Gets People Promoted (Beyond Just Skills)

**The Key Insight:** Getting promoted isn't just about having the right skills. SpringAIS looks at six different areas to understand what really drives promotions. This is based on what actually happened to people who got promoted—not just what the job description says.

1. **Financial Performance**

   - **What this means:** How much money you're making for the company and how efficiently you're working
   - **Key measurements:**
     - **Effective utilization:** What percentage of your time is spent on client work that gets billed? (For entry-level employees, the target is 95% of their time. For senior partners, it's only 70% because they spend more time on business development and strategy.)
     - **Billable hours:** How many hours did you charge to clients?
     - **Realization rate:** When you bill clients for your time, what percentage of that money actually gets collected? (Sometimes clients dispute bills or don't pay.)
   - **Why it matters:** The company makes money when employees work on client projects. If you're not billing enough hours, or if clients aren't paying for your time, that's a problem.
   - **How SpringAIS uses it:** It compares your numbers to people who successfully got promoted. Example: "People who got promoted to Manager typically billed 87% of their time to clients. You're at 78%, which is 9 percentage points below the typical threshold for promotion."

2. **Following the Rules**

   - **What this means:** Did you follow company policies, complete required training, and handle administrative tasks properly?
   - **Key measurements:**
     - **Timesheet compliance:** Did you submit your timesheets on time? (Target: 95% of weeks or more)
     - **CPE hours:** Continuing Professional Education—did you complete the required training hours each year? (Requirement: 40 hours minimum)
     - **Policy adherence:** Did you have any violations? (For example, working on a client where you have a conflict of interest, or breaking data security rules)
   - **Why it matters:** Even if you're great at your job, breaking rules or missing required training can prevent you from getting promoted. It shows a lack of professionalism.
   - **How SpringAIS uses it:** It flags problems that could stop you from getting promoted. Example: "You've completed 35 hours of training, but you need 40. You're 5 hours short, which could delay your promotion."

3. **Quality of Work & Client Satisfaction**

   - **What this means:** How good is your work, and are clients happy with it?
   - **Key measurements:**
     - **Engagement ratings:** When clients fill out surveys about your work, what scores do they give? (Usually on a 1-5 scale)
     - **Technical excellence:** When your peers or managers review your work, how do they rate it?
     - **Error rates:** How often do you make mistakes that require redoing work?
   - **Why it matters:** Good work builds your reputation and keeps clients happy. Poor ratings suggest you might have skill gaps or aren't paying enough attention to detail.
   - **How SpringAIS uses it:** It compares your quality scores to people who got promoted. Example: "People who got promoted to Senior Manager typically got 4.2 out of 5.0 from clients. You're at 3.8. Focus on improving client communication and the quality of your deliverables."

4. **Learning & Skill Development**

   - **What this means:** Are you actively learning new skills and helping others learn?
   - **Key measurements:**
     - **Learning hours:** How many hours did you spend in training, taking courses, or studying on your own?
     - **Mentoring participation:** Are you actively mentoring someone, or being mentored by someone?
     - **EY Badges:** EY has a system of digital badges (like video game achievements) that prove you've learned certain skills. There are 87 different badges across 5 levels: Learning → Bronze → Silver → Gold → Platinum
   - **Why it matters:** This shows you're committed to growing and staying current. Badges provide proof that you actually have the skills you claim. Mentoring shows you have leadership potential.
   - **How SpringAIS uses it:** It recommends specific badges and learning paths that successful people in your target role completed. Example: "People who got promoted to Manager typically earned 3 or more Silver-level badges. You have 1 Bronze badge. Consider getting the AWS Certified Solutions Architect badge, which is Silver level."

5. **Leadership & Team Impact**

   - **What this means:** Are you showing leadership skills? How do people who work with you feel about you?
   - **Key measurements:**
     - **Upward feedback:** When people who report to you (your direct reports) give you feedback, what do they say? (This is called "360-degree feedback"—feedback from all directions: up, down, and sideways)
     - **Team scores:** How satisfied is your team? How well do you collaborate? How is your team performing?
     - **Mentee count:** How many people are you actively mentoring?
   - **Why it matters:** To move beyond just doing your own work, you need to show you can lead others. If people who work with you give you poor feedback, or if your team isn't performing well, that's a red flag.
   - **How SpringAIS uses it:** It compares your leadership metrics to successful people. Example: "People who got promoted to Manager typically mentored 2 or more people. You're currently mentoring 0. Consider volunteering to mentor a junior employee to show you have leadership skills."

6. **What People Say About You (Feedback Analysis)**
   - **What this means:** When managers and coworkers write performance reviews or give feedback, what topics do they keep mentioning? The system uses AI to read through all your feedback and find patterns.
   - **Key measurements:**
     - **Leadership mentions:** How often do people mention leadership-related things? (For example, "shows leadership," "takes initiative")
     - **Client management:** How often do people mention your ability to work with clients, communicate well, or bring in business?
     - **Technical depth:** How often do people mention your technical expertise, problem-solving skills, or deep knowledge?
   - **Why it matters:** What people consistently say about you reveals what they actually notice. People who consistently get positive feedback about leadership or client management tend to get promoted faster.
   - **How SpringAIS uses it:** It reads through all your feedback and finds patterns. Example: "Your feedback consistently mentions your technical skills but rarely mentions leadership. People who got promoted to Manager had 3 times more leadership-related feedback. Consider taking on team lead responsibilities to change what people notice about you."

**Important Note:** As people get more senior, the expectations change. Entry-level employees are expected to spend 95% of their time on client work. But senior partners only spend 70% because they're expected to spend more time on business development (finding new clients) and strategic planning. SpringAIS accounts for these different expectations when comparing you to successful people.

**Other Factors That Matter (But Are Harder to Measure):**

- **Having a Sponsor:** Someone in a position of power who will advocate for you during promotion discussions (office politics matter, unfortunately)
- **Visibility:** Getting involved in internal communities, sharing your expertise, mentoring others—things that make people notice you
- **Personal Brand:** Becoming known as the "go-to expert" in a specific area can accelerate your career

### The Problem: Internal Job Mobility

- **Mobility4U Program:** EY's global program (launched September 2021) that helps employees move between roles. Since launch, ~900 employees have started new mobility assignments, and 4,100+ employees are currently on mobility assignments or one-way transfers (cumulative numbers).
- **Fear of Discovery:** Many employees are afraid to explore internal opportunities because they worry their current manager will find out and it might hurt their current role.
- **Skills Transfer Across Departments:** Skills from one department can apply to others. For example, someone in Audit could move to Tech Risk, or someone in Tax could move to Advisory.

### EY's Existing Technology Systems

- **SuccessFactors:** EY's main HR system that stores employee information, performance reviews, and training records
- **EY PX360:** A system that combines employee experience data (X-data: how employees feel) with operational data (O-data: how they perform) to provide real-time insights
- **Credly:** A system that issues and verifies digital badges (like certificates) for skills employees have learned
- **LEAD Framework:** EY's performance management system (LEAD = Leadership, Engagement, Achievement, Development) launched in 2018 that supports performance development and encourages frequent feedback

---

## Proposed Solution: SpringAIS

### What We're Building

**SpringAIS** is a software tool that helps employees discover career opportunities and shows them how to get there. It does three main things:

1. **Finds hidden opportunities:** Shows employees job openings they didn't know existed, even in completely different departments
2. **Shows exactly how to get there:** Creates personalized learning plans with time estimates (e.g., "Get AWS certification: takes 3-4 months")
3. **Provides motivation and clarity:** Compares where you are now to where successful people were before they got promoted

### How It Works

**Phase 1: Discovery (Finding Opportunities)**

- Employees upload resume, Credly badges, project descriptions
- **Dual LLM validation for skill extraction:** LLM #1 extracts skills WITH evidence quotes from source documents. LLM #2 independently validates that each quote actually supports the inferred skill. **Multi-skill extraction:** A single quote can generate multiple skills (e.g., "Built Python data pipeline processing 2M records" → "Python" + "Data Pipeline Architecture" + "Big Data Processing"). Output includes confidence scores (high/medium/low) and human-readable evidence.
- **Per-skill vector embedding:** Each extracted skill is independently embedded into a 3072-dimensional vector using text-embedding-3-large. This is per-skill, not per-resume—enabling massive caching efficiency (embed "AWS" once, reuse across all employees).
- **Aggregate matching:** The system compares an employee's **full skill profile** against a role's **full requirements**—not individual skill-to-requirement matching. This produces an aggregate match score per role.
- **Discovery modes:**
  - **Best Fit:** ≥75% aggregate match (highly qualified)
  - **Stretch:** 50-74% aggregate match (achievable with development)
  - **Exploratory:** 30-49% aggregate match (career pivots, hidden opportunities)
  - **Trending:** High-demand emerging roles (based on posting frequency and growth)
- **Threshold-based search:** System searches ALL roles above threshold (≥30% for Exploratory)—no artificial top-K limits that might miss relevant matches.
- **Service line translation:** When matching employees across service lines (e.g., Audit to Tech Risk), translation confidence affects match weighting: High confidence = 100% similarity weight, Medium confidence = 80%, Low confidence = 60%. This prevents overconfident cross-service-line matching.
- **Anonymous exploration:** Employees explore without manager visibility. PII tokenization ensures privacy during job browsing.

**Phase 2: Career Journey Map (Visualizing Your Path)**

- **Interactive skill tree (React Flow):** Visual diagram showing skill dependencies and learning paths
- **Two parallel analyses combined:**
  - **Vector Matching (Skills):** "What roles could you DO based on your skills?"
  - **Success Pattern Analysis (EY Metrics):** "Will EY actually PROMOTE you?" (utilization, mentees, feedback themes, etc.)
- **Natural progression always shown:** System ALWAYS displays the employee's next EY level (e.g., Staff→Senior, Manager→Senior Manager) regardless of match score. Three states:
  - **Aligned (≥75%):** "You're on track" — unified path view with remaining gaps
  - **Stretch (50-74%):** "Achievable with development" — shows gap closure timeline
  - **Misaligned (<50%):** "Significant gaps" — honest assessment + better-fitting alternatives prominently displayed
- **Trajectory comparison:** When alternatives exist, system shows FULL career paths up to 3 levels forward (or until Partner/ED level):
  - Path A (Natural Progression): Manager → Senior Manager (78%) → Partner (70%) — smooth trajectory
  - Path B (Lateral Move): Manager → Manager, Analytics (85%) → Senior Manager, Analytics (40% ⚠️) — easy entry, but wall at SM
  - Flags "walls" when any future step has <50% match, helping employees see long-term viability
- **Terminal level handling:** For employees who have reached Partner/ED (terminal level), natural progression section shows lateral opportunities and practice leadership roles instead
- **Show lateral moves when aligned:** Even if natural progression is ≥75% match, if a lateral move ALSO has ≥75% match, both are shown for comparison
- **Success Pattern Overlay:** Compares employee's metrics against advancement benchmarks across 6 categories
- **Career Competitiveness Dashboard:** Visual indicators with color-coded status (green/yellow/red)

**Phase 3: Actionable Development Plan (What to Do Next)**

- **Personalized upskilling paths:** Time-estimated learning plans (e.g., "AWS cert: 3-4 months, 120 study hours"). Time estimates are generated by LLM based on EY Badges Learning module durations, O\*NET (US Department of Labor occupational database) skill acquisition data, and industry-standard certification timelines.
- **Progress visualization:** Match score improvement projections (e.g., "50% match → 70% if you complete X, Y, Z")
- **Holistic recommendations:** Skills + behaviors + visibility moves (mentoring, internal community leadership)

**Two-Sided Anonymous Matching:**

- **Hiring manager posts role:** System shows candidate COUNT (not names or identities)
- **Employees opt-in to be considered:** Employees can opt into multiple roles simultaneously (no limit). Hiring manager sees anonymous tokenized profiles (e.g., "EMP-482910") with skills and qualifications, but no PII. Employees remain anonymous—hiring managers cannot see employee identities unless the employee chooses to expose themselves.
- **Multiple invitations managed independently:** When multiple hiring managers invite the same employee, employee sees all invitations and can accept/decline each independently
- **Identity revealed only after mutual interest:** Employee's real identity is revealed only after manager invites a conversation and employee accepts

### Why We Built It This Way

**1. Per-Skill Vector Embedding & Aggregate Matching**

- **The problem:** Traditional systems use keyword matching, which breaks on synonyms. If a job requires "cloud architecture" but a resume says "AWS," the system won't recognize they're related.
- **Our solution:** Each extracted skill is embedded into a 3072-dimensional vector using text-embedding-3-large. Critically, this is **per-skill, not per-resume**—enabling massive caching (embed "AWS" once, reuse across all employees). The system then performs **aggregate matching**: comparing an employee's full skill profile against a role's full requirements to produce an overall match score.
- **Synonym handling:** The LLM normalizes during extraction (e.g., "js" → "JavaScript"). If duplicates slip through, they cluster together in vector space anyway—no complex deduplication needed.
- **Threshold-based search:** We search ALL roles above the threshold (≥30% for Exploratory mode), never arbitrarily truncating results. If matches #50 and #51 are both 70%, both are shown.
- **Why it matters:** Employees don't miss opportunities due to vocabulary mismatches, and the system finds hidden opportunities across all service lines efficiently.

**2. Dual LLM Validation with Multi-Skill Extraction**

- **The problem:** LLMs can hallucinate—generating plausible but unsupported skill inferences. Single-pass extraction lacks validation, creating trust and accuracy issues.
- **Our solution:** Dual LLM validation: LLM #1 extracts skills with evidence quotes; LLM #2 independently validates each quote supports the inferred skill. Output includes confidence scores (high/medium/low) and human-readable evidence.
- **Multi-skill extraction:** A single quote can generate multiple skills. Example: "Built Python data pipeline processing 2M records" → "Python" + "Data Pipeline Architecture" + "Big Data Processing". Each skill is independently validated. This ensures employees receive full credit for all demonstrated competencies.
- **Why it matters:** Every skill inference is explainable and validated. Users see evidence and understand exactly why each skill was inferred. This eliminates hallucinations and builds trust.

**3. Two Parallel Processes: Skills + EY Metrics**

- **The problem:** Most systems only perform skill-to-requirement matching. They don't analyze what actually drove career advancement—the behavioral patterns, metrics, and soft factors that matter in promotion decisions.
- **Our solution:** SpringAIS runs **two separate analyses** that combine for the full picture:
  - **Vector Matching:** "What roles could you DO based on skills?" (extracted skills vs role requirements)
  - **Success Pattern Analysis:** "Will EY actually PROMOTE you?" (EY metrics vs advancement benchmarks across 6 categories)
- Both are required. An employee could have perfect skill match for a Manager role but never get promoted due to low utilization and no mentees. Conversely, perfect EY metrics don't help if you lack the technical skills for a specific role.
- **Why it matters:** Transforms vague feedback into actionable insights. Instead of "you need more visibility," employees get: "Employees who advanced to Manager averaged 2+ mentees (you: 0). Consider taking on a mentee to match promotion patterns."

**4. Natural Progression & Trajectory Comparison**

- **The problem:** Employees need to understand their next EY level regardless of whether they're a good match for it. Also, choosing between staying on track vs. making a lateral move requires seeing the FULL career path, not just the next step.
- **Our solution:**
  - **Always show natural progression:** The employee's next EY level (e.g., Manager→Senior Manager) is ALWAYS displayed, regardless of match score. Three states: Aligned (≥75%), Stretch (50-74%), Misaligned (<50%).
  - **Trajectory comparison:** Show full career paths with match percentages at each step. Example: Natural progression might be 78% match now but smooth to Partner; lateral move might be 85% match now but hit a "wall" at Senior Manager (40% match).
  - **Wall detection:** Flag any future step with <50% match as a "wall" to help employees see long-term viability.
  - **Show alternatives when aligned:** Even if natural progression is ≥75%, if a lateral move ALSO has ≥75%, show both for comparison.
- **Why it matters:** Employees make informed CAREER decisions, not just next-job decisions. They can see "easy now but wall later" vs "harder now but smooth long-term."

**5. Privacy-First Architecture with PII Tokenization**

- **The problem:** Employees fear discovery when exploring internal opportunities. Traditional systems expose PII (names, emails, employee IDs) during matching, creating a barrier to internal mobility.
- **Our solution:**
  - Anonymous exploration: Employees browse roles without manager visibility
  - PII tokenization: We replace identifying information (names, emails, employee IDs) with anonymous tokens (e.g., "EMP-482910") throughout the matching pipeline. The tokenization system maintains a secure mapping that only allows identity revelation after mutual opt-in.
  - Two-sided anonymous matching: Hiring managers see tokenized candidate counts and anonymous profiles with skills/qualifications, but no PII
  - Identity revelation only after mutual opt-in: Real identity is revealed only after manager invites conversation AND employee accepts
  - Audit trails with tokenized identifiers: All matching activities are logged for compliance/security, but using tokens to maintain privacy
- **Why it matters:** Removes the "fear of discovery" barrier that prevents internal mobility. Employees can explore safely, and identity is protected until mutual interest is established.

**6. Governance & Bias Mitigation Framework**

- **The problem:** AI systems can introduce bias (disparate impact) or make unsupportable predictions, creating legal and ethical risks.
- **Our solution:**
  - "Patterns not promises" language: All recommendations use probabilistic language ("patterns suggest") rather than absolute predictions
  - Confidence intervals: We show confidence levels and ranges, not point estimates
  - Reason codes: Every recommendation includes a structured reason code explaining the inference logic
  - Bias monitoring: Continuous disparate impact testing to detect if the system favors certain groups (e.g., gender, age, ethnicity)
  - Disparate impact testing: Statistical analysis to ensure recommendations don't create adverse impact on protected classes
- **Why it matters:** Legally defensible and ethically sound. Protects the organization from discrimination claims and ensures fair treatment across all employee groups.

---

## Technical Architecture

### Technology Stack

**Backend:**

- **FastAPI (Python):** High-performance async REST API
- **GPT-5.2 Instant:** Skill inference, validation, embeddings (400K context window)
- **LangChain:** LLM orchestration, aggressive caching (semantic + prompt caching = 68.8% API call reduction)
- **PostgreSQL + pgvector:** Unified structured + vector data storage (pgvector is a PostgreSQL extension that enables vector similarity search)
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

**2. Per-Skill Vector Embedding with Aggregate Matching**

- text-embedding-3-large: Each skill gets a 3072-dimensional vector (per-skill, not per-resume)
- Skill vectors cached and reused across employees (embed "AWS" once, reuse 500 times)
- Aggregate matching: Full skill profile vs full role requirements → overall match score
- Threshold-based search (≥30% for Exploratory), no arbitrary top-K limits
- **Why:** Efficient caching, handles synonyms automatically, comprehensive search finds hidden opportunities

**3. Multi-Layer Aggressive Caching**

- **Semantic Cache:** Similar query embeddings → cached responses (68.8% API call reduction)
- **Prompt Cache:** Repeated prompt prefixes >1024 tokens (90% cost reduction)
- **Response Cache:** Exact skill inference results (7 days Time To Live)
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

- **Chroma vector queries:** <350ms at 95th percentile (demo scale)
- **Cached skill inference:** <3s (semantic cache hit)
- **Uncached skill inference:** <15s (full dual LLM pipeline)
- **Role matching:** <2s for top-10 results
- **Total memory footprint:** ~4.5GB for full stack

---

## Key Differentiators

### What Makes SpringAIS Special

1. **Two Parallel Analyses Combined:** No competitor captures both dimensions. Vector Matching shows what roles you COULD do based on skills; Success Pattern Analysis shows whether EY will actually PROMOTE you (utilization, mentees, feedback themes). Both are required—perfect skill match means nothing without the right EY metrics.

2. **Trajectory Comparison with Wall Detection:** We don't just show the next job—we show the FULL career path. Natural progression (Manager→SM→Partner) vs lateral moves, with match percentages at each step. Flags "walls" when future steps have <50% match, so employees see "easy now but wall later" vs "harder now but smooth long-term."

3. **Natural Progression Always Shown:** The system ALWAYS displays the employee's next EY level, regardless of match score. Three states (Aligned/Stretch/Misaligned) with honest assessment. Even shows lateral alternatives when they're equally strong matches.

4. **Dual LLM Validation with Multi-Skill Extraction:** Every skill inference includes evidence quotes and confidence scores. A single quote can extract multiple skills ("Python data pipeline" → Python + Data Pipeline Architecture + Big Data). Eliminates hallucinations, builds trust.

5. **Per-Skill Embedding with Aggregate Matching:** Each skill gets its own 3072-D vector (not per-resume) using text-embedding-3-large. Cached and reused across all employees. Aggregate matching compares full skill profile vs full role requirements. Threshold-based search (≥30%) ensures we never miss hidden opportunities.

6. **Privacy-First Architecture:** Anonymous exploration with PII tokenization. Identity revealed only after mutual opt-in. Removes "fear of discovery" barrier.

7. **EY-Specific Deep Integration:** Aligned with EY's promotion cycles, calibration processes, Credly badge system, and service line structures.

---

## Questions for Feedback

### Strategic Questions

1. **Business Value:** Does this solve a real problem that companies actually have? Is it clear why this would be valuable?

2. **Competition Positioning:** How does this compare to other AI/HR solutions? Is what makes us different strong enough to stand out?

3. **EY Context:** Are we accurately representing how EY works? Are we missing anything important about EY's structure or processes?

4. **Success Pattern Approach:** Is analyzing what actually got people promoted (beyond just matching skills) a compelling feature that sets us apart?

### Technical Questions

5. **Architecture:** Is the technical approach sound? Any concerns about scalability, security, or AI risks? Should we consider microservices architecture for production, or is the current monolithic structure sufficient? Are there any bottlenecks in the current stack (FastAPI → LangChain → GPT-5.2 → Chroma/Qdrant pipeline)?

6. **Dual LLM Validation:** Is the explainability approach sufficient? Does the dual LLM validation pattern effectively address hallucination concerns? Should we add additional validation layers or confidence thresholds? Are the evidence quotes and confidence scores (high/medium/low) sufficient for governance requirements?

7. **Caching Strategy:** Is the multi-layer caching approach (semantic cache, prompt cache, response cache, embedding cache) appropriate for managing LLM API costs? Are the TTLs (7 days for response cache, indefinite for embeddings) optimal? Should we implement more aggressive caching strategies?

### Competition Readiness

8. **Demo Strategy:** What should we emphasize in our 10-slide presentation? What's the most compelling "wow" moment that will impress the judges?

9. **Governance & Explainability:** Are our approaches to preventing bias and protecting privacy good enough for the competition requirements?

10. **Timeline:** Given the February 16 deadline, are we focusing on the right features? What's absolutely critical vs. what would be nice to have?

### Risk Assessment

11. **Technical Risks:** What are the biggest technical risks we should mitigate? (LLM hallucinations despite dual validation, vector matching quality/recall issues, performance degradation at scale, embedding drift over time, API rate limits/cost overruns)

12. **Competition Risks:** What could go wrong during the demo? How should we prepare for unexpected situations or tough questions from judges?

---

## Appendix: Competition Rubric Alignment

| What Judges Are Looking For                         | How SpringAIS Addresses It                                                                                                                                                                                                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI Functionality & Accuracy (20 pts)**            | Dual LLM validation with multi-skill extraction ensures accuracy; per-skill vector embedding (3072-D using text-embedding-3-large) with aggregate matching goes beyond keyword matching; two parallel analyses (Vector Matching + Success Pattern) provide complete career guidance                                |
| **Explainability & Governance (20 pts)**            | Dual LLM validation with evidence quotes for every skill; trajectory comparison shows full career paths with wall detection; reason codes for all matches; bias detection framework; privacy safeguards (PII tokenization); "patterns not promises" language                          |
| **Technical Design (20 pts)**                       | Well-structured architecture; per-skill embedding with caching (embed once, reuse across employees); threshold-based search (no arbitrary top-K limits); hybrid data architecture (PostgreSQL + pgvector, Chroma/Qdrant); multi-layer caching (semantic, prompt, response, embedding) |
| **Problem Understanding & Business Value (15 pts)** | Deep EY structure analysis; two parallel analyses address both skill fit AND promotion readiness; trajectory comparison helps employees make career decisions, not just job decisions; clear value proposition (10-20% internal fill rate lift, 30-50% time-to-fill reduction)        |
| **User Experience & Presentation (15 pts)**         | Professional UI (shadcn/ui); natural progression always shown with three states (Aligned/Stretch/Misaligned); trajectory comparison with wall detection; engaging Career Journey Map visualization (React Flow)                                                                       |
| **Innovation & Creativity (10 pts)**                | Two parallel analyses (skills + EY metrics); trajectory comparison with wall detection (unique); natural progression always shown regardless of match; multi-skill extraction per quote; per-skill embedding with aggregate matching; privacy-first anonymous matching                |

---

## What We're NOT Building

To set clear expectations, SpringAIS is **not**:

- **A replacement for SuccessFactors or EY's HR systems:** We integrate with existing systems, not replace them
- **A performance review tool:** We analyze historical patterns but don't conduct performance evaluations
- **A compensation calculator:** We don't predict or recommend salary changes
- **A job application system:** We discover opportunities and facilitate matching, but don't handle the full application process
- **A learning management system (LMS):** We recommend learning paths and time estimates, but don't host training content
- **A replacement for managers:** We provide insights and recommendations, but career decisions remain with employees and their managers
- **A production-ready enterprise system:** This is a competition prototype demonstrating core concepts, not a fully production-hardened system

**Scope Boundaries:**

- MVP focuses on matching and recommendations—not full HR workflow automation
- Uses mock data for demonstration—real EY system integration would require EY partnership
- Designed for competition demonstration—production deployment would require significant additional development

---

**Document Prepared By:** SpringAIS Team  
**Next Steps:** Incorporate partner feedback, refine solution, prepare competition submission
