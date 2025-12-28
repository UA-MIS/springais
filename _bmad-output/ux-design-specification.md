---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - "_bmad-output/prd.md"
  - "_bmad-output/analysis/research-prd-comparison-analysis.md"
  - "_bmad-output/analysis/product-brief-SpringAIS-2025-12-18.md"
  - "_bmad-output/analysis/research/technical-ai-talent-platform-technical-stack-research-2025-12-18.md"
  - "_bmad-output/analysis/research/market-ai-talent-mobility-platform-research-2025-12-18.md"
  - "_bmad-output/analysis/research/domain-ey-performance-systems-promotion-evaluation-research-2025-12-18.md"
  - "_bmad-output/analysis/research/domain-ey-career-progression-success-patterns-research-2025-12-20.md"
  - "_bmad-output/analysis/research/domain-ai-talent-mobility-platform-research-2025-12-18.md"
  - "_bmad-output/analysis/brainstorming-session-2025-12-18.md"
workflowType: 'ux-design'
lastStep: 8
project_name: 'SpringAIS'
user_name: 'Clays'
date: '2025-12-27'
---

# UX Design Specification SpringAIS

**Author:** Clays
**Date:** 2025-12-27

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

### Project Vision

SpringAIS transforms how EY employees discover career opportunities and chart their professional growth. Unlike traditional job-matching systems, SpringAIS reveals hidden opportunities employees didn't know existed, then provides a clear, actionable roadmap showing exactly how to get there—backed by patterns from employees who have successfully made similar transitions.

The platform's breakthrough innovation is the **Success Pattern Analysis**, which shows employees how they compare to those who have successfully advanced. The "holy shit" moment: An employee exploring a Manager role sees: _"Employees who advanced to Manager typically showed 87% effective utilization (you: 78%), 2+ active mentees (you: 0), feedback themes emphasizing 'leadership'..."_ Suddenly, vague career advice becomes a concrete, motivating action plan.

### Target Users

**Primary Users: EY Employees**
- **Problem:** Information about career advancement is scattered across multiple systems; employees must consult HR to explore promotion opportunities
- **Goal:** Discover what needs to be done to achieve a desired role and find roles they're a possible fit for
- **Tech Proficiency:** Mixed—from proficient to fairly new; design must accommodate both
- **Context:** Use at work or in free time; needs to feel accessible and not like "work"
- **Devices:** Primarily laptop/computer for bulk of interaction, mobile devices for quick progress/certification updates

**Secondary Users: Hiring Managers**
- Need to staff roles faster with qualified internal candidates
- Want quality signals without exposing private performance reviews
- Require explainable match reasoning for staffing decisions

**Administrative Users: HR, Compliance, Systems**
- Ensure fairness and governance
- Monitor bias and disparate impact
- Maintain audit trails for regulatory compliance

### Key Design Challenges

1. **Information Architecture & Consolidation**
   - Consolidate scattered information (HR systems, role requirements, promotion criteria, skill gaps) into a single, clear interface
   - Balance comprehensive information with simplicity to avoid overwhelming users

2. **Visual Pathway Clarity**
   - Make the "clear, visual pathway" the hero feature that differentiates SpringAIS
   - Show current state → target role with actionable, time-estimated steps
   - Balance simplicity with actionable detail

3. **Mixed Tech Proficiency**
   - Design for both tech-proficient and less tech-savvy users
   - Implement progressive disclosure, clear guidance, and intuitive navigation
   - Provide onboarding and help without feeling condescending

4. **Context-Aware Design**
   - Support both work time (professional, efficient, task-focused) and free time (personal, potentially anxious, exploratory) contexts
   - Adapt tone and flow to match user's current context

5. **Trust & Transparency**
   - Build trust in AI recommendations through visible explainability
   - Show evidence quotes, reason codes, and confidence levels without cluttering the interface
   - Make the "why" behind every recommendation visible and understandable

### Design Opportunities

1. **Career Journey Map as Differentiator**
   - Interactive visualization showing multiple paths to the same goal
   - Progress tracking: "You're 50% → 70% if you complete X, Y, Z"
   - Visual "holy shit" moment that competitors lack

2. **Progressive Disclosure Pattern**
   - Start with simple overview (match percentage, top 3 gaps)
   - Allow drilling down into details (evidence quotes, full success patterns, trajectory analysis)
   - Respect user's time and attention span

3. **Mobile Micro-Interactions**
   - Quick badge/certification uploads on mobile
   - Progress updates on the go
   - Push notifications for new matches or milestone achievements

4. **Trust Through Transparency**
   - Every recommendation shows "why" with evidence
   - Success Pattern comparisons: "Employees who advanced typically showed X (you: Y)"
   - Confidence indicators and explainability throughout the interface

5. **Gamification & Motivation**
   - Progress visualization (50% → 70% → 90%)
   - Achievement tracking (badges earned, skills developed)
   - Positive framing: "You're on track" vs "You're behind"

## Core User Experience

### Defining Experience

**The Core Interaction:** "See how you compare to successful employees and get your personalized path forward"

Every successful product has a defining experience—the core interaction that, if we nail it, everything else follows. For SpringAIS, this is the **Success Pattern Comparison** moment: when an employee exploring a role sees exactly how they compare to employees who successfully advanced, with concrete benchmarks and actionable steps.

**The "Holy Shit" Moment:**
An employee exploring a Manager role clicks to see details, and the Success Pattern overlay appears: *"Employees who advanced to Manager typically showed 87% effective utilization (you: 78%), 2+ active mentees (you: 0), feedback themes emphasizing 'leadership' and 'client management' (you: strong on 'technical depth', opportunity on 'leadership')."* 

Suddenly, vague career advice like "you need more visibility" becomes concrete: "Request 2 mentees from the Staff pool (2 weeks to set up), lead an internal community initiative (ongoing, 2-3 hrs/week), and complete a stakeholder management course (6 weeks)."

**What Users Will Describe to Friends:**
- "It shows you exactly what successful people did differently"
- "You see your gaps with actual numbers, not just vague feedback"
- "It gives you a real plan with time estimates, not just 'work on leadership'"

**The Core User Loop:**
1. User checks personalized progress map (most frequent action)
2. System shows roles aligned with their skills
3. User explores paths and picks roles of interest
4. **User clicks role → Success Pattern overlay appears → "Holy shit" moment**
5. System updates skill tree automatically based on resume parsing and matching
6. User receives personalized plan with correct path (role + steps) based on qualifications and skills
7. User tracks progress as they complete skills and move toward promotion

**Critical Success Factor:** The system must provide the **correct path**—both the role they pick and the steps to get there—based on accurate qualification and skill assessment. Incorrect path mapping would completely undermine user trust and the product's value proposition.

### Platform Strategy

**Primary Platform:** Responsive web application optimized for both desktop and mobile devices.

**Input Methods:** Mouse/keyboard primary interaction model, with touch support for mobile devices.

