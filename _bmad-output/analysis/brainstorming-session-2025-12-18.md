---
stepsCompleted: [1, 2]
inputDocuments: []
session_topic: "AI-driven internal talent mobility and upskilling platform for EY"
session_goals: "Explore technical implementation, design comprehensive upskilling paths with success patterns, develop data strategies, create bias mitigation safeguards, plan UX flows, and uncover hidden challenges"
selected_approach: "AI-Recommended Techniques"
techniques_used: ["Question Storming", "Cross-Pollination", "Six Thinking Hats"]
ideas_generated:
  [
    "Dual LLM Validation",
    "Pure Vector Semantic Matching",
    "Career Journey Map",
    "Anonymous Two-Sided Matching",
    "Career Competitiveness Dashboard",
    "Comprehensive Success Pattern Analysis",
    "Six-Category Metric Benchmarking",
    "Nine Box Position Indicators",
    "Feedback Theme NLP Analysis",
    "Holistic Development Recommendations",
    "EY System Integration Architecture",
    "Agile Promotions Alignment",
    "Mobility4U-Style Discovery",
    "Credly Badge Integration",
  ]
context_file: ""
last_updated: "2025-12-18"
primary_research_added: true
ey_metrics_research_added: true
ey_internal_systems_research_added: true
---

# Brainstorming Session Results

**Facilitator:** Clays
**Date:** 2025-12-18

## Session Overview

**Topic:** AI-driven internal talent mobility and upskilling platform for EY

**Goals:**

- Explore technical implementation across all dimensions (architecture, LLM integration, anonymization, data pipelines)
- Design comprehensive upskilling paths that include: skill gaps, "above and beyond" differentiators, timeline estimates, learning resources, AND pattern insights from successful role holders
- Identify data strategy approaches for both SuccessFactors/Credly and fallback scenarios
- Develop robust bias mitigation and ethical safeguards
- Plan user experience flows for employees, managers, and admins
- Uncover hidden challenges and opportunities in early-stage exploration

### Session Setup

This is a comprehensive exploration session for building an AI-powered talent platform that goes beyond traditional job matching. The system will enable proactive career development by matching employee skills to ANY role at EY (currently open or future opportunities), while incorporating historical success patterns from employees who have excelled in those roles. The platform features three user types (employees, hiring managers, admins) with strong privacy and bias mitigation through PII stripping and anonymous matching.

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Early-stage complex technical system with ethical considerations, data uncertainty, and need to uncover hidden challenges

**Recommended Techniques:**

1. **Question Storming (Deep):** Generate questions before seeking answers to properly define problem space and uncover hidden challenges across technical, ethical, data, and UX dimensions. Perfect for early-stage exploration when you "might not know what these challenges are yet."

2. **Cross-Pollination (Creative):** Transfer battle-tested solutions from adjacent industries - Healthcare privacy (HIPAA de-identification), FinTech explainable AI (credit scoring), Gaming progression systems (skill trees), LinkedIn skills matching, Netflix recommendation transparency - to solve similar problems in the talent platform context.

3. **Six Thinking Hats (Structured):** Systematically explore the platform through six perspectives (facts, emotions, benefits, risks, creativity, process) to balance competing priorities: privacy vs. matching accuracy, employee autonomy vs. manager visibility, innovation vs. compliance, technical feasibility vs. user needs.

**AI Rationale:** This sequence addresses the multi-dimensional nature of your challenge by first uncovering critical questions and unknowns, then importing proven solutions from parallel domains, and finally integrating diverse perspectives into a comprehensive technical and ethical foundation. The progression moves from problem definition → solution transfer → systematic integration.

---

## Technique 1: Question Storming (Deep)

**Objective:** Generate questions before seeking answers to properly define problem space and uncover hidden challenges

**Facilitation Approach:** Rapid-fire question generation across all dimensions without filtering - focus on unknowns, uncertainties, and "what we should be asking"

### Critical Questions Generated

#### 1. Data Strategy & Architecture