**Cross-Platform Requirements:**
- Must work seamlessly on both Mac and Windows for development and testing
- Responsive design ensures optimal experience across screen sizes
- Desktop-first design with mobile optimization for quick updates (badge uploads, progress tracking)

**Technical Considerations:**
- GPU resources available (RTX 3060 Ti, 8GB VRAM; Ryzen 7 5700X) but not required for core functionality
- Web-based architecture ensures broad accessibility without platform-specific constraints

**Offline Functionality:** Not required—all interactions require real-time data synchronization and AI processing.

### Effortless Interactions

**1. Path Exploration & Role Selection**
- Finding roles that align with skills should feel natural and intuitive
- Role matching happens automatically based on skill profile
- Users can explore multiple paths without friction

**2. Skill Tree Updates**
- Skill tree updates automatically when resume is parsed
- Matching algorithm continuously refines skill profile
- No manual skill entry required—system infers from documents

**3. Skill Parsing & Matching**
- Resume upload triggers automatic skill extraction
- Matching to roles happens seamlessly in background
- Users see results without understanding the complexity behind it

**4. Personalized Plan Generation**
- Correct path (role + steps) generated automatically based on qualifications
- No configuration or complex setup required
- Plan appears immediately after initial profile creation

### Critical Success Moments

**1. Personalized Plan Delivery**
- The moment users receive their personalized plan is when they realize "this is better"
- This is the first-time user success moment that establishes trust
- Plan must be accurate, actionable, and visually clear

**2. Progress Achievement**
- Users feel successful when they move up/get promoted
- Completing a skill creates sense of accomplishment
- Progress visualization reinforces positive momentum

**3. Path Accuracy Validation**
- Incorrect path mapping would completely ruin the experience
- System must be more reliable than HR consultation
- Accuracy is non-negotiable—better to show fewer, correct paths than many incorrect ones

**4. Simplicity Over HR Process**
- The entire experience must be easier than going to HR
- If the process is harder, users will abandon it
- Every interaction should feel simpler than the alternative

**5. First-Time Discovery**
- When users first see roles they didn't know existed
- When skill tree automatically populates from resume
- When personalized plan appears without manual configuration

### Experience Principles

**1. Path Accuracy First**
The correct career path (role + steps) based on qualifications and skills is the most critical interaction. Every design decision prioritizes accuracy over speed or quantity. Incorrect path mapping would completely undermine user trust.

**2. Effortless Discovery**
Finding roles that align with skills and updating the skill tree should feel natural and require minimal thought. Skill parsing from resume and matching should happen automatically without user intervention.

**3. Progress Visibility**
Users should frequently check their personalized progress map. This is the core engagement loop that keeps users motivated and informed. The progress map must be visually compelling and always up-to-date.

**4. Simpler Than HR**
The entire process must be easier than going to HR. If it's harder, users will abandon it. Every interaction should feel simpler, faster, and more accessible than the alternative.

**5. Success Through Completion**
Users feel successful when they get a personalized plan, move up/get promoted, or complete a skill. These moments drive continued engagement and must be celebrated and visualized clearly.

**6. Automatic Intelligence**
Skill parsing, matching, and path generation happen automatically. Users shouldn't need to understand how it works—they just see accurate, actionable results.

### User Mental Model

**How Users Currently Solve This Problem:**

Employees currently navigate career advancement through fragmented, manual processes:
- **HR Consultation:** Schedule meetings with HR business partners, ask vague questions, receive generic advice
- **Counselor Conversations:** Annual or semi-annual discussions with career counselors, often reactive rather than proactive
- **Manager Feedback:** Inconsistent feedback across projects, no unified view of themes or gaps
- **Self-Research:** Scour internal job boards, guess at skill requirements, hope for the best
- **Network Reliance:** Ask colleagues "what did you do to get promoted?" hoping for actionable insights

**Mental Model Users Bring:**

- **Expectation:** Career advice will be vague ("work on leadership," "build visibility," "get more client exposure")
- **Assumption:** They need to figure it out themselves or rely on who they know
- **Belief:** Promotion criteria are opaque and political, not based on clear metrics
- **Frustration:** No single source of truth for what actually drives advancement
- **Anxiety:** Fear of exploring opportunities because current manager might find out

**What Users Love/Hate About Existing Approaches:**

**Love:**
- Personal relationships with counselors/managers who know their context
- When specific, actionable feedback is given (rare)
- Success stories from colleagues who made similar transitions

**Hate:**
- Vague, unactionable feedback ("be more strategic")
- Inconsistent advice across different managers/counselors
- No visibility into what successful employees actually did
- Fear of being "found out" when exploring other roles
- Time-consuming process (scheduling meetings, waiting for responses)
- No clear metrics or benchmarks to track progress

**Shortcuts and Workarounds:**
- Employees create their own spreadsheets tracking skills, certifications, projects
- They ask peers in similar roles what worked for them
- They look at LinkedIn profiles of people who advanced to see patterns
- They attend internal events hoping to network and learn

**Where Users Get Confused or Frustrated:**
- When feedback contradicts across different sources
- When they don't understand what "readiness" actually means
- When they can't see how their metrics compare to successful employees
- When exploring opportunities feels risky or secretive
- When they can't translate "Audit skills" to "Tech Risk requirements"

**What Makes Existing Solutions Feel Magical or Terrible:**

**Magical (Rare):**
- When a counselor gives specific, data-backed advice: "Employees who advanced to Manager in your practice averaged 87% utilization and had 2+ mentees"
- When a manager provides clear development plan with time estimates
- When internal mobility works smoothly and transparently

**Terrible (Common):**
- Vague feedback with no concrete next steps
- Black box promotion decisions with no explanation
- Fear of career exploration being discovered
- No way to see how you compare to successful peers
- Advice that contradicts what you've heard elsewhere

### Success Criteria

**What Makes Users Say "This Just Works":**

- **Concrete Comparisons:** "I can see exactly how I compare to employees who advanced—87% utilization vs my 78%, 2 mentees vs my 0"
- **Actionable Steps:** "It tells me exactly what to do: request 2 mentees (2 weeks), lead community initiative (2-3 hrs/week), stakeholder course (6 weeks)"
- **Time Estimates:** "I know how long each step takes, so I can plan realistically"
- **Evidence-Backed:** "Every skill inference shows the quote from my resume that supports it—I trust it"
- **No Guessing:** "I don't have to wonder what 'visibility' means—it's spelled out with specific actions"

**When Users Feel Smart or Accomplished:**

- When they discover roles they didn't know existed but are qualified for
- When they see their skill tree automatically populate from their resume
- When they understand their gaps with concrete numbers, not vague feedback
- When they complete a recommended action and see their match percentage increase
- When they can explain to their manager exactly what they're doing to advance

**What Feedback Tells Users They're Doing It Right:**

- **Visual Progress:** Match percentage increases (50% → 70% → 90%) as they complete actions
- **Success Pattern Alignment:** Their metrics move closer to successful employee benchmarks
- **Skill Completion:** Skills move from "missing" to "in progress" to "completed" in the skill tree
- **Positive Reinforcement:** "You're on track" messaging when they're meeting benchmarks
- **Achievement Celebrations:** Milestone notifications when they complete major steps

**How Fast Should It Feel:**

- **Initial Setup:** Resume upload → skill extraction → matches appear in <15 seconds (uncached) or <3 seconds (cached)
- **Role Exploration:** Click role → Success Pattern overlay appears instantly (pre-calculated)
- **Path Generation:** Personalized upskilling path appears immediately after role selection
- **Progress Updates:** Real-time updates as skills are completed, no page refresh needed
- **Overall Feel:** Snappy, responsive, no waiting or loading states that feel slow

**What Should Happen Automatically:**

- Skill extraction from uploaded documents (no manual entry)
- Role matching based on skill profile (no searching required)
- Success Pattern calculation (always available when viewing roles)
- Progress tracking (updates as user completes actions)
- Match percentage recalculation (when skills are added/completed)
- Notification of new matches or opportunities (proactive, not reactive)

**Success Indicators:**

1. **User discovers 2+ roles they didn't know existed** within first session
2. **User receives concrete action plan** with time estimates within 5 minutes of first use
3. **User understands their gaps** with specific numbers (not vague feedback) immediately
4. **User feels motivated, not discouraged** by the feedback (positive framing throughout)
5. **User can explain their path** to a friend/manager in one sentence after using the system

### Novel UX Patterns

**Pattern Analysis:**

SpringAIS combines familiar UX patterns in innovative ways to create a novel experience:

**Established Patterns We Use:**
- **Progress Tracking:** Familiar from fitness apps, learning platforms (Duolingo, Coursera)
- **Matching/Discovery:** Similar to job boards (LinkedIn, Handshake) and dating apps (Tinder)
- **Dashboard Visualization:** Common in analytics tools and performance management systems
- **Skill Trees:** Familiar from gaming (RPG skill trees) and learning platforms
- **Comparison Views:** Similar to benchmarking tools and competitive analysis

**Novel Combination:**

The breakthrough is combining these patterns in a way that creates the "Success Pattern Comparison" experience—something no competitor offers:

1. **Semantic AI Matching** (familiar: job matching) + **Success Pattern Benchmarking** (novel: what successful employees actually did)
2. **Progress Tracking** (familiar: skill completion) + **Trajectory Comparison** (novel: multiple paths with future viability)
3. **Skill Visualization** (familiar: skill trees) + **Evidence Quotes** (novel: every skill shows supporting resume quote)
4. **Anonymous Exploration** (familiar: privacy-first) + **Mutual Opt-In Matching** (novel: two-sided anonymous discovery)

**What Makes This Different:**

- **No competitor shows Success Pattern comparisons**—they stop at skill matching
- **No competitor provides evidence quotes** for every skill inference (explainable AI)
- **No competitor shows trajectory analysis**—comparing multiple paths with future viability
- **No competitor combines all six metric categories** (financial, compliance, quality, development, people, feedback) in one view

**How We Teach Users This New Pattern:**

- **Familiar Metaphors:** "Like a GPS for your career" (shows path, time estimates, progress)
- **Progressive Disclosure:** Start with simple match percentage, allow drilling into Success Pattern details
- **Visual Hierarchy:** Success Pattern overlay appears on role detail view (familiar: modal/overlay pattern)
- **Onboarding:** First-time user sees guided tour highlighting Success Pattern comparison
- **Tooltips and Help:** "Why this recommendation?" buttons throughout with clear explanations

**Familiar Patterns We Innovate Within:**

- **Job Matching:** We add Success Pattern overlay (what successful employees did) + trajectory analysis (future viability)
- **Progress Tracking:** We add comparative benchmarking (you vs. successful employees) + time estimates
- **Skill Trees:** We add evidence quotes (explainable AI) + multiple path visualization
- **Anonymous Matching:** We add mutual opt-in flow (two-sided discovery) + tokenized profiles

**Our Unique Twist:**

Every recommendation shows **three layers of insight**:
1. **What you can do** (skill matching—familiar)
2. **What successful employees did** (Success Pattern comparison—novel)
3. **How to get there** (personalized path with time estimates—enhanced familiar)

### Experience Mechanics

**Core Experience Flow: Success Pattern Discovery**

Let's design the step-by-step flow for the defining experience—seeing Success Pattern comparisons and getting personalized paths:

**1. Initiation:**

**How User Starts:**
- User logs in and lands on personalized dashboard showing their current progress map
- Dashboard highlights new matches or updated Success Pattern insights
- User can click "Explore Roles" or click directly on a role match card
- Alternative entry: User searches for specific role or browses by service line/level

**What Triggers or Invites:**
- **Proactive Notifications:** "You've been matched to 3 new roles" (if new matches found)
- **Progress Updates:** "Your match to Manager role increased to 82%" (after skill completion)
- **Success Pattern Alerts:** "See how you compare to employees who advanced to Manager"
- **Visual Cues:** Role cards show match percentage prominently, Success Pattern badge if available
- **Empty States:** If no matches yet, prompt to upload resume to get started

**2. Interaction:**

**What User Actually Does:**
1. **Clicks on role card** (e.g., "Manager, Technology Consulting - 78% match")
2. **Role detail view opens** showing:
   - Match breakdown (skills matched, gaps identified)
   - Success Pattern overlay button ("See how you compare")
3. **User clicks "See Success Pattern"** button
4. **Success Pattern overlay appears** with:
   - Comparative metrics (you vs. successful employees)
   - Specific gaps highlighted with numbers
   - Behavioral recommendations (mentees, visibility moves)
5. **User clicks "Get My Path"** to see personalized upskilling plan
6. **Career Journey Map appears** showing:
   - Current position
   - Target role
   - Steps to bridge the gap
   - Time estimates for each step

**What Controls or Inputs:**
- **Mouse/Keyboard:** Primary interaction (click role cards, buttons, expand/collapse sections)
- **Touch:** Mobile support for tapping role cards, swiping through matches
- **Filters:** Service line, level, match percentage, location (optional refinement)
- **Search:** Text search for specific roles or skills
- **Navigation:** Breadcrumbs, back button, related roles suggestions

**How System Responds:**
- **Instant Feedback:** Role cards respond to hover (highlight, show preview)
- **Smooth Transitions:** Overlay slides in from side, no jarring page reloads
- **Progressive Loading:** Match percentages appear first, Success Pattern data loads on demand
- **Visual Feedback:** Loading states show progress ("Analyzing your profile..."), success animations
- **Error Handling:** Graceful degradation if Success Pattern data unavailable, clear error messages

**3. Feedback:**

**What Tells Users They're Succeeding:**
- **Match Percentage:** Clear visual indicator (78% match) with confidence interval
- **Success Pattern Alignment:** Green checkmarks when metrics meet benchmarks, yellow warnings for gaps
- **Progress Visualization:** Skill tree shows completed skills in green, in-progress in yellow, missing in gray
- **Positive Messaging:** "You're on track" when meeting benchmarks, "You're close" when near targets
- **Achievement Badges:** Visual celebrations when milestones reached ("Skill completed!", "Match improved!")