- What is the structure of our dataset going to be?
- If we can't get access to EY's data, how will we go about getting the data?
- How can we plan to use the fallback system, and be able to implement the HR data if and when we get it?
- Are there any external APIs we can use (O\*NET)?
- How are we going to be able to dynamically update the database to include new extrapolated skills?
- How can we ensure that skills are properly kept track of (i.e., C# and csharp are the SAME skill, but might be seen differently because of wording)?
- What happens when SuccessFactors data is incomplete or contradictory?
- How do we handle employees who haven't updated their Credly badges in 2 years?
- What's the data retention policy? (GDPR, privacy laws)
- How do we handle employees who leave EY? Delete their data? Keep for pattern analysis?

#### 2. LLM Strategy, Consistency & Reliability

- Since we are using LLMs, how can we ensure responses will be consistent and avoid hallucinations?
- How can we correctly "extrapolate" skills from inferencing?
- Should we use human validation to train the LLM?
- Is human-in-the-loop better for HR, or would a standalone LLM be more beneficial?
- Should we have the LLM give a confidence score when it extrapolates a skill?
- What AI model is best at inferring skills (and how good)?
- Do we need to train an LLM? Which LLM? RAG vs training?
- What's the ground truth for validation? (How do we know the LLM inferred correctly?)
- What's the confidence threshold for keeping vs. discarding inferred skills?
- Can employees contest/remove inferred skills the LLM got wrong?
- How do we prevent "skill inflation" where everyone gets every possible skill inferred?
- What if the LLM infers skills from outdated projects? (Employee did JavaScript 5 years ago but hasn't touched it since)
- How do we version control the LLM prompts for consistency?
- How do we handle LLM API rate limits at scale? (10,000 employees × multiple roles = massive API costs)
- What's the rollback plan if an LLM update changes inference behavior?
- How do we handle passing the raw data from LLM to LLM?

#### 3. Bias Measurement & Validation ⚠️ CRITICAL

- What are the biases that exist, and how can we mitigate them?
- **How can we be confident that we truly mitigate bias and fairness?**
- **How do we even MEASURE bias in our system? What metrics?**
- Who defines what "fair" means in this context? EY? Legal? Employees?
- **What if bias exists in the SUCCESS PATTERNS we're learning from?** (If historically successful people had advantages, we'd encode those advantages as "requirements")
- How do we test for bias we DON'T KNOW EXISTS yet?
- What's the feedback loop when someone claims the system is biased?
- Do we need external auditing or third-party bias validation?
- How do we avoid encoding "old boys club" patterns? (If historically only certain types of people got promoted)

#### 4. Matching Logic & Thresholds

- What's the threshold for a "match"? 70%? 80%?
- How do we recognize/weight hard requirements vs. inferred/preferred qualifications?
- What if someone is a 95% match but has a known performance issue? (Do we integrate performance data? Should we?)
- How do we prevent gaming the system? (Employees adding fake skills to get recommended)
- What if the "best match" is someone the hiring manager has a conflict with? (The anonymity protects this, but what happens when revealed?)

#### 5. Legal, Compliance & Risk

- How can we protect against misuse?
- **How should we word recommendations to avoid legal penalties?** Our recommendations are a trend analysis, not hard facts.
- What are the HR implications of creating an upskilling path on behalf of the company?
- What exact language shifts liability? ("You are qualified" vs. "Your profile shows 73% alignment")
- Do we need legal review on every template/message the system generates?
- What if an employee is NOT recommended but SHOULD have been? (Discrimination lawsuit risk)
- What if an employee IS recommended, applies, doesn't get the job, and claims the AI misled them?
- Do we need disclaimers on every page? Terms of service? Do we add a disclaimer page?
- Who's liable if the upskilling path recommendation is wrong? EY? Your team? The employee?
- How can we provide a trail of traceable data for HR implications?
- What all does the admin get to see?

#### 6. User Experience & Communication

- How can we ensure that this is easing pain points for both the user AND EY?
- How will this provide use for the company rather than being a hassle?
- How do we take the raw data/AI rationale and transform that into good solid human-readable data?
- Do we work it as a recommendation? Or do we simply just say that their raw skills match a job, and present them with common trends of skills in that role?
- Should we allow for users to create specific upskilling paths? (i.e., a job doesn't exist at EY, but they want to upskill in case it does)

#### 7. Competitive Differentiation & Market Research

- How can we stand out from typical (existing) HR/AI solutions?
- Have people tried to do this before? What were their results/findings?

#### 8. Success Pattern Feature (Novel Feature Risks)

- How far back do we look for "successful role holders"? 5 years? 10 years?
- What if the role has CHANGED significantly? (Skills for "Data Scientist" in 2015 vs. 2025 are very different)
- What if there's only been 2 people in this role ever? Is that enough data for pattern analysis?

#### 9. MVP & Success Metrics

- What's the MVP? Which features MUST be in v1 vs. nice-to-have?
- What's the success metric? How do you know if this is working? (Increased internal mobility? Employee satisfaction? Reduced external hiring costs?)
- Who are your pilot users? Will you test with a small group first?
- What's the governance model? Who decides when the system is wrong?
- How do we handle edge cases? (Someone with 20 years experience but no digital footprint, someone who took a 5-year career break, someone in a brand new role with no historical data)

### Key Breakthroughs from Question Storming

**"Oh Shit" Moments (Potential Project Killers):**

1. **Inherited Bias in SuccessFactors Data** ⚠️

   - Not just worried about bias we introduce - we're inheriting systemic bias from SOURCE DATA
   - If historically only certain demographics got promoted into senior roles, and we're learning "success patterns" from those people, we've just built an AI system that perpetuates historical discrimination
   - This could get the project shut down by EY's legal/compliance team or result in discrimination lawsuits

2. **No Way to Measure Bias** ⚠️
   - Can't fix what you can't measure
   - Currently have good intentions (strip PII) but no way to PROVE the system is fair
   - Need: quantifiable bias metrics, testing methodology, baseline measurements, ongoing monitoring
   - Without this, we're flying blind on core ethical promise

**Most Critical Question Clusters Identified:**

1. Bias measurement & validation (can't prove fairness)
2. LLM inference accuracy & validation (no ground truth)
3. Legal liability in recommendation wording
4. Data strategy dual-path implementation

**Total Questions Generated:** 30+ across 9 major domains

**Energy & Engagement:** High focus and rapid discovery - uncovered significant unknowns that weren't on the radar before, particularly around inherited bias in training data and lack of bias measurement framework.

---

## Technique 2: Cross-Pollination (Creative) - IN PROGRESS

**Objective:** Transfer battle-tested solutions from adjacent industries to solve the hardest technical and ethical challenges

**Facilitation Approach:** Identify parallel problems in other industries, then adapt their proven solutions to talent platform context

### Industry Raid #1: Healthcare (HIPAA-Compliant De-identification)

**Problem Being Solved:** Need to strip PII while maintaining matching utility + traceable data trail for compliance

**Healthcare's Solution (Epic/Cerner Medical Records Systems):**

**Tokenization Approach:**

- Replace PII with consistent tokens (Patient "John Smith" becomes "PT-847392" across ALL systems)
- This token is the ONLY link between anonymous data and real identity (stored in separate secured database)
- Critical insight: The token allows maintaining relationships (this person's skills, history, applications) WITHOUT exposing identity
- Audit trail: Every access to the token→identity mapping is logged for HIPAA compliance

**Potential Adaptation for Talent Platform:**

- Employee "Jane Doe" becomes "EMP-482910"
- All skill data, matching, LLM inference uses ONLY the token
- Hiring manager sees "EMP-482910 is 87% match" - identity revealed ONLY when employee opts in
- Audit trail: Log every time someone requests to see behind the token (compliance tracking)

**"Minimum Necessary" Principle from HIPAA:**

- HIPAA requires sharing ONLY the minimum data needed for the task
- Applied to talent system:
  - Matching algorithm: Gets skills + experience years (no names, no demographics)
  - Upskilling path: Gets current skills + target role (no employment history beyond skills)
  - Manager: Gets match count + aggregate statistics (no individual data until opt-in)

**✅ USER DECISION:** Minimum necessary is actionable and aligns with planned approach. Skills + experience are bare minimum needed for matching.

---

### Industry Raid #2: FinTech (Explainable AI for Credit Scoring)

**Problem Being Solved:** Explainable AI recommendations + legal liability mitigation + confidence scoring

**FinTech's Solution (FICO, Upstart, ZestAI):**

Credit scoring AI faces identical challenges: must explain decisions, can't say "the AI said so," must avoid bias in historical data, high legal stakes.

**Key Solutions:**

1. **Reason Codes (Not Just Scores):**

   - Provide 4-5 specific reason codes: "High credit utilization" not just "720 score"
   - Human-readable, actionable, legally defensible
   - **Adaptation:** "Strong alignment in: Cloud Architecture (5 years exp), Python (expert). Growth areas: Financial modeling, Client presentation"

2. **Confidence Intervals + Model Uncertainty:**

   - Show uncertainty: "Probability of default: 5-8%" (not claiming certainty)
   - Quantify risk, don't claim absolute truth
   - **Adaptation:** "Inferred skills (high confidence): React, TypeScript. Inferred skills (medium confidence): UX design" + "73-79% alignment range"

3. **Adverse Action Notices (Legal Language):**

   - Specific language that shifts liability: "Based on information in your credit report from..."
   - Uses "may" not "will": "This MAY affect your eligibility"
   - **Adaptation:** "Based on skills data from SuccessFactors/Credly, your profile shows alignment..." + "This analysis SUGGESTS potential fit and MAY inform career development" + "Recommendations are informational only"

4. **Bias Testing - Disparate Impact Analysis:**
   - Statistical tests: Does model approve different demographics at similar rates?
   - Test on protected classes WITHOUT using those variables in model
   - Four-Fifths Rule: Are approval rates within 80% for all groups?
   - **Adaptation:** Track post-PII stripping: Does system recommend promotions at similar rates across gender/race/age? Run quarterly audits.

**✅ USER DECISIONS:**

- ✅ LOVE specific reasons for matches (must have)
- ✅ LOVE probability/confidence scores (must have)
- ✅ LOVE framing as "opinions" not "facts/recommendations" (critical for legal safety)
- ⏸️ Bias tracking via disparate impact analysis (post-MVP, not v1 - but recognized as important)

---

### Industry Raid #3: Gaming (Skill Trees & Progression Systems)

**Problem Being Solved:** Visualizing upskilling paths + motivating employees + showing success patterns

**Gaming's Solution (World of Warcraft, Path of Exile, RPGs):**

Gaming has perfected progression path visualization and skill development motivation.

**Key Solutions:**

1. **Visual Progression Maps (Skill Trees):**

   - Current skills = highlighted/filled nodes
   - Available next steps = clickable (gap-closers)
   - Locked future skills = requires prerequisites
   - Recommended builds from top players = golden/starred path
   - **Adaptation:** Visual upskilling map with current skills (green), next recommended skills (yellow), advanced skills (gray/locked), "successful employees typically had these" (golden/starred)

2. **Multiple Paths to Same Destination:**

   - Show 2-3 viable routes: "Technical Expert Path" vs. "Leadership Path" vs. "Hybrid Path"
   - **Adaptation:** Path A (technical depth), Path B (leadership/soft skills), Path C (fast track - what 80% of successful role holders did)

3. **Time Estimates:**

   - Show expected duration: "This quest takes 30 minutes"
   - Players can plan their progression
   - **Adaptation:** "AWS Certification: 3-6 months (based on employee data)" + skill acquisition time estimates

4. **Achievement Unlocks & Milestones:**
   - Celebrate progress: "You've unlocked Advanced Spellcasting!"
   - Creates motivation and forward momentum
   - **Adaptation:** "You've closed 3 of 7 skill gaps for Senior Consultant!" + "You're now in top 20% of candidates" + progress bars

**✅ USER DECISIONS:**

- ✅ LOVE skill tree visualization (must have)
- ✅ LOVE multiple paths to same role (must have)
- ✅ YES to time estimates (helpful for planning)
- ❌ NO to difficulty ratings (potential deterrent)
- ✅ LOVE gamification/making it fun and rewarding (great incentive for engagement)

---

### Industry Raid #4: LinkedIn/Indeed (Skills Matching & Normalization)

**Problem Being Solved:** Skill normalization (C# vs. csharp) + skill inference + matching accuracy

**LinkedIn's Solution (LinkedIn Skills Graph):**

World's largest professional skills database - solved exact normalization problem.

**Key Solutions:**

1. **Canonical Skill Names + Aliases:**

   - One canonical name: "C# Programming"
   - Multiple aliases map to it: "C#", "csharp", "C Sharp", "c sharp programming"
   - All variations resolve to same skill ID
   - **Adaptation:** Build/use skills ontology (O\*NET taxonomy), map all variations to canonical IDs before LLM matching, pre-process job descriptions AND employee profiles

2. **Skill Relationships & Hierarchies:**

   - "React" ⊂ "JavaScript" ⊂ "Web Development"
   - If you have React, you implicitly have JavaScript knowledge
   - **Adaptation:** Give partial credit for related skills. Job requires "JavaScript" + employee has "React + Node.js" = likely 100% coverage. Use skill taxonomy to infer broader competencies.

3. **Endorsements = Confidence Weights:**

   - Self-reported < endorsed skills
   - Recent job skills > old skills
   - **Adaptation:** Credly badges = high confidence (verified), recent projects = medium-high, old resume = low (skill decay), LLM-inferred = medium (needs validation)

4. **"People Also Have" Recommendations:**
   - "People with Python also often have: Pandas, NumPy, scikit-learn"
   - Discover skill clusters
   - **Adaptation:** "Successful people in this role typically ALSO have: [skill cluster]" - this IS the success pattern feature

**✅ USER DECISIONS:**

- ✅ LOVE ALL OF IT - "exactly what we want to do with skills"
- ✅ Skill normalization/canonical IDs (critical for accuracy)
- ✅ Confidence weighting (aligns with FinTech confidence scores)
- ✅ Skill hierarchies/relationships (better matching logic)
- ✅ Success pattern clusters (core differentiator feature)

---

### Industry Raid #5: Netflix (Recommendation Transparency)

**Problem Being Solved:** How to explain WHY the AI recommended this role without exposing the "black box"

**Netflix's Solution:**

Shows "Because you watched X" or "Top pick for you: 98% match"

- DON'T explain full algorithm
- Give JUST ENOUGH transparency to build trust
- Show different explanations to different users (personalized reasoning)

**Potential Adaptations:**

- "Based on your Cloud Architecture and Python expertise" (shows what drove the match)
- "Employees with similar backgrounds successfully transitioned to this role" (social proof without exposing individuals)
- "Your Agile certification strongly aligns with this role's requirements" (highlights specific strengths)

**✅ USER DECISION:** LIKE - helps with "human-readable explanations" challenge. Enough transparency to build trust without overwhelming with algorithmic details.

---

### Industry Raid #6: Duolingo (Adaptive Learning Paths)

**Problem Being Explored:** Personalized upskilling paths + time estimates + engagement

**Duolingo's Solution:**

Daily goals adapt to pace, streak tracking, adjusts difficulty based on performance, time commitment flexibility

**✅ USER DECISION:** ❌ TOO MUCH - "This is a professional helper, not attempting to get users hooked with cheesy lines." Want to encourage growth professionally. Path should be set from the beginning, progress should be trackable, but avoid gamification overload.

---

### Industry Raid #7: Spotify (Personalization & Discovery Balance)

**Problem Being Solved:** Balancing personalized recommendations with serendipitous discovery + avoiding filter bubbles

**Spotify's Solution:**

1. **Multiple Recommendation Modes:**
   - "Made For You" playlists = highly personalized based on your history
   - "Discover Weekly" = stretch recommendations (similar but new)
   - "Daily Mix" = comfort zone (what you already like)
   - Genre-specific playlists = exploration beyond your profile

**Your Adaptation - Multiple Role Discovery Modes:**

- **"Best Fit For You"** = Roles matching 70%+ of your current skills (high probability of success)
- **"Stretch Opportunities"** = Roles requiring 1-2 new skill areas (growth opportunities, 50-70% match)
- **"Exploratory Paths"** = Roles in different departments/functions you haven't considered (career pivots)
- **"Trending at EY"** = Roles with high demand/growth regardless of your profile (market signals)

2. **Avoiding Echo Chambers:**
   - Spotify intentionally injects variety: "You listen to 90% rock, here's some jazz that rock fans enjoy"
   - Prevents you from getting stuck in narrow recommendation loops

**Your Adaptation:**

- If employee only views technical roles, occasionally surface leadership opportunities
- If viewing only junior roles, show stretch senior roles to inspire long-term planning
- "People with your background also explored: [unexpected role category]"

3. **Confidence in Recommendations:**
   - Spotify doesn't show ALL their recommendations at once
   - They show top 5-10 high-confidence matches first
   - Lower confidence = further down the list or in "You might also like" section

**Your Adaptation:**

- Tier role recommendations: "Top Matches (75%+)" vs. "Growth Opportunities (60-75%)" vs. "Exploratory (40-60%)"
- Clear visual hierarchy - don't overwhelm with 100 possible roles
- Let users expand into lower-confidence recommendations if interested

4. **Taste Profile Building Over Time:**
   - Spotify learns: Which recommendations did you click? Which did you skip?
   - Improves future recommendations based on implicit feedback

**Your Adaptation:**

- Track which roles employees explore/save/apply to (implicit interest signals)
- Track which upskilling paths they start (commitment signal)
- Improve future role recommendations: "You viewed 5 Cloud Architecture roles, here are 3 more"
- **Privacy consideration:** This tracking is FOR the employee's benefit, not employer surveillance

---

### Industry Raid #8: Tinder/Dating Apps (Two-Sided Matching & Mutual Opt-In)

**Problem Being Solved:** Matching requires BOTH parties to opt in + anonymous browsing + preventing awkward mismatches

**Dating Apps' Solution:**

1. **Mutual Match Requirement:**
   - Manager can't see candidates until candidates express interest
   - Candidate can't see manager's identity until mutual interest
   - Prevents one-sided reveals and awkward situations

**Your Adaptation (THIS IS YOUR CORE FEATURE):**

- Manager posts role → System identifies 7 potential matches (shows COUNT only, not identities)
- Employees see: "You're identified as a potential match for [Role Title in Department X]"
- Employee opts in: "Yes, I'm interested in learning more"
- ONLY THEN does manager see: "EMP-482910 (87% match) has expressed interest"
- ONLY WHEN manager invites candidate does identity get revealed
- **This is your "anonymous blast" feature working perfectly**

2. **"Suggested for You" vs. "You Suggested":**
   - Bumble shows: "You appeared in 47 people's stacks today" (you're being seen, even if no matches yet)
   - Builds confidence that the system is working

**Your Adaptation:**

- Employees see: "Your profile has been identified as a potential match for 3 roles this month"
- Even if they don't opt in, they know the system is working for them
- Hiring managers see: "12 potential matches identified, 4 have opted in to learn more"

3. **Profile Completeness Prompts:**
   - Dating apps: "Add 2 more photos to increase matches by 40%"
   - Incentivizes better data quality

**Your Adaptation:**

- "Add 3 more Credly badges to improve matching accuracy"
- "Update your SuccessFactors profile to unlock more role recommendations"
- "Employees with complete profiles are 2x more likely to be matched"
- **Benefit:** Improves your data quality without being pushy

4. **Deal Breakers & Filters:**
   - Dating apps let you filter: "Must be within 10 miles" or "Must want kids"
   - Hard constraints vs. preferences

**Your Adaptation:**

- Employees set preferences: "Only remote roles" or "Only roles in Consulting division" or "Only roles requiring <20% travel"
- These are HARD FILTERS (don't waste anyone's time)
- Managers set requirements: "Must have PMP certification" (hard requirement) vs. "Prefer AWS certification" (nice to have)
- Your matching engine respects hard constraints, scores on preferences

---

### Industry Raid #9: GitHub (Skill Verification via Public Work)

**Problem Being Solved:** How do we know someone ACTUALLY has the skills they claim? Proof of work vs. self-reporting

**GitHub's Solution:**

1. **Contribution Graph = Objective Evidence:**
   - Green squares showing consistent work
   - Public repositories as portfolio
   - Code speaks for itself - no need to self-report "I know Python"

**Your Adaptation:**

- Integrate with EY's internal project repositories/wikis (if accessible)
- Parse project history: "Led 3 cloud migration projects 2022-2024" = objective evidence of cloud skills
- Weight verified project work > self-reported skills
- **This solves your "ground truth" problem for LLM inference validation**

2. **Language Breakdown:**
   - GitHub shows: "Python 45%, JavaScript 30%, TypeScript 25%" based on actual code commits
   - Objective skill distribution

**Your Adaptation:**

- If you can access project metadata: "75% of your projects involved data analysis, 25% involved architecture design"
- Infer skill depth: Worked on 1 Python project (beginner) vs. 15 Python projects over 3 years (expert)
- Recency matters: Last Python project was 2018 (skill decay) vs. current active project (fresh skill)

3. **Contributions to Popular Projects:**
   - Contributing to React codebase = credibility signal
   - Open source contributions = public verification

**Your Adaptation:**

- Led high-visibility EY projects = credibility signal
- Client-facing project experience = different skill set than internal projects
- Cross-functional project involvement = leadership/collaboration skills
- **This helps with "success pattern" analysis - what projects did successful role holders work on?**

4. **Stars, Forks, Followers = Reputation:**
   - Social proof of skill quality
   - Peer recognition

**Your Adaptation:**

- Internal EY recognition: Project awards, peer endorsements, manager feedback
- Credly badge endorsements
- Mentor relationships (mentored X people in skill Y = expert level)
- Speaking at internal EY events = thought leadership signal

---

### Industry Raid #10: Stack Overflow (Reputation Systems & Skill Validation)

**Problem Being Solved:** How to quantify expertise in a skill? How to separate beginners from experts?

**Stack Overflow's Solution:**

1. **Reputation Score = Meritocracy:**
   - Answer questions correctly → earn reputation
   - Reputation in specific tags: "Python: 5,420 rep" vs. "JavaScript: 240 rep"
   - Tag-specific reputation = skill-specific credibility

**Your Adaptation:**

- Track internal EY knowledge sharing: Answered Slack questions about AWS? Mentored junior employees in Python?
- Skill-specific credibility: "Recognized expert in cloud architecture (mentored 12 people, answered 47 questions)"
- This is OBJECTIVE EVIDENCE of skill mastery, not self-reporting
- **Could integrate with internal EY collaboration tools if available**

2. **Badges for Specific Achievements:**
   - "Great Question" badge, "Reversal" badge (turned around downvoted answer)
   - Concrete achievements, not subjective ratings

**Your Adaptation:**

- Map to Credly badges (already in your plan)
- Internal EY recognition badges: "Innovation Award," "Mentorship Excellence," "Client Impact Award"
- These become HIGH CONFIDENCE skill signals in your matching

3. **Accepted Answers = Validation:**
   - Your answer was marked as THE solution = peer validation of expertise
   - Not self-reported, community-verified

**Your Adaptation:**

- Solutions you delivered that became "best practices" at EY
- Frameworks/tools you built that others adopted
- Knowledge base articles you wrote that are highly referenced
- **This is PROOF of skill application, not just skill possession**

4. **Minimum Reputation for Advanced Actions:**
   - Need 50 rep to comment, 3,000 rep to cast close votes
   - Prevents gaming the system with fake accounts

**Your Adaptation:**

- "Expert" designation requires: Credly badge + 3+ years experience + mentored others + project leadership
- "Proficient" = Credly badge OR 2+ years experience OR complex project work
- "Familiar" = 1 project or self-reported
- Clear skill level tiers with objective criteria

---

### Cross-Pollination: Final Synthesis

**10 Industries Raided, Solutions Stolen:**

**Anonymization & Privacy:** Healthcare tokenization, minimum necessary principle
**Explainability & Legal:** FinTech reason codes, confidence intervals, legal language framing
**Visualization & Engagement:** Gaming skill trees, multiple paths, milestones (professional tone)
**Skill Normalization:** LinkedIn canonical IDs, hierarchies, confidence weighting
**Recommendation Transparency:** Netflix "because you have X" explanations
**Personalization Balance:** Spotify multiple discovery modes, avoiding echo chambers
**Two-Sided Matching:** Tinder mutual opt-in, anonymous browsing, profile completeness
**Skill Verification:** GitHub contribution graphs, project history, objective evidence
**Reputation Systems:** Stack Overflow tag-specific expertise, peer validation, achievement badges

**Core Architecture Decisions Validated:**
✅ Tokenization for anonymity
✅ Confidence scoring for all inferences
✅ Specific reasons for matches (not black box)
✅ Legal framing as "suggestions" not "facts"
✅ Skill tree visualization (professional, not gamified)
✅ Multiple paths to same role
✅ Skill normalization via canonical IDs
✅ Mutual opt-in for manager/employee matching
✅ Objective skill verification via project history
✅ Tiered recommendation confidence

**✅ USER DECISIONS ON FINAL 4 RAIDS:**

**Spotify (Personalization Balance):**

- ✅ LIKE - Multiple recommendation modes, tiered confidence, learning from behavior

**Tinder (Two-Sided Matching):**

- ✅ YES - "This nails the anonymous blast feature." Mutual opt-in is core to the product.

**GitHub (Skill Verification via Project Work):**

- ✅ LIKE the concept - Would solve ground truth/validation problem
- ⚠️ DATA CONSTRAINT: "Highly doubt EY would give us this data, we would have to create mock data to be able to do this"
- 📝 NOTE: If project history unavailable, fall back to Credly badges + SuccessFactors data + LLM inference with confidence scoring
- 📝 FUTURE: If EY grants access later, this becomes a powerful enhancement for v2+

**Stack Overflow (Reputation & Skill Levels):**

- ✅ LIKE - Skill level tiers and objective criteria
- ⚠️ DATA UNKNOWN: "Need to figure out what we get from Credly / how we get this data"
- 📝 ACTION ITEM: Research Credly API capabilities - what metadata is available? (badge name, issue date, expiration, endorsements, skill tags?)
- 📝 FALLBACK: If Credly data is limited, use badge presence as binary (has/doesn't have) with high confidence weight

---

### Data Availability Reality Check

**Confirmed Available (if EY grants access):**

- SuccessFactors: Job descriptions, employee profiles, role requirements
- Credly: Badge data (unknown scope - needs research)
- Public EY job postings: Fallback for role descriptions

**Uncertain / Unlikely:**

- Project history and contribution graphs (would need mock data for MVP)
- Internal knowledge sharing / mentorship tracking (may not exist in structured form)
- Performance reviews / manager feedback (privacy/access concerns)

**MVP Data Strategy:**

- Start with SuccessFactors + Credly (if available)
- Fallback to scraped public job postings + manual data entry
- Mock project history for demonstration purposes
- Focus on what's achievable, design for future data expansion

---

## Technique 3: Six Thinking Hats (Structured) - IN PROGRESS

**Objective:** Systematically explore the platform through six perspectives to balance competing priorities and integrate insights into comprehensive strategy

**Facilitation Approach:** Cycle through each "hat" (perspective) to ensure comprehensive analysis from all angles

### 🤍 WHITE HAT: Facts & Data (Objective Reality)

**Project Context - CRITICAL FACTS:**

**Competition Context:**

- **Purpose:** AIS (Association for Information Systems) competition submission
- **Sponsor:** EY (competition partner, not client)
- **Deliverable:** Prototype/demonstration system, not production deployment
- **Implication:** NO access to real EY data - must create convincing mock data and demonstrate feasibility

**Timeline & Resources:**

- **Deadline:** 2 months to MVP/demo
- **Team:** 4 developers
  - 1 Backend developer
  - 2 Frontend/UI/UX developers
  - 1 "Connecting" developer (integration/full-stack specialist)
- **Work Structure Required:** Epic-based containers for parallel independent work
- **Budget:** Limited but can afford LLM API costs; additional spending requires strong justification

**Technical Stack (Proposed):**

- **Backend:** Python with FastAPI
- **Frontend:** React (TypeScript)
- **Approach:** Use existing code/libraries/templates where possible (don't reinvent the wheel)
- **Stack Flexibility:** Open to alternatives if more optimal options exist

**Data Reality:**

- **SuccessFactors/Credly:** NO real access (competition scenario)
- **EY Infrastructure:** Unknown (not EY employees, competition participants)
- **Data Strategy:** Create realistic mock data that demonstrates concept viability
- **Public Resources:** Can scrape public EY job postings for realistic role descriptions

**Product Scope:**

- **Target Users:** EY employees (simulated in demo)
- **Three User Roles:** Employees, Hiring Managers, Admins
- **Core Features:**
  1. Anonymous two-sided matching (Tinder-style mutual opt-in)
  2. LLM-based skill inference and normalization
  3. Success pattern analysis from historical role holders
  4. Skill tree visualization with upskilling paths
  5. Explainable AI with confidence scoring

**Known Technical Constraints:**

- LLM API rate limits (need caching/optimization)
- 2-month development window (requires aggressive prioritization)
- Parallel development required (4 devs working simultaneously)
- Demo needs to be impressive but not production-complete

**Unknown Factors Requiring Research:**

- Credly API structure and capabilities
- O\*NET taxonomy integration complexity
- Skill normalization library availability (existing solutions vs. build custom)

**✅ TECH STACK DECISIONS (Confirmed):**

**Infrastructure & Orchestration:**

- **Docker + docker-compose** - containerized architecture for parallel development
  - Backend, frontend, postgres, chromadb all in separate containers
  - Volume mounts for hot-reload during development
  - Single `docker-compose up` command for entire stack
  - Eliminates "works on my machine" issues across 4-dev team
  - Connecting dev manages orchestration, others work independently

**Backend:**

- FastAPI (Python) - async, modern REST API
- **GPT-5.2 Instant** - skill inference, matching explanations, reasoning, embeddings generation
  - 400K context window, 30% fewer errors than GPT-5.1
  - Pricing: $1.75/M input, $14/M output
  - Justification: Latest model, superior accuracy for demo, cost manageable for competition scope
- LangChain - LLM orchestration, prompt management, aggressive caching
- PostgreSQL - structured data (employees, roles, matches)
- **Chroma** - vector database for semantic similarity matching
  - Local deployment (no external API dependencies)
  - Stores skill embeddings for employees and roles
  - Handles synonym matching automatically (C# = csharp via semantic similarity)
  - Powers "related skills" and success pattern features
- O\*NET API (optional) - skill metadata only (categories, types) if time permits

**Frontend:**

- React + TypeScript
- shadcn/ui or Tailwind CSS - professional UI without CSS time sink
- React Flow - skill tree visualization (interactive node graphs)
- Recharts - analytics dashboards (match statistics, success patterns)

**Development Philosophy:**

- Use existing libraries/templates (don't reinvent)
- Cache LLM responses aggressively (minimize API costs)
- Docker containers enable parallel 4-dev epic-based workflow
- Focus on "demo magic" over production scalability

---

### ❤️ RED HAT: Emotions & Intuition

**Employee Emotional Journey:**

**First Login - Positive Discovery:**

- Seeing "You're a potential match for 3 roles this month" = Happy, validated, opportunities exist
- Emotional tone: Hopeful and empowered

**Match Percentage - Critical UX Insight:**

- ✅ High percentage (70%+) = Feels good, inspiring
- ❌ Low percentage (50%) alone = Discouraging, demotivating
- **🔥 NEW FEATURE IDEA:** Show progression path alongside percentage
  - "50% match → 70% if you complete: AWS Certification, Financial Modeling course"
  - Transforms discouragement into actionable hope
  - Makes low matches feel achievable, not defeating

**Anxiety Elimination - Core Design Principle:**

- Must feel SAFE to explore other roles
- No fear of current manager discovering exploration
- Internal mobility is FOR the company - reframe as positive, not disloyalty
- Anonymity is empowerment, not just privacy

**Hiring Manager Emotional Journey:**

**Seeing Matches:**

- Happy to find internal talent (cost savings, retention)
- "12 matches, only 2 opted in" = Initially disappointing BUT if those 2 are strong candidates, acceptable

**🔥 NEW FEATURE IDEA - Anonymous Decline Feedback:**

- When employees decline to opt in, allow optional anonymous feedback
- Examples: "Not interested in travel requirements," "Seeking remote-only roles," "Timeline doesn't work"
- **Value:** Hiring manager gets actionable intel without employee exposure
- **Trust:** Employee can be honest without fear of being "outed"
- **System improvement:** Aggregate patterns help refine role descriptions

**Tokenized Candidates:**

- "EMP-482910 (87% match)" = Intriguing, trust AI judgment
- Not dehumanizing if accompanied by rich skill explanations

**Competition Judges - The "Holy Shit" Standard:**

**First 30 Seconds Goal:**

- "How did these kids manage to do this?!"
- Immediate visual impact - HOLY SHIT THIS IS IMPRESSIVE
- Not just "nice" - must be internship-offer-worthy

**Demo Requirements:**

- Look professional (not student project aesthetic)
- Feel polished (smooth interactions, no janky UX)
- Be sophisticated (obvious technical depth)
- Act production-ready (even if it's not)

**End Goal Emotion:**

- Judges want to offer internships ON THE SPOT
- "This team gets it" + "This could work at EY" + "Technically impressive"
- All three emotions simultaneously

**Team's Core Emotional Drivers:**

1. **What excites us:** Creating something judges will want to offer us jobs for
2. **What scares us:** Not being impressive enough, looking like "just another student project"
3. **Demo day target feeling:** Walking off stage knowing we crushed it, internship-worthy performance

---

### 💛 YELLOW HAT: Benefits & Optimism (Best Case Scenario)

**IDEAL Outcome - EY Business Transformation:**

**For EY Culture:**

- Fosters internal community that encourages retention and upward mobility
- Employees WANT to work for EY (attraction)
- Employees at EY WANT to move up at EY rather than transfer to competitors (retention)
- Employee upskilling benefits the company while requiring minimal company overhead
- Hiring managers look to internal hires FIRST, external recruiting becomes secondary

**For Competition & Team:**

- **Not "want to win" - WILL win. Going to crush this.**
- **EY begging us to adopt this idea** (not just "interested" - actively pursuing)
- Internship offers, job offers, recognition
- Portfolio piece that opens doors across Big 4 and tech companies

**Value Proposition (Business Case for Judges):**

- **Retention:** Internal career paths visible = employees stay longer
- **Cost:** Internal hiring 3-5x cheaper than external recruiting
- **Speed:** Internal candidates onboard faster, already know EY culture
- **Diversity:** Bias mitigation surfaces underrepresented talent
- **Knowledge retention:** Skills and institutional knowledge stay within company
- **Minimal overhead:** Automated matching and upskilling recommendations reduce HR workload

**Industry Impact:**

- Proof that AI can reduce hiring bias (not amplify it)
- Model for Fortune 500 internal mobility platforms
- Case study / published research

---

### 🖤 BLACK HAT: Risks & Caution (What Could Go Wrong + Mitigations)

**Technical Risks & Solutions:**

**Risk: GPT-5.2 hallucinates skills or makes poor inferences**

- ✅ **MITIGATION - Dual LLM Validation:**
  - LLM #1: Infer skills + provide QUOTES/evidence from source data
  - LLM #2: Validate by comparing ONLY the quote to the inferred skill
  - Only accept skills that pass both validation layers
  - Shows judges: "We thought about AI reliability"

**Risk: Vector matching gives nonsensical results**

- ✅ **MITIGATION:** Extensive testing with diverse mock employee profiles
- Test edge cases: junior dev matched to C-suite, technical role matched to creative role
- Validate match quality before demo day

**Risk: React Flow crashes on large skill trees**

- ✅ **MITIGATION:** Load testing, performance optimization
- Limit demo to realistic tree sizes (20-30 skills, not 500)

**Risk: Docker fails on demo laptop**

- ✅ **MITIGATION:** Test on multiple machines, have backup deployment
- Pre-loaded demo data, cached LLM responses

**Timeline Risks & Mitigations:**

**Risk: Feature creep - trying to build everything**

- ✅ **MITIGATION:** Ruthless MVP prioritization (coming in Blue Hat)
- Build core "holy shit" features first, nice-to-haves only if time remains

**Risk: Dev gets sick or overwhelmed**

- ✅ **NO CONCERN:** All 4 team members can do all 4 roles
- Cross-functional capability eliminates bus factor
- Pairs can swap if needed

**Risk: Integration hell in final week**

- ✅ **MITIGATION:** Docker containers, early integration testing
- Weekly integration checkpoints, not just final week

**Demo Risks & Mitigations:**

**Risk: Live demo fails (API timeout, DB crash)**

- ✅ **MITIGATION:** Extensive testing before demo day
- Cached responses for demo scenarios
- Backup pre-recorded video if catastrophic failure

**Risk: Judges ask about edge cases we haven't considered**

- ✅ **MITIGATION:** Research, prepare Q&A, trust in team to handle questions
- Document assumptions and limitations transparently

**Risk: Another team has similar idea but better execution**

- ✅ **RESPONSE:** Our dual LLM validation, success patterns, anonymous feedback, skill tree viz = differentiation
- Execute so well they can't compete

**Product Risks & Mitigations:**

**Risk: Anonymous feedback enables toxic/inappropriate comments**

- ✅ **MITIGATION - Report Button + Admin Oversight:**
  - Feedback is anonymous to HIRING MANAGER, not to system/admin
  - Report button for inappropriate feedback
  - Admin/HR can see true identity if abuse occurs
  - Balances employee safety with accountability

**Risk: Low match percentages discourage employees**

- ✅ **MITIGATION:** Show progression path (already in Red Hat)
  - "50% → 70% if you complete X, Y, Z"
  - Never show just low percentage without path forward

**Risk: Hiring managers don't trust AI recommendations**

- ✅ **RESPONSE:** "AI is taking over the workplace. If hiring managers don't adapt, their competitors will."
  - Explainable AI with confidence scores and reason codes builds trust
  - Early adopters get competitive advantage

**Risk: Success pattern feature reveals bias instead of eliminating it**

- ✅ **MITIGATION:** Test for disparate impact (FinTech approach from Cross-Pollination)
  - Monitor success patterns for encoded historical bias
  - Post-MVP feature: Bias auditing dashboard

**Team Confidence Assessment:**

- ✅ Technical risks: Addressable through testing and dual validation
- ✅ Timeline risks: Cross-functional team eliminates blockers
- ✅ Demo risks: Trust in team + preparation
- ✅ Product risks: Thoughtful design with accountability safeguards

**Black Hat Conclusion:** Risks are real but manageable. Team is confident and has mitigation strategies.

---

### 💚 GREEN HAT: Creativity & Alternatives

**Creative Decisions Made:**

**1. Visualization Branding:**

- ✅ **"Career Journey Map"** (instead of "skill tree")
  - Same React Flow visualization (interactive node graph)
  - More professional terminology for corporate audience
  - Maintains visual "holy shit" factor without game connotations

**2. LLM Strategy:**

- ✅ **Dual LLM Validation** (confirmed)
  - GPT-5.2 for skill inference + provide quotes/evidence from source
  - GPT-5.2 validation comparing quotes to inferred skills
  - No training data available for fine-tuning
  - Dual validation approach optimal for timeline and reliability

**3. Data Strategy:**

- ✅ **Scrape-First Approach with AI Fallback:**
  - Scrape all available public data:
    - EY job postings (public website)
    - LinkedIn profiles (if legally/technically possible)
  - Use GPT-5.2 to generate realistic synthetic data for gaps
  - Goal: Maximum accuracy and realism (only need 5-10 perfect profiles for competition)
  - **Future-proof architecture:** Design schema/data layer to easily plug in SuccessFactors/Credly if obtained
  - Modular data pipeline allows swapping synthetic → real data without code changes
  - **Note:** O\*NET optional for skill metadata (categories/types), not required for core functionality

**4. Demo/MVP User Flow:**

- ✅ **Interactive End-to-End Demo Journey:**
  1. **Account Creation/Login** - User authentication
  2. **Document Upload** - Resume + relevant docs (Credly badges, project descriptions, certifications)
  3. **AI Processing** - System extracts and infers skills (show this happening)
  4. **Top Matches Display** - Show recommended roles with match percentages
  5. **Explainability Visualization:**
     - "Here's what we extracted from your resume" (transparency)
     - "Here's how we inferred additional skills" (show dual LLM validation)
     - "Here's how we matched you to roles" (confidence scores, reason codes)
     - "Here's your career journey map" (React Flow visualization)
  - **Goal:** Demonstrate end-to-end value AND technical sophistication

**5. Matching Algorithm:**

- ✅ **Pure Vector Embeddings + Semantic Similarity**

**How it Works:**

- Convert skills to embeddings via GPT-5.2 embeddings API (1536-dimensional vectors)
- Store employee skill embeddings and role requirement embeddings in Chroma vector database
- Semantic similarity search finds closest matches using cosine distance
- **Handles synonyms automatically** (C# = csharp = C Sharp via semantic proximity in vector space)
- **Handles skill hierarchies automatically** (React embeddings are naturally close to JavaScript embeddings)
- **Handles related skills** (vector neighbors = semantically similar skills)

**Implementation Stack:**

- GPT-5.2 Embeddings API
- Chroma (local vector database - Docker deployment, NO external API dependencies)
- LangChain for orchestration
- Cosine similarity for matching

**Why This is Superior to Taxonomy-Based Approaches:**

- ✅ **No manual normalization needed** - vectors handle it automatically
- ✅ **Works with ANY skill** - not limited to pre-defined taxonomy
- ✅ **More innovative** - cutting-edge semantic AI vs. traditional keyword mapping
- ✅ **No external dependencies** - Chroma runs locally (demo reliability)
- ✅ **Powers multiple features:**
  - Skill matching (employee → role similarity)
  - Related skills discovery (vector neighbors)
  - Success patterns (aggregate similar skill profiles)

**Match Score Calculation:**

- Semantic similarity score via cosine distance (0-100%)
- Weighted by skill importance (hard requirements have higher weight)
- Confidence intervals from dual LLM validation
- Output: "73-79% match" with reason codes

**Explainability for Demo:**

- "We use GPT-5.2 vector embeddings for semantic AI matching"
- "Skills are compared in 1536-dimensional semantic space, not keyword matching"
- "The system automatically understands 'React' matches 'Frontend Framework' requirements"
- "Same technology powering modern AI search systems"
- Optional advanced viz: skill proximity in embedding space (2D projection via t-SNE)

---

### 💙 BLUE HAT: Process & Planning (Implementation Roadmap)

**Competition Context (from rubric analysis):**

- **AI Functionality (20 pts):** Skill-role matching + upskilling plans
- **Explainability (20 pts):** Human-readable reasons for decisions
- **Technical Design (20 pts):** LLM architecture quality
- **Governance (part of Explainability):** Bias checks, privacy, decision logs
- **Minimum requirement:** 5 synthetic employee profiles (not 1000!)

---

### **Technical Feature Prioritization - What to Build**

**TIER 1: MUST BUILD - Core Requirements (Maps to 60 pts rubric)**

**Skill Extraction & Inference:**

1. ✅ Document upload (resume, PDF parsing)
2. ✅ Dual LLM skill inference (GPT-5.2 extract + validate with quotes)
3. ✅ Confidence scoring for inferred skills

**Matching Engine (Pure Vector Approach):** 4. ✅ Vector embeddings generation (GPT-5.2 embeddings API - 1536 dimensions) 5. ✅ Chroma vector database integration (local, no external dependencies) 6. ✅ Semantic similarity matching (cosine distance for employee → role matching) 7. ✅ Match scoring with confidence intervals (73-79%) 8. ✅ Related skills discovery (vector neighbors for success patterns)

**Upskilling Plan Generation:** 9. ✅ Skill gap analysis (required skills - current skills = gaps) 10. ✅ Personalized learning path generation (what to learn to close gaps) 11. ✅ Time estimates for skill acquisition

**Explainability Framework (Critical - 20 pts):** 12. ✅ Reason codes for every match ("Strong in: X, Y. Growth areas: A, B") 13. ✅ Show LLM evidence/quotes for inferred skills 14. ✅ Confidence scores displayed to user 15. ✅ Match explanation UI (why this role, why this percentage)

**Governance & Logging:** 16. ✅ Decision logging (record how matches were made) 17. ✅ PII stripping and tokenization (EMP-482910) 18. ✅ Audit trail for explainability queries

**Data & Infrastructure:**

19. ✅ 10-15 realistic synthetic employee profiles with FULL metric coverage:
    - Skills & certifications
    - Financial metrics (utilization, billable hours, realization)
    - Compliance metrics (timesheet, CPE, policy)
    - Quality metrics (engagement ratings, technical excellence)
    - Development metrics (learning hours, mentoring)
    - People metrics (upward feedback, team scores)
    - Feedback themes (text for NLP analysis)
    - Nine Box indicators (performance rating, potential rating)
    - Historical data (advanced/not advanced, time in role)
20. ✅ 20-30 realistic EY role descriptions (scraped or generated)
21. ✅ Docker + docker-compose setup
22. ✅ PostgreSQL for structured data
23. ✅ FastAPI backend + React frontend

**EY System Compatibility (Future-Proof Architecture):**

24. ✅ SuccessFactors-compatible data schema (employee profiles, roles, learning records)
25. ✅ Credly badge import/parsing capability (badge metadata, skills, issue dates)
26. ✅ Data layer designed for easy swap from mock → real EY data

**TIER 2: SHOULD BUILD - Polish & Differentiation**

**UI/UX Polish:** 24. ✅ Professional design (shadcn/ui, not student project aesthetic) 25. ✅ Smooth demo flow (account → upload → matches → explanations) 26. ✅ Loading states, progress indicators 27. ✅ Responsive design

**Advanced Matching Features:** 28. ✅ Progress path visualization ("50% → 70% if you complete X, Y, Z") 29. ✅ Multiple role recommendations (top 5 matches, not just 1) 30. ✅ Filtering/sorting (by match %, by role type)

**Career Journey Map:** 31. ✅ React Flow skill tree visualization 32. ✅ Current skills vs. required skills vs. growth areas 33. ✅ Interactive nodes (click to see details)

**Success Pattern Analysis (DIFFERENTIATOR):**

34. ✅ Aggregate successful employee patterns across ALL metric categories:
    - Financial: utilization rate, billable hours, realization
    - Compliance: timesheet, CPE hours, policy adherence
    - Quality: engagement ratings, technical excellence
    - Development: learning hours, mentoring participation
    - People: upward feedback, team experience scores
    - Feedback: theme analysis (leadership, client mgmt, technical)
35. ✅ "Employees who advanced typically showed..." insights with specific benchmarks
36. ✅ Career Competitiveness Dashboard showing user vs. patterns across all categories
37. ✅ Nine Box position indicators (Performance + Potential dimensions)
38. ✅ Success pattern overlay on career journey map

**EY Promotion & Learning Alignment:**

39. ✅ Agile promotion readiness indicators (skill-based advancement criteria from EY research)
40. ✅ EY Badges integration (4-tier structure: Bronze → Silver → Gold → Platinum)
41. ✅ Badge-to-skill mapping (Credly badge metadata → inferred skills with high confidence)
42. ✅ Performance calibration readiness view (how metrics compare to calibration standards)
43. ✅ CPE tracking integration (40 hrs/year requirement, progress visualization)

**TIER 3: NICE TO HAVE - Innovation Points (10 pts rubric)**

**Anonymous Matching System:**

44. ⭐ Two-sided mutual opt-in (Tinder approach)
45. ⭐ Hiring manager view (count-only until opt-in)
46. ⭐ Anonymous decline feedback

**Advanced Features:**

47. ⭐ Admin dashboard
48. ⭐ Multiple discovery modes (Best Fit, Stretch, Exploratory)
49. ⭐ Report button for feedback moderation
50. ⭐ Proactive nudge system (timesheet reminders, CPE tracking, utilization alerts)

**EY Internal Mobility Features (Mobility4U-Inspired):**

51. ⭐ Cross-service line opportunity discovery (Advisory ↔ Consulting ↔ Tax ↔ Assurance)
52. ⭐ Internal mobility recommendations based on skill adjacency
53. ⭐ Career Agility view (rotational role suggestions, stretch assignments)
54. ⭐ Global mobility indicators (international assignment compatibility)
55. ⭐ Service line transfer readiness assessment

**CRITICAL SCOPE INSIGHT:**

- Only need **5 synthetic profiles** to meet minimum requirement
- Focus on 5-10 PERFECT profiles that showcase all features
- Don't build for scale - build for demo impact

---

### **8-Week Implementation Roadmap**

**Week 1: Foundation (All Tier 1 Infrastructure)**

- Docker + docker-compose setup
- FastAPI skeleton + PostgreSQL schema
- React app + shadcn/ui component library
- Auth system (account creation, login)
- **SuccessFactors-compatible data schema design** (employee profiles, roles, learning records)
- **Credly badge data model** (badge metadata, skills mapping, 4-tier structure)
- **Deliverable:** `docker-compose up` works, devs can work independently, EY-compatible schemas ready

**Week 2-3: Core AI Pipeline (Tier 1 - 40 pts worth)**

- GPT-5.2 API integration + LangChain
- Dual LLM skill inference (extract + validate with quotes)
- Confidence scoring logic
- Vector embeddings generation (GPT-5.2 embeddings API)
- **Deliverable:** Upload resume → see extracted skills with confidence scores

**Week 4: Matching Engine (Tier 1 - 20 pts worth)**

- Chroma vector database + embeddings generation
- Semantic similarity matching algorithm
- Match scoring with confidence intervals
- **Deliverable:** See top 5 role matches with percentages

**Week 5: Upskilling + Explainability (Tier 1 - 20 pts worth)**

- Skill gap analysis
- Personalized upskilling path generation
- Reason codes and match explanations UI
- Decision logging and audit trail
- **Deliverable:** Full explainability framework working

**Week 6: Career Journey Map + Success Patterns + EY Alignment (Tier 2 - DIFFERENTIATOR)**

- React Flow skill tree visualization
- Progress path overlay ("50% → 70% if...")
- Interactive skill nodes
- **Career Competitiveness Dashboard** with all metric categories
- **Success pattern aggregation** from synthetic "advanced" profiles
- **Nine Box position indicator** (Performance × Potential grid)
- **Agile promotion readiness indicators** (skill-based advancement criteria)
- **EY Badges integration** (badge display, skill inference from badges)
- **Performance calibration readiness view**
- **Deliverable:** Visual "holy shit" moment + comprehensive benchmarking + EY system alignment

**Week 7: Polish & Data (Tier 2)**

- Professional UI polish, animations, responsive design
- Generate 10-15 perfect synthetic employee profiles **with full EY metric coverage:**
  - SuccessFactors-style profile structure
  - Credly badges (Bronze/Silver/Gold/Platinum across multiple topics)
  - Financial metrics (utilization, billable hours, realization)
  - Compliance metrics (timesheet, CPE hours, policy)
  - Quality metrics (engagement ratings, technical excellence)
  - People metrics (upward feedback, team scores)
  - Feedback themes (NLP-ready text)
  - Nine Box indicators (performance rating 1-5, potential rating)
  - Mix of "advanced" and "not yet advanced" profiles for pattern analysis
- Scrape/generate 20-30 realistic EY role descriptions (from public job postings)
- **CPE tracking data** (40 hrs/year requirement progress)
- Performance optimization, caching
- **Deliverable:** Demo-ready app with EY-authentic data structure + success patterns

**Week 8: Demo Prep & Tier 3 (if time)**

- Demo mode with pre-loaded data
- Backup deployment, cached responses
- Integration testing
- **If ahead (Tier 3 options):**
  - Anonymous matching system (two-sided opt-in)
  - Mobility4U-style cross-service line discovery
  - Career Agility recommendations
  - Admin dashboard
- **Deliverable:** Competition-ready demo with EY system alignment

---

### **Epic Breakdown for 4-Dev Parallel Work**

**Epic 1: Authentication & Infrastructure**

- **Owner:** Frontend Dev #2 + Connecting Dev
- User registration, login, session management
- Docker orchestration
- File upload UI and API

**Epic 2: AI Skill Inference Pipeline**

- **Owner:** Backend Dev + Connecting Dev
- Dual LLM validation (GPT-5.2)
- Quote extraction and confidence scoring
- Vector embeddings generation
- LLM prompt engineering

**Epic 3: Matching Engine + Success Patterns**

- **Owner:** Backend Dev + Connecting Dev
- Vector embeddings generation
- Chroma integration
- Similarity search and ranking
- Match explanation generation
- **Success pattern aggregation** across ALL metric categories:
  - Financial metrics (utilization, billable hours, realization)
  - Compliance metrics (timesheet, CPE, policy)
  - Quality metrics (engagement ratings, technical excellence)
  - Development metrics (learning hours, mentoring)
  - People metrics (upward feedback, team scores)
  - Feedback theme analysis (NLP on feedback text)
- **Career competitiveness scoring** (user vs. advanced employee patterns)
- **Nine Box position estimation** (performance + potential indicators)

**Epic 4: UI/UX & Visualization**

- **Owner:** Frontend Dev #1 + Frontend Dev #2
- Design system implementation (shadcn/ui)
- Match results interfaces
- Explainability UI (reason codes, confidence display)
- Career Journey Map (React Flow)
- Progress path visualization
- **Career Competitiveness Dashboard** with sections for:
  - Financial metrics (utilization gauge, billable hours trend)
  - Compliance metrics (timesheet status, CPE progress bar)
  - Quality metrics (ratings display)
  - Development metrics (learning hours, mentoring count)
  - Feedback themes (word cloud or tag display)
  - Nine Box position indicator (2x2 grid visualization)
- **Success pattern overlays** showing benchmarks vs. user metrics
- **Pattern comparison visualizations** (radar charts, bar comparisons)

**Epic 5: Upskilling & Governance**

- **Owner:** All team (integration epic)
- Skill gap analysis
- Learning path generation
- **Holistic development recommendations** covering:
  - Skill gaps (certifications, training)
  - Behavioral improvements (utilization, compliance)
  - Visibility improvements (mentoring, upward feedback requests)
  - Quality focus areas (from feedback themes)
- Decision logging
- Audit trail implementation
- **Legal language compliance** (all outputs use "patterns/trends" framing)
- **Metric benchmarks database** (what "good" looks like for each role/level)

**Epic 6: EY System Integration Layer**

- **Owner:** Backend Dev + Connecting Dev
- **SuccessFactors-compatible data architecture:**
  - Employee profile schema matching SuccessFactors structure
  - Role/job description schema compatible with EY job postings
  - Performance metrics schema (LEAD framework aligned)
  - Learning records schema (SuccessFactors learning modules)
- **Credly badge integration:**
  - Badge import/parsing from Credly API structure
  - Badge-to-skill mapping (metadata extraction)
  - 4-tier badge level recognition (Bronze/Silver/Gold/Platinum)
  - Issue date and expiration tracking
- **EY Badges program alignment:**
  - Badge topic categorization (data analytics, AI, leadership, etc.)
  - Formal learning + practical experience + community contribution tracking
- **Agile promotion criteria integration:**
  - Skill-based readiness indicators
  - Nine Box position estimation (Ability × Engagement × Aspiration)
  - Performance rating tracking (1-5 scale)
  - Time-in-role tracking
- **Performance calibration readiness:**
  - Metrics comparison to calibration standards
  - Peer comparison data (anonymized)
  - Calibration-ready data export format
- **Internal mobility features (if time):**
  - Cross-service line opportunity matching
  - Mobility4U-style discovery interface
  - Career Agility recommendations

---

### **Blue Hat Summary - Ready to Execute?**

**We've defined:**

✅ Feature prioritization aligned to 100-pt rubric (60 pts Tier 1, 30 pts Tier 2, 10 pts Tier 3)
✅ 8-week roadmap focusing on core requirements first
✅ Epic breakdown for parallel 4-dev workflow (now 6 epics including EY System Integration)
✅ Comprehensive EY metrics research (LEAD framework, Nine Box, 6 metric categories)
✅ Comprehensive EY systems research (SuccessFactors, PX360, Credly, Mobility4U, EYMP)
✅ Synthetic profile schema with 20+ fields covering all metric categories
✅ SuccessFactors-compatible data architecture for future integration
✅ Credly badge integration (4-tier structure, skill mapping)
✅ Agile promotion alignment (skill-based advancement criteria)
✅ Legal/ethical framing guidelines (patterns, not promises)
✅ Core differentiator: Success pattern analysis based on primary research + EY system knowledge

**Key Deliverables:**

1. **10-15 synthetic profiles** with full EY metric coverage (SuccessFactors-style, Credly badges, all 6 categories)
2. **Career Competitiveness Dashboard** showing user vs. advanced employee patterns
3. **Skill matching + success pattern overlay** on Career Journey Map
4. **Holistic development recommendations** (skills + behavioral + visibility)
5. **EY-compatible data layer** ready for SuccessFactors/Credly integration if adopted
6. **Agile promotion readiness indicators** aligned with EY's skill-based advancement criteria

**Ready to move to PRD/Architecture phase?**

---

---

## EY Performance Metrics - Comprehensive Research (Dec 18, 2025)

**Sources:** Primary research (EY employee interviews) + Web research (EY transparency reports, PCAOB, industry analysis)

### EY's LEAD Performance Framework

EY uses the **LEAD (Leadership, Evaluation, and Development)** framework for performance management. Key components:

1. **Performance Dashboard** - Each employee has a dashboard showing:

   - Year-to-date feedback and comments
   - Performance against KPIs (global and local)
   - Quality, risk management, and technical excellence indicators
   - Comparison to peers

2. **Ongoing Feedback** - Continuous feedback throughout the year (not just annual reviews)

3. **Counselor Conversations** - Regular discussions covering:

   - Career aspirations
   - Learning opportunities
   - Development areas
   - Inclusive environment creation

4. **Annual Category** - Year-end outcome based on aggregated feedback, KPI progress, and contributions. This category feeds into compensation and rewards.

_Source: [EY Transparency Report 2025](https://www.ey.com/content/dam/ey-unified-site/ey-com/en-us/insights/audit/documents/ey-transparency-report-2025.pdf)_

---

### Nine Box Model & Advancement Criteria

EY uses a **Nine Box Model** to assess employees on performance AND potential:

**Required for Advancement:**

- Performance rating of **4 or 5** (out of 5)
- Nine Box rating of **"High Potential"** or **"Best in Class"**
- Minimum time in current role (e.g., 12 months)

**Three Dimensions Evaluated:**

1. **Ability** - Can operate at higher/more complex level than current role requires
2. **Engagement** - Strong commitment to organization, willingness to put in extra effort
3. **Aspiration** - High need for achievement and/or desire to influence the organization

_Source: [EY Leading HR Practices](https://sqc.org.sa/wp-content/uploads/2021/07/ErnstYoungLeadingHRpractices.pdf)_

---

### Comprehensive Performance Metrics Tracked

#### A. Billable/Financial Metrics

| Metric               | Description                          | Target/Pattern                           |
| -------------------- | ------------------------------------ | ---------------------------------------- |
| **Utilization Rate** | % of hours billed to clients         | 75% target, 85-90% in advanced employees |
| **Billable Hours**   | Raw hours billed                     | Varies by role/service line              |
| **Realization Rate** | % of billed hours actually collected | Higher = better project management       |
| **Project Margin**   | (Revenue - Direct Costs) / Revenue   | Profitability indicator                  |

#### B. Quality & Compliance Metrics

| Metric                      | Description                       | Notes                                         |
| --------------------------- | --------------------------------- | --------------------------------------------- |
| **Timesheet Compliance**    | Weekly submission tracking        | 6+ misses = significant negative pattern      |
| **CPE Hours**               | Continuing Professional Education | 40 hrs/year minimum, 120 over 3 years (Audit) |
| **Quality Review Findings** | Engagement quality review results | Critical for Audit professionals              |
| **Policy Compliance**       | Adherence to firm policies        | Non-compliance triggers remedial action       |
| **Technical Excellence**    | Quality of deliverables           | Tracked via engagement feedback               |

#### C. People & Development Metrics

| Metric                      | Description                              | Notes                              |
| --------------------------- | ---------------------------------------- | ---------------------------------- |
| **Learning Hours**          | Training completed                       | Avg 51 hrs/employee (2023)         |
| **Upward Feedback**         | Feedback from direct reports             | 60% of managers requested in 2021  |
| **Mentoring Participation** | Active mentoring relationships           | Cultural expectation               |
| **Team Experience Survey**  | Team member satisfaction (5-point scale) | Actionable insights for team leads |
| **People Pulse Survey**     | Engagement survey (3x/year)              | Covers careers, learning, skills   |

#### D. Client & Business Development (Senior Levels)

| Metric                       | Description                              | Notes                           |
| ---------------------------- | ---------------------------------------- | ------------------------------- |
| **Client Retention Rate**    | % of clients continuing                  | Relationship strength indicator |
| **Net Promoter Score (NPS)** | Client satisfaction/referral likelihood  | Service quality indicator       |
| **Origination**              | Revenue from clients YOU brought in      | Key for Partner track           |
| **Cross-Selling**            | Expanding services with existing clients | Client development metric       |
| **Client Lifetime Value**    | Total profit over relationship           | Long-term value creation        |

#### E. DEI & Leadership Metrics

| Metric                     | Description                     | Notes                               |
| -------------------------- | ------------------------------- | ----------------------------------- |
| **DEI Scorecard**          | Diversity outcomes for leaders  | Part of leadership evaluation       |
| **Inclusion Indicators**   | Team inclusivity measures       | Cultural contribution               |
| **Coaching Effectiveness** | Leader as Coach program metrics | 28% improvement in team inspiration |

_Sources: EY Transparency Reports 2022-2025, PCAOB inspection reports, industry benchmarks_

---

### Primary Research: EY Employee Insights (Direct Quotes)

The following insights were gathered from direct conversations with EY employees, providing ground-level validation of the metrics above.

#### 1. Timesheet Compliance Tracking

> "For example, EY employees have to submit the number of hours worked each week in their timesheet, and each week that you forget to submit your timesheet it hurts you for promotion. Depending on the team, forgetting once or twice in a year may be excused, but if you forget to submit it 6 times you will be pretty heavily docked. There's no exact threshold, but the fewer times you forget to submit the better off you'll be."

**Platform Implications:**

- Timesheet compliance is a **tracked metric** that correlates with career advancement
- No hard cutoff, but ~6 missed submissions = significant negative pattern
- Could integrate timesheet compliance into "career competitiveness" benchmarking
- Could provide reminders/nudges to improve compliance
- **CRITICAL FRAMING:** This is observational data about patterns, NOT a promise that compliance = advancement

#### 2. Utilization Rate Targets

> "Another example is utilization, which is the % of your hours that you bill to the client. Each team has a 'target' utilization (which can be thought of as the bare minimum from a promotion perspective) which hovers around 75% for the year. While reaching the 75% threshold is important, it's likely that many of the people who are getting promoted are in the 85-90% utilization range."

**Platform Implications:**

- **75% utilization** = team target threshold (baseline expectation)
- **85-90% utilization** = pattern observed in employees who advanced
- This is EXACTLY the kind of "success pattern" data our platform should surface
- Could show: "Employees who advanced to Senior Consultant typically had ~87% utilization"
- Could show user's current utilization vs. historical benchmarks of successful employees
- **CRITICAL FRAMING:** This shows correlation/patterns, NOT causation. High utilization doesn't guarantee advancement - it's one factor among many.

#### 3. Feedback System

> "EY has a feedback system in which higher-ranking employees provide feedback to lower-ranking employees, and this feedback factors into your promotion qualification when the time comes."

**Platform Implications:**

- Feedback from senior employees is a formal promotion input
- Could integrate feedback summaries/scores into upskilling recommendations
- Could identify skill gaps mentioned in feedback and create learning paths

#### 4. Feedback Benchmarking (User Suggestion)

> "Maybe you could look at the feedback reviews of people who were previously promoted to compare your own feedback reviews against."

**Platform Implications:**

- **THIS IS THE SUCCESS PATTERN FEATURE IN ACTION**
- Compare user's feedback themes against employees who successfully advanced
- "Employees who advanced typically received feedback mentioning: leadership, client relationship management, technical depth"
- "Your feedback mentions: technical skills (✓), opportunity area: client communication"
- Creates actionable development insights from historical pattern data
- **CRITICAL FRAMING:** This helps employees identify development opportunities, NOT predict or promise advancement

### Platform Feature Implications

Based on the comprehensive metrics research, the platform can track and benchmark FAR more than just skills:

#### 1. Career Competitiveness Dashboard (Core Feature)

| Category        | What We Show                                     | Data Source         |
| --------------- | ------------------------------------------------ | ------------------- |
| **Utilization** | Current vs. target vs. advanced employee pattern | Mock/SuccessFactors |
| **Compliance**  | Timesheet, CPE, policy adherence                 | Mock data           |
| **Quality**     | Engagement feedback themes, technical ratings    | Mock feedback data  |
| **Development** | Learning hours, mentoring activity               | Mock/Credly         |
| **Skills**      | Gap analysis, growth trajectory                  | Resume + inference  |

**Framing:** "How your profile compares to patterns observed in successful employees" - NOT "advancement likelihood"

#### 2. Success Pattern Integration (Differentiator)

Show patterns from employees who advanced, covering:

- ~87% utilization (vs. 75% target)
- ~95% timesheet compliance
- High engagement scores
- Feedback themes: [leadership, client management, technical expertise]
- CPE completion above minimums
- Active mentoring participation

**User's View:**

- "Your current profile: 78% utilization, 92% compliance, feedback themes: [technical expertise, team collaboration]"
- "Development opportunity: Patterns suggest client management experience correlates with advancement"

**Framing:** Patterns and trends for self-improvement, NOT requirements or guarantees

#### 3. Nine Box Position Insight (Advanced Feature)

Help users understand their likely position in the Nine Box:

- **Performance indicators:** Quality ratings, utilization, compliance
- **Potential indicators:** Ability (stretch assignments), Engagement (survey scores), Aspiration (expressed goals)
- Show what "High Potential" profiles typically look like

#### 4. Proactive Development Nudges

- "You haven't submitted your timesheet this week" (before deadline)
- "Your utilization is 72% YTD - consider seeking additional project assignments"
- "You're at 35 CPE hours - need 5 more by year end"
- "Consider requesting upward feedback to build leadership visibility"

### Data Requirements

Based on the comprehensive metrics research, synthetic profiles should include:

**Synthetic Profile Schema (Extended):**

```json
{
  "employee_id": "EMP-482910",
  "current_role": "Senior Consultant",
  "service_line": "Advisory",
  "years_in_role": 2.5,

  // Skills (existing)
  "skills": ["Python", "Data Analysis", "Financial Modeling"],
  "certifications": ["AWS Solutions Architect", "CPA"],

  // Financial/Billable Metrics
  "utilization_rate": 0.78,
  "billable_hours_ytd": 1450,
  "realization_rate": 0.94,

  // Compliance Metrics
  "timesheet_compliance": 0.92,
  "cpe_hours_ytd": 35,
  "cpe_hours_required": 40,
  "policy_compliance_score": 0.98,

  // Quality Metrics
  "engagement_quality_rating": 4.2,
  "technical_excellence_rating": 4.5,

  // People/Development Metrics
  "learning_hours_ytd": 48,
  "mentees_count": 2,
  "upward_feedback_score": 4.1,
  "team_experience_score": 4.3,

  // Feedback Themes (for NLP analysis)
  "feedback_themes": [
    "technical depth",
    "team collaboration",
    "attention to detail"
  ],
  "feedback_development_areas": [
    "client communication",
    "stakeholder management"
  ],

  // Nine Box Indicators
  "performance_rating": 4,
  "potential_rating": "High Potential",

  // Historical Pattern Data
  "advanced_to_next_level": false,
  "advancement_date": null,
  "previous_role": "Consultant",
  "time_to_previous_advancement": 24 // months
}
```

**Mock Data Strategy:**

- Create 10-15 profiles with varying metric combinations
- Include 5-7 "advanced" profiles to establish success patterns
- Include 5-8 "not yet advanced" profiles for realistic comparison
- Ensure diversity in service lines, roles, and metric distributions

**Note:** For competition, we mock this data convincingly. The architecture should be designed to plug into real EY systems (SuccessFactors, LEAD dashboard, etc.) if adopted. All UI language must use "patterns/trends" framing - never "requirements" or "guarantees."

---

## FINAL ARCHITECTURE SUMMARY

**Critical Design Principle - Legal & Ethical Framing:**

All system outputs MUST use pattern/trend language, NOT guarantees:

- ✅ "Employees who advanced typically showed..."
- ✅ "Patterns observed in successful employees..."
- ✅ "Development opportunity based on historical trends..."
- ❌ "You need X for promotion"
- ❌ "Promotion readiness score"
- ❌ "You will be promoted if..."

This is a **career development and self-improvement tool**, not a promotion predictor.

---

**Core Innovation - What Sets You Apart:**

1. **Dual GPT-5.2 Validation** (Explainability: 20 pts)

   - LLM #1: Extract skills with quotes/evidence from resume
   - LLM #2: Validate quote supports inferred skill
   - Confidence scoring for every skill
   - Human-readable explanations with evidence

2. **Pure Vector Semantic Matching** (AI Functionality: 20 pts, Innovation: 10 pts)

   - GPT-5.2 embeddings (1536-dimensional vectors)
   - Chroma local vector database (no external dependencies)
   - Automatic synonym handling (no manual normalization needed)
   - Automatic skill hierarchy understanding
   - Powers matching, related skills, success patterns

3. **Career Journey Map Visualization** (UX: 15 pts, Innovation points)

   - React Flow interactive skill tree
   - Progress paths: "50% → 70% if you complete X, Y, Z"
   - Professional terminology, not gamified

4. **Comprehensive Success Pattern Analysis** (CORE DIFFERENTIATOR)
   - Goes beyond skills to include ALL career metrics:
     - Financial: utilization, billable hours, realization rate
     - Compliance: timesheet, CPE hours, policy adherence
     - Quality: engagement ratings, technical excellence
     - Development: learning hours, mentoring participation
     - People: upward feedback, team experience scores
     - Feedback themes: NLP analysis of feedback text
   - Nine Box position indicators (Performance × Potential)
   - Career Competitiveness Dashboard comparing user to advanced employee patterns
   - Based on primary research with actual EY employees + EY transparency reports
   - **Why this wins:** No competitor has this depth of career factor analysis

**Tech Stack (Finalized):**

**Backend:**

- FastAPI + Python
- GPT-5.2 Instant (skill inference, validation, embeddings, reasoning)
- LangChain (orchestration, caching)
- PostgreSQL (structured data)
- Chroma (vector database, local deployment)

**Frontend:**

- React + TypeScript
- shadcn/ui or Tailwind CSS
- React Flow (career journey map)
- Recharts (analytics)

**Infrastructure:**

- Docker + docker-compose
- 4 independent containers (backend, frontend, postgres, chroma)
- Single `docker-compose up` deployment

**No External API Dependencies for Core Features:**

- ✅ All skill extraction: GPT-5.2 (you control)
- ✅ All matching: Chroma local (no API limits)
- ✅ All embeddings: GPT-5.2 (cached aggressively)
- ⏸️ O\*NET: Optional for metadata only

**Why This Wins:**

- **Most innovative approach:** Dual LLM validation + pure vector matching + comprehensive success patterns
- **Most explainable:** Quotes, confidence scores, semantic reasoning, pattern benchmarks
- **Most reliable:** Local vector DB, no external dependencies for core features
- **Most impressive:** "We built semantic AI matching AND discovered what actually drives career success at EY"
- **Most differentiated:** Success pattern analysis based on 6 metric categories + Nine Box indicators
- **Most researched:** Primary research with EY employees + EY transparency report analysis
- Addresses all rubric criteria (60 pts core + 30 pts polish + 10 pts innovation)

---

---

## EY Internal Systems & Operational Processes Research (Dec 18, 2025)

**Sources:** Web research (EY transparency reports, SAP SuccessFactors documentation, IBM/Microsoft case studies, EY public announcements)

This section supplements the metrics research above by documenting **how EY's internal systems integrate** and **operational workflows** for performance management, promotion, and internal mobility.

---

### EY Internal HR Technology Stack

#### 1. SAP SuccessFactors - Core HR Platform

**Implementation Timeline:**

- **2017 (Mid-year):** Initial deployment - learning, performance management, onboarding modules
- **November 2020:** SuccessFactors Employee Central rollout
- **Mid-2021:** Recruitment modules deployment

**Modules Deployed:**

| Module                     | Function                                                          |
| -------------------------- | ----------------------------------------------------------------- |
| **Learning Management**    | Online learnings, virtual live classrooms with facilitator access |
| **Performance Management** | LEAD framework, goal setting, feedback collection                 |
| **Onboarding**             | Streamlined new employee integration                              |
| **Employee Central**       | Core HR data management                                           |
| **Recruitment**            | Talent acquisition, applicant tracking                            |

**Integration Points:**

- Connected to EY PX360 People Experience Platform
- Integrated with Qualtrics for experience data (X-data)
- Linked to IBM Watson chatbot for employee self-service
- Connected to SAP Jam for collaboration and social learning

_Source: [TechTarget - EY People Experience Strategy](https://www.techtarget.com/searchhrsoftware/feature/EY-people-experience-strategy-taps-firms-process-skills)_

---

#### 2. EY PX360 People Experience Transformation Platform

Developed in collaboration with SAP SuccessFactors and Qualtrics.

**Key Capabilities:**

- **Real-time Employee Insights:** Combines operational HR data with experience feedback
- **Holistic View:** Integrates data from SuccessFactors, Qualtrics surveys, and other HR systems
- **Proactive Issue Resolution:** Enables HR leaders to address employee concerns promptly
- **Experience Curation:** Designs more effective people experiences based on integrated data

**Data Integration:**

| Data Type                     | Source              | Content                                           |
| ----------------------------- | ------------------- | ------------------------------------------------- |
| **Operational Data (O-data)** | SuccessFactors      | Performance metrics, utilization, learning hours  |
| **Experience Data (X-data)**  | Qualtrics           | Satisfaction surveys, feedback themes, engagement |
| **Real-time Analytics**       | Combined dashboards | Comprehensive workforce insights                  |

_Source: [PR Newswire - EY PX360](https://www.prnewswire.com/news-releases/ey-collaborates-with-sap-successfactors-and-qualtrics-on-differentiated-employee-experience-solution-300919301.html)_

---

#### 3. IBM Watson Chatbot Integration

**Primary Functions:**

- **HR Self-Service:** Time off requests, payroll info, HR tasks via natural language
- **Payroll Assistance:** Generative AI chatbot (ChatGPT via Azure OpenAI) handles 500+ daily questions
- **Multi-Language:** Available in 49 languages across 131 countries
- **Mobile Integration:** Web app with mobile app integration planned

**Example Interaction:**

> Employee: "I want to take tomorrow off as annual leave"
> → Chatbot processes request in real-time by interfacing with HR systems

**EY.ai Workforce Solution:**

- Utilizes IBM watsonx Orchestrate
- Automates drafting job descriptions, extracting payroll reports
- Guides employees through HR processes

_Sources: [IBM Case Study](https://www.ibm.com/case-studies/blog/how-a-company-transformed-employee-hr-experience-with-an-ai-assistant), [Fortune - EY Payroll Chatbot](https://fortune.com/2023/05/24/ey-generative-a-i-payroll-chatbot-chatgpt/)_

---

#### 4. SAP Jam Collaboration Platform

**Key Features:**

- **Social/Blended Learning:** Combines formal and informal learning, reduces training costs
- **Expert Content Sharing:** Experts create and share content/videos
- **Social Onboarding:** New employees quickly connect with people and content
- **Collaborative Goal Management:** Teams create and share goals collectively

**Integration with SuccessFactors:**

- Connected to learning modules
- Supports collaborative performance and goal management
- Enhances social learning communities

_Source: [SAP Learning](https://learning.sap.com/learning-journeys/explore-integrated-business-processes-in-sap-s-4hana-/integrating-human-experience-management-with-sap-successfactors)_

---

#### 5. EY Connected Employee Application

**Platform:** Built on SAP Business Technology Platform (BTP)

- **Self-Service HR:** Manage payroll, benefits without contacting HR
- **Scalability:** Effective for startups to 100,000+ employees
- **Integration:** Connects to SuccessFactors and other HR systems

_Source: [SAP.com](https://www.sap.com/documents/2024/04/a0bbee08-b57e-0010-bca6-c68f7e60039b.html)_

---

#### 6. Employee Portal / Intranet

**Single Access Point Strategy:**

- Unified access to SuccessFactors modules
- Integrated IBM Watson chatbot
- Task execution from single interface
- Piloted in 2020-2021

---

### Performance Review Cycles and Timelines

#### Fiscal Year Structure

**Standard EY Fiscal Year:** July to June (12-month cycle)

**Regional Variations:**

| Region            | Fiscal Year | Key Dates                                              |
| ----------------- | ----------- | ------------------------------------------------------ |
| **Standard (US)** | July - June | Promotions effective August                            |
| **EY GDS**        | July - June | Appraisal letters by end of September, salaries Oct 31 |

**Example (2022):** Promotions effective August 8, reflected in August 26 paycheck

_Sources: [Going Concern](https://www.goingconcern.com/ey-raises-2022/), [Fishbowl](https://www.fishbowlapp.com/post/what-is-the-rating-cycle-in-ey-gds-i-will-be-joining-in-april-would-i-be-considered-for-fy-23-24-cycle-please-help)_

---

#### Performance Review Process Stages

**Stage 1: Self-Assessment & Manager Evaluation**

- Employees complete self-assessments (KPIs, quality, technical excellence, contributions)
- Managers evaluate based on year-long data and feedback

**Stage 2: Calibration Sessions**

- Managers participate in calibration meetings
- Ensures consistency and fairness across departments
- Addresses potential biases

**Stage 3: Final Ratings & Feedback**

- Final performance ratings assigned post-calibration
- Managers conduct feedback sessions
- Discussion of outcomes and development plans

**Stage 4: Annual Category Assignment**

- Year-end outcome based on aggregated feedback, KPI progress, contributions
- Informs compensation and rewards
- Informs promotion eligibility

---

### Promotion Evaluation Processes

#### Agile Promotions Framework

EY has shifted from time-based to **skill-based advancement:**

**Key Principles:**

- **Skill-Based Advancement:** Promotions based on individual skills and readiness
- **Business Need Alignment:** Advancement when individual is ready AND there is business need
- **Flexible Timing:** Not restricted to annual promotion cycles
- **Continuous Evaluation:** Ongoing assessment rather than annual review

_Source: [EY Transparency Report 2024](https://www.ey.com/content/dam/ey-unified-site/ey-com/en-cy/services/audit-quality/documents/ey-fy24-transparency-report.pdf)_

---

#### Promotion Criteria (Still Applicable)

| Requirement            | Details                              |
| ---------------------- | ------------------------------------ |
| **Performance Rating** | 4 or 5 (out of 5) required           |
| **Nine Box Rating**    | "High Potential" or "Best in Class"  |
| **Time in Role**       | Typically 12 months minimum (varies) |

**Transparent Guidelines:**

- Clear promotion guidelines implemented
- Regular career conversations with managers
- Manager training on development discussions
- Particularly benefits underrepresented groups

_Source: [WomenTech - EY Promotion Criteria](https://www.womentech.net/en-in/how-to/ey-ernst-young-transparent-promotion-criteria)_

---

#### Promotion Effective Dates

**Historical Pattern:**

- Promotions typically effective in **August** (aligning with fiscal year end)

**Agile Promotion Timing:**

- Can occur throughout the year
- Depends on: individual readiness, business need, role availability, calibration outcomes

---

### Performance Calibration Sessions

#### Purpose

- Ensure fair and consistent employee evaluations
- Maintain uniform evaluation standards across teams
- Reduce bias in performance assessments
- Facilitate fair promotion decisions

#### Calibration Process

**Stage 1: Preparation**

- Managers draft preliminary performance appraisals
- Include proposed ratings with supporting evidence:
  - Performance metrics (utilization, billable hours, quality ratings)
  - Feedback from multiple sources
  - Project outcomes and client feedback
  - Development activities and learning hours

**Stage 2: Calibration Meeting**

- Managers convene to discuss and compare ratings
- Present assessments with justifications
- Address discrepancies across departments
- Identify and mitigate potential biases

**Stage 3: Adjustment**

- Ratings adjusted based on collective input
- Ensures fairness and consistency
- Accounts for contextual factors

**Stage 4: Finalization**

- Consensus reached on final ratings
- Documented in SuccessFactors
- Used for: promotion decisions, compensation, development planning

---

### Internal Mobility Systems and Programs

#### 1. Mobility4U Program

**Launch Date:** September 2021

**Program Overview:**

- Single point of access for international assignments
- Supports short-term and long-term opportunities
- Cross-border and cross-service line experiences

**Key Metrics:**

- **15% higher retention rate** for employees who participate in mobility assignments

**Program Benefits:**

- Expands professional networks globally
- Enhances global mindset and cultural competence
- Broadens professional horizons
- Aligns talent placement with organizational needs

_Sources: [WorkLife News](https://www.worklife.news/culture/global-mobility/), [EY Value Realized 2022](https://assets.ey.com/content/dam/ey-sites/ey-com/en_gl/topics/global-review/2022/ey-value-realized-2022-v3.pdf)_

---

#### 2. EY Mobility Pathway (EYMP)

**Platform:** Built on Microsoft Power Platform

**Case Management:**

- Centralized system for international assignments
- Tracks: immigration, tax, compensation, lodging

**Automation:**

- Leverages Microsoft Power Platform for workflow automation
- Reduces manual tasks, enhances efficiency
- Streamlines approval processes

**Mobile Application:**

- EY Mobility Pathway Mobile App
- Biometric access, document uploads, GPS-based location services
- Real-time case status updates

_Sources: [Microsoft Case Study](https://www.microsoft.com/en/customers/story/1351710271209280958-ey-partner-professional-services-power-apps), [Apple App Store](https://apps.apple.com/ae/app/ey-mobility-pathway-mobile/id1442863479)_

---

#### 3. Career Agility Signal Commitment

**Initiative Overview:**

- Creates dynamic and equitable career environment
- Enables employees to explore diverse roles
- Leads to more engaged workforce

**Key Components:**

- **Increased Transparency:** Enhanced visibility of internal opportunities
- **Structured Programs:** Rotational role programs, temporary assignments
- **Support Systems:** LEAD framework career conversations

_Source: [EY Transparency Report 2025](https://www.ey.com/content/dam/ey-unified-site/ey-com/en-gr/legal-and-privacy/transparency-report-2025-english.pdf)_

---

### Learning and Development System Integration

#### 1. EY Badges Program

**Program Structure:**

- Digital credentials for skill acquisition and demonstration
- **Four Levels:** Bronze, Silver, Gold, Platinum
- Each level requires: formal learning, practical experience, community contribution

**Badge Topics:**

- Data analytics, AI, leadership, robotic process automation
- Innovation, cybersecurity, sustainability
- Data visualization, data science

**Program Scale:**

- Over **500,000 badges** awarded since inception
- Continuous expansion of offerings
- Integrated with career development and promotion processes

**Credly Integration:**

- Credly issues and verifies digital badges
- Web-enabled, shareable on LinkedIn, email signatures, internal systems
- Contains metadata: skills acquired, criteria met, issue date, verification

_Sources: [EY Value Realized 2024](https://www.ey.com/content/dam/ey-unified-site/ey-com/en-us/campaigns/value-realized-annual-report/documents/ey-cs-impact-report-2024-final.pdf), [Credly Support](https://support.credly.com/hc/en-us/articles/360021222071-What-is-a-badge)_

---

#### 2. Learning Experience Platform (LXP)

**Platform Access:** lxp-portal.ey.com

**Key Features:**

- Centralized learning hub
- Progress tracking
- Continuous professional development support
- Resource library

**Integration:**

- Connected to SuccessFactors learning modules
- Links to EY Badges program
- Integrates with Credly for badge issuance

---

#### 3. SuccessFactors Learning Modules

- Browse online learnings
- Access virtual live classrooms
- Direct connection with live facilitators
- Integration with performance management and goal setting

---

#### 4. EY Virtual Academy

**Platform:** eyvirtualacademy.com

**Focus Areas:**

- Financial modeling
- Business valuation
- Data analytics
- Professional development courses

---

#### 5. EY Tech MBA and Master's Programs

**Partnership:** Hult International Business School

**Programs:**

- Business Analytics (online)
- Sustainability (online)
- **Free** to all EY employees

---

### System Integration Architecture

#### Data Flow Architecture

**Core Systems:**

1. **SAP SuccessFactors** → Central HR data repository
2. **EY PX360** → Experience and operational data integration
3. **Qualtrics** → Experience data (X-data) collection
4. **Credly** → Digital badge verification
5. **IBM Watson** → AI-powered employee assistance
6. **SAP Jam** → Social collaboration and learning
7. **EY Mobility Pathway** → International assignment management

**Integration Patterns:**

| Integration                 | Data Flow                                                     |
| --------------------------- | ------------------------------------------------------------- |
| SuccessFactors ↔ PX360      | O-data flows (performance, utilization, learning, compliance) |
| Qualtrics ↔ PX360           | X-data flows (surveys, feedback, engagement)                  |
| SuccessFactors ↔ Credly     | Learning completion triggers badge issuance                   |
| IBM Watson ↔ SuccessFactors | Chatbot queries employee data, processes HR requests          |
| SAP Jam ↔ SuccessFactors    | Social learning tracked, goal management synced               |

---

### Platform Implications Summary

**System Integration Opportunities for Our Platform:**

1. **SuccessFactors Data Access:**

   - Employee profiles, skills, performance metrics
   - Learning records and badge data
   - Performance ratings and feedback
   - **Challenge:** Competition = no real access, must mock data

2. **Credly API Integration:**

   - Badge metadata and verification
   - Skills associated with badges
   - Issue dates and expiration
   - **Opportunity:** Public API may be accessible for demo

3. **Performance Metrics Integration:**

   - Utilization rates, billable hours, realization
   - Timesheet compliance, CPE hours
   - Quality ratings, engagement scores
   - **Use Case:** Career Competitiveness Dashboard

4. **Learning Data Integration:**
   - Learning hours from SuccessFactors/LXP
   - Badge acquisition patterns
   - Skill development trajectories
   - **Use Case:** Upskilling path recommendations

**Workflow Alignment:**

- Match promotion evaluation criteria (Nine Box, performance ratings)
- Align with agile promotion framework (skill-based advancement)
- Support internal mobility processes (Mobility4U-style discovery)
- Integrate with learning pathways (badge requirements, LXP resources)

**Mock Data Requirements:**

- Realistic SuccessFactors-style employee profiles
- Credly badge data (use public Credly API structure)
- Performance metrics matching EY patterns
- Learning records and development activities

**Demo Strategy:**

- Show how platform COULD integrate with SuccessFactors
- Demonstrate Credly badge import capability
- Display performance metrics in EY-style dashboards
- Align workflows with EY promotion and mobility processes

---

### Research Completeness

**This Section Adds:**

- ✅ Detailed system architecture (SuccessFactors, PX360, Watson, Jam integration)
- ✅ Promotion process workflows (calibration sessions, agile promotions, effective dates)
- ✅ Internal mobility systems (Mobility4U, EYMP, Career Agility details)
- ✅ Learning system integration (badges, LXP, SuccessFactors connection)
- ✅ Performance review cycles (fiscal year alignment, review stages, timelines)
- ✅ Operational workflows (step-by-step processes for key activities)

**Combined with Previous Section:**

- ✅ Comprehensive performance metrics (financial, compliance, quality, development, people, client, DEI)
- ✅ LEAD framework details
- ✅ Nine Box model and advancement criteria
- ✅ Primary research on timesheet compliance, utilization, feedback

**Result:** Complete foundation for understanding EY's performance management, talent development, and internal mobility ecosystem