**How Users Know It's Working:**
- **Immediate Results:** Matches appear within seconds of resume upload
- **Accurate Inferences:** Skill extraction shows evidence quotes they recognize from their resume
- **Relevant Matches:** Roles shown align with their actual experience and interests
- **Actionable Insights:** Recommendations are specific and achievable, not vague
- **Progress Updates:** Match percentages increase as they complete recommended actions

**What Happens If They Make a Mistake:**
- **Incorrect Skill Inference:** User can reject/modify skills with explanation of why
- **Wrong Role Match:** User can hide roles, provide feedback ("Not interested")
- **Confusion:** Help tooltips, "Why this recommendation?" buttons, guided tours available
- **System Error:** Clear error messages with recovery paths, support contact information
- **Data Issues:** User can re-upload resume, refresh profile, contact support

**4. Completion:**

**How Users Know They're Done:**
- **Clear End State:** User has selected target role(s), reviewed Success Pattern comparison, received personalized path
- **Action Plan Visible:** Upskilling path displayed with checkboxes for each step
- **Progress Tracking Active:** System now tracks completion of recommended actions
- **Next Steps Clear:** Dashboard shows "Your next actions" with prioritized list
- **Success Confirmation:** "Your career path is set! Complete these steps to reach your goal"

**What's the Successful Outcome:**
- User has **clear understanding** of:
  - Where they are (current skills, metrics, position)
  - Where they want to go (target role with match percentage)
  - How they compare (Success Pattern benchmarks)
  - What to do next (personalized action plan with time estimates)
- User feels **motivated and empowered**, not discouraged or overwhelmed
- User has **actionable next steps** they can start immediately

**What's Next:**
- User begins executing action plan (requesting mentees, enrolling in courses, etc.)
- System tracks progress and updates match percentages in real-time
- User returns to dashboard regularly to check progress and discover new opportunities
- User receives notifications when new matches appear or milestones are reached
- User can explore additional roles or adjust their career goals as they progress

## Desired Emotional Response

### Primary Emotional Goals

**1. Empowered**
Users should feel empowered and in control of their career path. They have clear visibility into what they need to do, how to do it, and when they'll be ready. The system gives them agency rather than making them feel passive or dependent on others.

**2. Proud**
Users should feel proud of their achievements and progress. Every skill completed, every milestone reached, every step forward should be recognized and celebrated. The system helps users see their growth and feel proud of their journey.

**3. Happy/Accomplished**
Users should feel happy and accomplished when they complete their goals—whether that's getting a personalized plan, completing a skill, or moving up/getting promoted. Success should feel rewarding and motivating.

### Emotional Journey Mapping

**1. First Discovery: Intrigued**
When users first discover SpringAIS, they should feel intrigued by the possibilities. The system reveals hidden opportunities they didn't know existed, sparking curiosity and interest. The "holy shit" moment of seeing roles they're qualified for creates intrigue.

**2. Core Experience: Determined**
During the core experience (checking progress map, exploring paths), users should feel determined. They have clear goals, actionable steps, and visible progress. The system fuels their determination by showing them exactly what to do and how close they are to their goals.

**3. After Completion: Satisfied**
After completing a task (getting personalized plan, seeing matches, completing a skill), users should feel satisfied. They've accomplished something meaningful, and the system validates their progress. Satisfaction comes from seeing clear results and knowing they're on the right track.

**4. When Things Go Wrong: Sympathetic**
When something goes wrong (incorrect path, system error, unexpected result), users should feel that the system is sympathetic and helpful. Error messages are understanding, recovery paths are clear, and the system takes responsibility. Users never feel blamed or frustrated by system failures.

**5. Returning: Excited**
When users return to SpringAIS, they should feel excited to see new progress, new matches, new opportunities. The system has evolved since their last visit, showing updated progress, new roles, and fresh achievements. Returning feels like checking in on a growing career.

### Micro-Emotions

**Excitement vs. Anxiety**
- **Goal:** Create excitement about opportunities without overwhelming users
- **Design Approach:** Progressive disclosure—show exciting opportunities gradually, not all at once. Use clear categorization (Best Fit, Stretch, Exploratory) to help users process options. Provide filters and controls so users feel in charge of what they see.
- **Avoid:** Dumping 50+ role matches at once, showing all gaps simultaneously, creating choice paralysis

**Accomplishment vs. Frustration**
- **Goal:** Maximize feelings of accomplishment while minimizing frustration
- **Design Approach:** Celebrate every win, no matter how small. Show progress clearly (50% → 70% → 90%). Break large goals into achievable milestones. Provide clear next steps so users always know what to do. Use positive framing ("You're on track" vs "You're behind").
- **Avoid:** Highlighting only what's missing, showing overwhelming skill gaps, making progress feel impossible

**Confidence vs. Confusion**
- **Goal:** Build confidence through clarity and transparency
- **Design Approach:** Every recommendation shows "why" with evidence. Success Pattern comparisons are clear and understandable. Path explanations are simple and actionable. Users always understand where they are and where they're going.
- **Avoid:** Black box recommendations, unexplained percentages, unclear next steps

**Trust vs. Skepticism**
- **Goal:** Build trust in AI recommendations through transparency
- **Design Approach:** Show evidence quotes for every skill inference. Display reason codes for every match. Make confidence levels visible. Explain how Success Patterns are calculated. Users can see the "why" behind every recommendation.
- **Avoid:** Hiding how decisions are made, showing results without explanation, making AI feel like a black box

### Design Implications

**Empowerment Through Design:**
- Clear, actionable steps users can take immediately
- Progress visualization showing users they're in control
- Multiple path options so users can choose their journey
- Transparent information so users understand their situation
- Control over what they see (filters, preferences, opt-in/out)

**Pride Through Design:**
- Achievement celebrations when skills are completed
- Progress milestones visualized clearly
- Badge/certification displays showing accomplishments
- Success Pattern comparisons showing growth
- Visual progress tracking (50% → 70% → 90%)

**Happiness/Accomplishment Through Design:**
- Positive reinforcement throughout the experience
- Clear success states when goals are achieved
- Progress visualization showing forward momentum
- Completion animations and celebrations
- "You're on track" messaging vs. deficit-focused language

**Intrigue Through Design:**
- Reveal hidden opportunities gradually
- "You didn't know you were qualified for..." moments
- Success Pattern overlays showing surprising insights
- Exploratory mode revealing unexpected career paths
- Visual "holy shit" moments in Career Journey Map

**Determination Through Design:**
- Clear goals with visible progress toward them
- Actionable steps with time estimates
- Progress tracking showing how close they are
- Success Pattern comparisons showing what's needed
- Path visualization showing the journey ahead

**Satisfaction Through Design:**
- Clear completion states for all tasks
- Validation when progress is made
- Visual confirmation of achievements
- Progress updates showing forward movement
- Success Pattern alignment showing readiness

**Sympathy Through Design:**
- Helpful, understanding error messages
- Clear recovery paths when things go wrong
- System takes responsibility, doesn't blame user
- Alternative suggestions when primary path fails
- Supportive tone in all error states

**Excitement Through Design:**
- New discoveries highlighted on return visits
- Progress updates showing growth
- New matches surfaced prominently
- Achievement notifications
- Fresh content and opportunities

### Emotional Design Principles

**1. Empower, Don't Overwhelm**
Give users control and agency while protecting them from information overload. Progressive disclosure, clear categorization, and user-controlled filters ensure empowerment without anxiety.

**2. Celebrate Every Win**
No achievement is too small to recognize. Skills completed, progress made, milestones reached—all deserve celebration. Pride and accomplishment come from seeing growth, not just final outcomes.

**3. Positive Framing Always**
Frame everything in terms of progress and opportunity, not deficits. "You're on track" not "You're behind." "Here's how to get there" not "You're missing these." Happiness comes from forward momentum, not gap highlighting.

**4. Transparency Builds Trust**
Show the "why" behind every recommendation. Evidence quotes, reason codes, confidence levels, Success Pattern explanations—all build trust through transparency. Users feel confident when they understand.

**5. Sympathetic Error Handling**
When things go wrong, be understanding and helpful. Error messages should feel supportive, not technical. Recovery paths should be clear and easy. Users should never feel blamed or frustrated by system failures.

**6. Excitement Through Discovery**
Create moments of discovery and surprise. Hidden opportunities, unexpected matches, surprising insights—these create excitement and intrigue. But balance discovery with clarity to avoid anxiety.

**7. Progress Visibility = Motivation**
Show progress clearly and frequently. Visual progress tracking, milestone celebrations, achievement displays—all create determination and excitement. Users stay engaged when they see their growth.

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**LinkedIn - Professional Networking & Career Growth**

**Core Problem Solved:** Professional networking and career discovery made accessible and actionable. Users can build their professional identity, connect with opportunities, and track career growth all in one platform.

**Effective Onboarding:** Profile-first approach—users build their professional identity before discovering opportunities. This establishes a foundation that makes subsequent recommendations more relevant and personalized.

**Navigation & Information Hierarchy:** Social feed + search model creates dual discovery paths—passive discovery through feed and active search. Clear primary/secondary navigation keeps core actions accessible.

**Innovative Interactions:** 
- Celebratory animations for milestones create positive reinforcement
- AI writing support reduces friction in profile building
- Smart job recommendations based on profile activity

**Visual Design:** Professional, familiar interface that feels trustworthy and enterprise-ready. Clean, uncluttered design supports information-heavy content.

**Error Handling:** Soft blocking with inline validation prevents errors before they happen. Contextual help guides users through complex forms.

**Key Takeaway:** Profile-first onboarding + opportunity discovery creates a natural flow from identity building to opportunity exploration.

**Handshake - Student-Employer Career Discovery**

**Core Problem Solved:** Connects students with employers through school-tied platform, making career discovery accessible for early-career users.

**Effective Onboarding:** School tie-in + career preferences creates immediate personalization. Users see relevant opportunities from day one.

**Navigation & Information Hierarchy:** Opportunity-driven navigation with powerful filters. Users can explore by role type, location, company, or let smart matching surface opportunities.

**Innovative Interactions:**
- Smart matching algorithm surfaces relevant opportunities automatically
- Event integrations create multiple touchpoints for engagement
- Application tracking keeps users informed of progress

**Visual Design:** Clean, approachable design that feels less intimidating than traditional job boards. Designed for early-career users who may be less experienced with professional platforms.

**Error Handling:** Context-aware errors with guided next steps. System helps users recover rather than blocking them.

**Key Takeaway:** Opportunity-driven navigation + smart matching creates "always something to do" experience that keeps users engaged.

### Transferable UX Patterns

**1. Profile-First Onboarding Flow (LinkedIn)**
- **Pattern:** Build profile → establish identity → discover opportunities
- **SpringAIS Adaptation:** Upload resume → skill extraction → see matches → explore paths
- **Why It Works:** Establishes foundation before showing opportunities, making recommendations more relevant
- **Implementation:** Initial onboarding focuses on document upload and skill extraction. Only after profile is established do we show role matches and career paths.

**2. Opportunity-Driven Navigation (Handshake)**
- **Pattern:** Filters and discovery modes surface relevant opportunities with clear categorization
- **SpringAIS Adaptation:** Best Fit/Stretch/Exploratory/Trending modes with service line, level, location filters
- **Why It Works:** Users always have something actionable—they can explore different opportunity types based on their goals
- **Implementation:** Primary navigation organized by discovery mode. Users can switch between "Ready Now" (Best Fit), "Growth Opportunities" (Stretch), "Career Pivots" (Exploratory), and "Emerging Roles" (Trending).

**3. Progress Visibility & Milestones (Both)**
- **Pattern:** Clear progress indicators and milestone celebrations keep users engaged
- **SpringAIS Adaptation:** Progress map showing 50% → 70% → 90% with skill completion milestones, achievement celebrations
- **Why It Works:** Users see forward momentum and feel accomplished as they progress
- **Implementation:** Progress visualization in Career Journey Map. Milestone celebrations when skills are completed. Achievement badges for major milestones.

**4. Smart Matching with User Control (Handshake)**
- **Pattern:** AI matching algorithm + user-controlled filters creates balance between automation and control
- **SpringAIS Adaptation:** Semantic AI matching surfaces opportunities automatically, but users can filter by service line, level, location, match percentage
- **Why It Works:** Combines AI intelligence with user agency—users feel empowered, not passive
- **Implementation:** Default view shows AI-recommended matches, but users can apply filters to refine. Filters are always visible and easy to adjust.

**5. Celebratory Moments (LinkedIn)**
- **Pattern:** Animations and celebrations for achievements create positive reinforcement
- **SpringAIS Adaptation:** Skill completion animations, progress milestone celebrations, match achievement notifications
- **Why It Works:** Creates emotional connection and positive reinforcement that drives continued engagement
- **Implementation:** Subtle animations when skills are completed. Progress milestone celebrations. Achievement notifications for major milestones.

**6. Context-Aware Error Handling (Handshake)**
- **Pattern:** Guided next steps when errors occur, maintaining user momentum
- **SpringAIS Adaptation:** Sympathetic error messages with clear recovery paths. Alternative suggestions when primary path fails.
- **Why It Works:** Users don't feel blocked or frustrated—they always have a way forward
- **Implementation:** Error messages explain what went wrong and provide clear next steps. When path mapping fails, suggest alternative approaches. Always provide recovery options.

**7. "Always Something to Do" Engagement (Both)**
- **Pattern:** Platform always surfaces actionable next steps, keeping users engaged
- **SpringAIS Adaptation:** Progress map always shows next steps, new matches surface regularly, skill gaps suggest immediate actions
- **Why It Works:** Users return because there's always progress to make, opportunities to explore, or skills to develop
- **Implementation:** Dashboard always shows actionable items. New matches highlighted prominently. Skill gaps suggest immediate next steps with time estimates.

### Anti-Patterns to Avoid

**1. Overwhelming Initial Experience**
- **Anti-Pattern:** Showing too many options or matches at once creates choice paralysis
- **Why to Avoid:** Conflicts with "Excitement vs. Anxiety" emotional goal—we want excitement, not overwhelm
- **SpringAIS Approach:** Progressive disclosure—start with top 5-10 matches, allow drilling down. Use clear categorization to help users process options.

**2. Passive User Experience**
- **Anti-Pattern:** Users just browse without clear actions to take
- **Why to Avoid:** Conflicts with "Empowered" emotional goal—users need agency and control
- **SpringAIS Approach:** Every view shows actionable next steps. Progress map always has clear "what to do next" items. Users can filter, explore, and take action.

**3. Black Box Recommendations**
- **Anti-Pattern:** Showing matches without explaining why
- **Why to Avoid:** Conflicts with "Trust vs. Skepticism" emotional goal—users need transparency
- **SpringAIS Approach:** Every match shows reason codes, evidence quotes, and confidence levels. Success Pattern comparisons explain "why" clearly.

**4. Deficit-Focused Messaging**
- **Anti-Pattern:** Highlighting only what's missing or wrong
- **Why to Avoid:** Conflicts with "Accomplishment vs. Frustration" emotional goal—we want accomplishment, not frustration
- **SpringAIS Approach:** Positive framing—"You're on track" not "You're behind." Show progress and achievements alongside gaps.

**5. Complex Navigation**
- **Anti-Pattern:** Too many navigation levels or unclear information hierarchy
- **Why to Avoid:** Conflicts with "Simpler Than HR" experience principle—navigation should be intuitive
- **SpringAIS Approach:** Clear primary/secondary navigation. Opportunity-driven organization. Filters always accessible but not overwhelming.

### Design Inspiration Strategy

**What to Adopt:**

**1. Profile-First Onboarding Flow**
- Adopt LinkedIn's profile-first approach because it establishes foundation before showing opportunities
- Users build their skill profile through document upload, then see relevant matches
- This supports "Path Accuracy First" principle—accurate profile leads to accurate paths

**2. Opportunity-Driven Navigation**
- Adopt Handshake's opportunity-driven navigation because it creates "always something to do" experience
- Discovery modes (Best Fit, Stretch, Exploratory, Trending) organize opportunities by user intent
- This supports "Effortless Discovery" principle—users can explore naturally

**3. Progress Visibility & Milestones**
- Adopt both platforms' progress visibility patterns because they create engagement and motivation
- Progress map showing 50% → 70% → 90% with milestone celebrations
- This supports "Progress Visibility" principle and "Proud" emotional goal

**4. Smart Matching with User Control**
- Adopt Handshake's balance of AI matching + user filters because it empowers users
- AI surfaces opportunities automatically, but users control what they see
- This supports "Empowered" emotional goal and "Effortless Discovery" principle

**What to Adapt:**

**1. Celebratory Moments (Simplified)**
- Adapt LinkedIn's celebratory animations but keep them subtle and professional
- Focus on progress milestones and skill completions, not every small action
- Adapt for enterprise context—celebrations should feel professional, not playful

**2. Context-Aware Error Handling (Enhanced)**
- Adapt Handshake's context-aware errors but add Success Pattern context
- When path mapping fails, suggest alternative paths based on Success Patterns
- Enhance with "why this happened" explanations to build trust

**What to Avoid:**

**1. Visual Design Elements**
- Do not adopt visual design aspects—SpringAIS needs its own visual identity
- Focus only on flow patterns, navigation structures, and interaction models
- Visual design will be defined separately in design system step

**2. Social Feed Model**
- Do not adopt LinkedIn's social feed model—SpringAIS is not a social network
- Focus on career path discovery, not social connections
- Keep focus on individual career journey, not community features

**3. Complex Profile Building**
- Do not adopt complex profile building workflows
- SpringAIS uses automatic skill extraction from documents, not manual profile building
- Keep onboarding simple—upload documents, see results, explore paths

**4. Application Tracking Focus**
- Do not adopt Handshake's application tracking as primary feature
- SpringAIS focuses on career path discovery and development, not application management
- Opt-in matching is secondary to path discovery and skill development

## Design System Foundation

### Design System Choice

**Selected System: shadcn/ui**

shadcn/ui is a collection of re-usable components built with Radix UI and Tailwind CSS. Components are copied into your project, giving you complete control over the code and styling. This approach provides the perfect balance of speed and customization for SpringAIS's 8-week competition timeline.

### Rationale for Selection

**1. Speed with Customization**
- Copy-paste component model allows rapid development while maintaining full design control
- No vendor lock-in—components live in your codebase and can be customized completely
- Perfect for 8-week timeline where speed matters but enterprise professionalism is required

**2. Enterprise-Ready Foundation**
- Built on Radix UI primitives with accessibility built-in (WCAG 2.1 AA compliance)
- Professional, clean component defaults that align with EY enterprise context
- Components can be styled to match EY brand guidelines while maintaining proven patterns

**3. React + TypeScript Alignment**
- Native React components with full TypeScript support
- Integrates seamlessly with existing React + TypeScript stack
- Works perfectly with React Flow for Career Journey Map visualization

**4. Team Expertise Match**
- Expert team can leverage shadcn/ui's flexibility and customization capabilities
- Open to learning approach aligns with shadcn/ui's copy-paste, learn-as-you-go model
- Full component code access enables deep customization when needed

**5. Balance of Speed and Uniqueness**
- Provides professional foundation while allowing complete visual customization
- Can create unique EY-branded experience without starting from scratch
- Faster than custom design system, more flexible than rigid component libraries

### Implementation Approach

**1. Component Strategy**
- Start with shadcn/ui base components (Button, Card, Dialog, Form, etc.)
- Use `shadcn/ui-admin` or `refine.dev` for admin dashboard boilerplate (saves 2-3 days per PRD)
- Customize components to match EY brand guidelines and SpringAIS requirements
- Build custom components for unique features (Career Journey Map, Success Pattern overlays, Progress visualization)

**2. Design Tokens**
- Define EY brand colors, typography, spacing, and elevation tokens
- Customize Tailwind CSS configuration to match EY brand guidelines
- Establish consistent spacing, border radius, and shadow patterns
- Create semantic color tokens (primary, secondary, success, warning, error) aligned with EY brand

**3. Component Customization**
- Customize shadcn/ui components to match EY enterprise aesthetic
- Ensure professional, trustworthy visual language throughout
- Maintain accessibility standards while applying brand customization
- Create component variants for different contexts (employee view, manager view, admin view)

**4. Integration with React Flow**
- Use shadcn/ui components for Career Journey Map controls and overlays
- Ensure consistent styling between shadcn/ui components and React Flow visualization
- Create custom React Flow node components styled with shadcn/ui patterns

**5. Responsive Design**
- Leverage Tailwind CSS responsive utilities for mobile/desktop optimization
- Ensure shadcn/ui components work seamlessly across screen sizes
- Test on both Mac and Windows as per platform requirements

### Customization Strategy

**1. EY Brand Alignment**
- Apply EY brand colors, typography, and visual language to shadcn/ui components
- Ensure professional, enterprise-ready aesthetic throughout
- Maintain consistency with EY's existing internal tools and platforms

**2. SpringAIS-Specific Components**
- Build custom components for unique features:
  - Career Journey Map visualization (React Flow integration)
  - Success Pattern overlay components
  - Progress visualization components (50% → 70% → 90%)
  - Skill tree and path visualization
  - Match result cards with reason codes and evidence quotes
- Use shadcn/ui patterns as foundation, customize for SpringAIS needs

**3. Component Variants**
- Create variants for different user types (Employee, Hiring Manager, Admin)
- Ensure consistent component behavior while allowing role-specific customization
- Use shadcn/ui's variant system for different states and contexts

**4. Accessibility First**
- Leverage Radix UI's built-in accessibility features
- Ensure WCAG 2.1 AA compliance throughout
- Test with screen readers and keyboard navigation
- Maintain accessibility while customizing for EY brand

**5. Performance Optimization**
- Use Tailwind CSS's purging to minimize bundle size
- Optimize component imports to only include what's needed
- Ensure fast load times for 8-week competition demo
- Balance customization with performance requirements

## Visual Design Foundation

### Color System

**EY Brand Colors - Core Palette:**

SpringAIS uses the official EY brand color palette as the foundation for all visual design decisions, ensuring consistency with EY's enterprise identity while creating a distinctive, modern application experience.

**Primary Brand Colors:**

| Color Name | Hex Code | Usage | Accessibility Notes |
|------------|----------|-------|---------------------|
| **EY Yellow** | `#FFE600` | Signature accent color, primary CTAs, highlights, success states | High contrast on dark backgrounds, use sparingly for emphasis |
| **EY Off Black** | `#2E2E38` | Primary text, wordmark, headings, high-contrast elements | Excellent readability, WCAG AAA compliant on light backgrounds |
| **EY Confident Black** | `#1A1A24` | Deep backgrounds, elevated surfaces, emphasis | Maximum contrast for digital applications |
| **EY Gray 02** | `#C4C4CD` | Subtle UI accents, borders, disabled states, backgrounds | Medium contrast, suitable for secondary elements |
| **EY Gray 01** | `#747480` | Secondary text, captions, placeholders, icons | Good readability, WCAG AA compliant on light backgrounds |
| **EY Off White** | `#F6F6FA` | Content backgrounds, large surfaces, card backgrounds | Soft, professional alternative to pure white |
| **White** | `#FFFFFF` | Primary backgrounds, clean surfaces, contrast | Maximum brightness for content areas |

**Semantic Color Mapping:**

To support the application's functional needs while maintaining EY brand identity, we map semantic colors to the brand palette:

**Primary Actions & Brand:**
- **Primary:** EY Yellow (`#FFE600`) - Main CTAs, primary buttons, brand highlights
- **Primary Hover:** Darker yellow variant (`#E6CF00`) - Interactive states
- **Primary Text on Yellow:** EY Off Black (`#2E2E38`) - Text on yellow backgrounds

**Text & Content:**
- **Primary Text:** EY Off Black (`#2E2E38`) - Body text, headings, main content
- **Secondary Text:** EY Gray 01 (`#747480`) - Captions, metadata, less important content
- **Tertiary Text:** EY Gray 02 (`#C4C4CD`) - Placeholders, hints, disabled text

**Backgrounds & Surfaces:**
- **Primary Background:** White (`#FFFFFF`) - Main application background
- **Secondary Background:** EY Off White (`#F6F6FA`) - Cards, panels, elevated surfaces
- **Tertiary Background:** EY Gray 02 (`#C4C4CD`) - Subtle backgrounds, dividers
- **Elevated Surface:** EY Confident Black (`#1A1A24`) - Dark mode surfaces, modals (if used)

**Status & Feedback Colors:**

While EY's palette is primarily monochromatic with yellow accent, we extend the system for functional status indicators:

- **Success:** EY Yellow (`#FFE600`) - Achievement, completion, positive states
- **Success Background:** Light yellow tint (`#FFF9CC`) - Success message backgrounds
- **Warning:** Orange variant (`#FF8C00`) - Cautions, important notices (complements yellow)
- **Error:** Red variant (`#DC2626`) - Errors, critical alerts (high contrast, accessible)
- **Info:** Blue variant (`#2563EB`) - Informational messages, links (professional, trustworthy)

**Accessibility Compliance:**

- **Contrast Ratios:** All text meets WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text)
- **EY Off Black on White:** 12.6:1 (AAA compliant)
- **EY Gray 01 on White:** 4.8:1 (AA compliant)
- **EY Yellow on EY Off Black:** 8.2:1 (AAA compliant for large text)
- **Color Independence:** All status information includes icons/text, not color alone

**Color Usage Guidelines:**

- **EY Yellow:** Use strategically for emphasis, CTAs, and brand moments. Avoid overuse—it's powerful but can be overwhelming
- **Neutral Palette:** EY Off Black, grays, and whites create professional, trustworthy foundation
- **Status Colors:** Use sparingly and consistently—success (yellow), warning (orange), error (red), info (blue)
- **Dark Mode Consideration:** EY Confident Black provides foundation for future dark mode implementation

### Typography System

**Typeface Selection:**

SpringAIS uses a professional, modern typeface system that aligns with EY's enterprise identity while ensuring excellent readability across all content types.

**Primary Typeface: Inter (System Font Fallback)**

- **Rationale:** Inter is a modern, highly legible sans-serif designed for screens. It's professional yet approachable, with excellent readability at all sizes
- **Fallback Stack:** `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- **Usage:** Body text, UI elements, buttons, labels, all primary content
- **Why Inter:** Optimized for screen reading, supports multiple weights, excellent character spacing, professional appearance

**Secondary Typeface: System Monospace (for code/data)**

- **Rationale:** Monospace fonts for technical content, code snippets, data displays
- **Fallback Stack:** `'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Droid Sans Mono', 'Courier New', monospace`
- **Usage:** Code examples, technical data, employee IDs (EMP-482910), system messages

**Type Scale:**

Establishing a clear hierarchy that supports both dense information display and clear communication:

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **H1 - Hero** | 48px (3rem) | 700 (Bold) | 1.2 | Page titles, major sections |
| **H2 - Section** | 36px (2.25rem) | 700 (Bold) | 1.3 | Section headings, role titles |
| **H3 - Subsection** | 24px (1.5rem) | 600 (Semi-bold) | 1.4 | Subsection headings, card titles |
| **H4 - Card Title** | 20px (1.25rem) | 600 (Semi-bold) | 1.4 | Card headings, feature titles |
| **H5 - Label** | 18px (1.125rem) | 600 (Semi-bold) | 1.5 | Form labels, small headings |
| **Body Large** | 18px (1.125rem) | 400 (Regular) | 1.6 | Important body text, descriptions |
| **Body** | 16px (1rem) | 400 (Regular) | 1.6 | Primary body text, default content |
| **Body Small** | 14px (0.875rem) | 400 (Regular) | 1.5 | Secondary text, captions |
| **Caption** | 12px (0.75rem) | 400 (Regular) | 1.4 | Metadata, timestamps, fine print |
| **UI Text** | 14px (0.875rem) | 500 (Medium) | 1.4 | Buttons, navigation, UI elements |

**Typography Hierarchy Principles:**

- **Clear Visual Hierarchy:** Size and weight differences create clear content structure
- **Readability First:** Line heights optimized for comfortable reading (1.5-1.6 for body text)
- **Scannable Content:** Headings use sufficient weight (600-700) to stand out without overwhelming
- **Consistent Spacing:** Typography spacing aligns with 8px spacing system

**Typography Usage Guidelines:**

- **Headings:** Use H1-H5 consistently to establish information hierarchy
- **Body Text:** Default to 16px body for optimal readability, use 18px for important content
- **Emphasis:** Use weight (600/700) for emphasis, not just size—maintains hierarchy
- **Line Length:** Optimal reading width 60-75 characters (max-width constraints)
- **Color Contrast:** All text meets WCAG AA standards (EY Off Black on white: 12.6:1)

**Content-Specific Typography:**

- **Match Percentages:** Large, bold numbers (24-36px) for match scores, with clear labels
- **Success Pattern Data:** Clear hierarchy—metric names (H4), values (Body Large, bold), comparisons (Body)
- **Evidence Quotes:** Italic body text with quotation styling for skill inference quotes
- **Navigation:** Medium weight (500) UI text for clear hierarchy without heaviness
- **Form Labels:** H5 size (18px, 600 weight) for clear, scannable form structure

### Spacing & Layout Foundation

**Spacing System:**

SpringAIS uses an 8px base spacing unit, creating consistent, harmonious spacing relationships throughout the interface.

**8px Base Unit System:**

- **Base Unit:** 8px (0.5rem)
- **Rationale:** 8px provides fine-grained control while maintaining visual harmony
- **Divisibility:** Easily divisible (4px, 8px, 16px, 24px, 32px, 40px, 48px) for flexible spacing
- **Alignment:** Ensures consistent alignment with typography and component sizes

**Spacing Scale:**

| Token | Value | Usage |
|-------|-------|-------|
| **xs** | 4px (0.25rem) | Tight spacing, icon padding, compact UI |
| **sm** | 8px (0.5rem) | Small gaps, icon-text spacing, tight groups |
| **md** | 16px (1rem) | Default spacing, component padding, comfortable gaps |
| **lg** | 24px (1.5rem) | Section spacing, card padding, breathing room |
| **xl** | 32px (2rem) | Large gaps, section separation, major spacing |
| **2xl** | 40px (2.5rem) | Extra large spacing, major section breaks |
| **3xl** | 48px (3rem) | Hero spacing, page-level separation |

**Component Spacing:**

- **Card Padding:** 24px (lg) - Comfortable content padding within cards
- **Button Padding:** 12px vertical, 24px horizontal - Comfortable click targets
- **Form Field Spacing:** 16px (md) between fields - Clear separation without waste
- **Section Spacing:** 32-48px (xl-3xl) between major sections - Clear visual breaks
- **Content Margins:** 16-24px (md-lg) for text content - Optimal reading flow

**Layout Principles:**

**1. Content-First Layout**
- Primary focus on content readability and scannability
- Generous white space prevents overwhelming information density
- Clear visual hierarchy guides user attention

**2. Responsive Grid System**
- **Desktop:** 12-column grid with 24px gutters
- **Tablet:** 8-column grid with 16px gutters  
- **Mobile:** 4-column grid with 16px gutters
- **Max Content Width:** 1280px for optimal reading width on large screens
- **Container Padding:** 24px (lg) on mobile, 32px (xl) on desktop

**3. Flexible Component Layout**
- Components adapt to available space while maintaining minimum sizes
- Cards and panels use consistent padding regardless of content
- Spacing relationships remain consistent across breakpoints

**4. Visual Breathing Room**
- EY Off White (`#F6F6FA`) backgrounds provide subtle separation
- Generous spacing between interactive elements prevents accidental clicks
- White space used strategically to group related content

**5. Information Density Balance**
- Dense enough for power users (match data, metrics, comparisons)
- Spacious enough for clarity and reduced cognitive load
- Progressive disclosure allows drilling into details without overwhelming

**Layout Structure:**

- **Header:** Fixed height 64px, full-width, contains navigation and user menu
- **Main Content:** Max-width 1280px centered, with responsive padding
- **Sidebar (when used):** 280px width, collapsible, contains filters/navigation
- **Card Grid:** Responsive grid with consistent card sizing and spacing
- **Form Layout:** Single column on mobile, two-column on desktop for efficiency

### Accessibility Considerations

**Color Accessibility:**

- **Contrast Compliance:** All text meets WCAG 2.1 AA standards (minimum 4.5:1 for normal text)
- **Color Independence:** Status information never relies on color alone—always includes icons, text, or patterns
- **Focus States:** Clear, high-contrast focus indicators (EY Yellow outline, 2px width) for keyboard navigation
- **Disabled States:** Sufficient contrast (EY Gray 02) to indicate disabled but remain visible

**Typography Accessibility:**

- **Readable Sizes:** Minimum 14px for body text, 16px preferred for optimal readability
- **Line Height:** 1.5-1.6 for body text ensures comfortable reading for users with dyslexia
- **Font Weight:** Sufficient weight (400 minimum) for clarity, avoiding thin fonts that reduce readability
- **Text Scaling:** All sizes use relative units (rem) to support browser zoom up to 200%

**Spacing Accessibility:**

- **Touch Targets:** Minimum 44x44px for interactive elements (buttons, links, cards)
- **Clickable Areas:** Generous padding ensures easy interaction, especially on mobile
- **Focus Indicators:** Adequate spacing around focus states prevents overlap with adjacent elements

**Layout Accessibility:**

- **Semantic HTML:** Proper heading hierarchy (H1-H5) for screen reader navigation
- **Landmark Regions:** Clear ARIA landmarks (header, main, navigation, aside, footer)
- **Keyboard Navigation:** Logical tab order, skip links for main content
- **Screen Reader Support:** Descriptive labels, ARIA attributes, hidden text for context

**Visual Accessibility:**

- **Motion Sensitivity:** Respects `prefers-reduced-motion` for animations and transitions
- **Focus Management:** Focus trapped in modals, returned to trigger after closing
- **Error Communication:** Errors clearly indicated with text, icons, and color (not color alone)

**Accessibility Testing:**

- **Automated:** Use tools like axe DevTools, WAVE for initial compliance checks
- **Manual:** Keyboard-only navigation testing, screen reader testing (NVDA, JAWS, VoiceOver)
- **User Testing:** Include users with disabilities in testing when possible
- **Ongoing:** Regular accessibility audits throughout development

