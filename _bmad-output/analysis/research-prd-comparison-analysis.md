# Research vs PRD Comparison Analysis

**Date:** 2025-12-20
**Purpose:** Compare research findings to PRD to identify gaps, contradictions, and reasoning flaws

---

## Executive Summary

The PRD is **largely well-aligned** with the research, but several critical gaps and one significant contradiction were identified:

### Critical Issues Found:

1. **CONTRADICTION:** Utilization targets - PRD uses "effective utilization" but research shows different calculation methods
2. **GAP:** Missing detailed calibration session workflow in PRD
3. **GAP:** PRD doesn't specify how to handle EY-Parthenon's different structure
4. **REASONING FLAW:** Skip promotion criteria may be too strict (requires 18 months but research says "high performers skip every year")
5. **GAP:** PRD mentions "effective utilization" but doesn't explain the calculation difference

### Strengths:

- Career progression timelines match perfectly
- Promotion windows correctly identified
- Success pattern categories align
- Service line translation tables match research
- Technical stack recommendations are sound

---

## Detailed Comparison

### 1. Career Progression Model

#### ✅ ALIGNED: Career Hierarchy

- PRD correctly identifies: Staff → Senior → Manager → Senior Manager → Partner/ED
- Research confirms this structure
- Partner vs ED distinction correctly captured

#### ✅ ALIGNED: Progression Timelines

- PRD table matches research exactly:
  - Consulting: 2 → 2-3 → 2-4 → 4-8 years
  - Tax: 2-3 → 2-3 → 3-4 → 6-8 years
  - Audit: 3 → 2-3 → 3 → 2-5+ years
- EY-Parthenon exception noted in both

#### ⚠️ GAP: EY-Parthenon Handling

- **PRD:** Mentions EY-Parthenon exception but doesn't specify how system handles it
- **Research:** Provides full structure (Associate → Senior Associate → Consultant → Director → Senior Director → Partner)
- **Issue:** System needs to handle two different career hierarchies
- **Recommendation:** Add logic to detect EY-Parthenon employees and apply different progression model

---

### 2. Utilization Targets

#### ❌ CONTRADICTION: Utilization Calculation Method

**PRD States:**

- Staff: "Utilization 95%+"
- Senior: "Utilization 90%+"
- Manager: "Utilization 85%+"
- Senior Manager: "Utilization 80%+"
- Partner: "Utilization 70%+"

**Research Clarifies:**

- **Full utilization:** Hours charged / 40 hours (doesn't account for time off)
- **Effective utilization:** Hours charged / (40 - non-work hours like PTO, holidays, sick time)
- **Effective utilization is the metric that matters for performance evaluation**

**PRD Also States:**

- Line 317: "Utilization targets _decrease_ as seniority increases"
- This is correct, but PRD doesn't specify which calculation method

**The Problem:**

- PRD uses percentages (95%, 90%, etc.) but doesn't clarify if these are "full" or "effective" utilization
- Research shows effective utilization is what matters
- Example: An employee with 95% full utilization might only have 85% effective utilization after accounting for PTO

**Recommendation:**

- Clarify in PRD that all utilization targets refer to **effective utilization**
- Add calculation method to technical requirements
- Update UI to show both metrics with explanation

#### ✅ ALIGNED: Inverse Relationship

- PRD correctly identifies that utilization decreases with seniority
- Research confirms this reflects shift to BD, people management, strategic work
- Both documents align on this insight

---

### 3. Promotion Eligibility Rules

#### ✅ ALIGNED: Basic Rules

- Minimum time in role: 12 months (both agree)
- Promotion windows: January (agile) + August (regular) (both agree)
- Track record window: 90 days (both agree)
- Agile promotions for rank changes only (both agree)

#### ⚠️ REASONING FLAW: Skip Promotion Criteria

**PRD States (lines 513-519):**

```python
skip_promotion_eligible = (
    performance_rating >= 4.5 AND
    utilization >= 95% AND
    badges_gold_or_higher >= 2 AND
    has_sponsor == True AND
    time_in_role_months >= 18  # ⚠️ THIS IS THE ISSUE
)
```

**Research States:**

- "At EY (especially Audit), high performers are skip promoted **every year**"
- "More common in human capital/management consulting than technical/cyber roles"
- Research doesn't specify minimum time requirement for skip promotions

**The Problem:**

- PRD requires 18 months for skip promotion, but research says skip promotions happen "every year"
- If skip promotions happen annually, they could occur at 12 months (not 18)
- The 18-month requirement may be too conservative

**Recommendation:**

- Clarify: Skip promotions can happen at 12 months if all other criteria met
- The "skip" refers to skipping a rank level (e.g., Staff 1 → Staff 2 → Sr 1 → Sr 2 → Manager, skipping Sr 3)
- Not skipping the time requirement itself

#### ✅ ALIGNED: Calibration Timeline

- PRD: "Late May/June: Calibration sessions held, promotion decisions made"
- Research confirms: "Round tables held in late May/June for August promotions"
- Both align on ~3 months before effective date

---

### 4. Success Pattern Analysis

#### ✅ ALIGNED: Six Metric Categories

Both documents identify the same six categories:

1. Financial (utilization, billable hours, realization)
2. Compliance (timesheet, CPE hours, policy)
3. Quality (engagement ratings, technical excellence)
4. Development (learning hours, mentoring)
5. People (upward feedback, team scores)
6. Feedback themes (NLP analysis)

#### ✅ ALIGNED: Success Pattern Benchmarks

PRD table (lines 310-315) matches research table:

- → Senior: 90%+ utilization, 0 mentees, "Technical depth" theme
- → Manager: 85%+ utilization, 1-2 mentees, "Leadership emerging" theme
- → Senior Manager: 80%+ utilization, 2+ mentees, "Client management, BD" theme
- → Partner: 70%+ utilization, Portfolio mentees, "Strategic, rainmaker" theme

#### ⚠️ GAP: Realization Rate Details

- **PRD:** Mentions "realization rate" but doesn't explain what it is
- **Research:** Clarifies "Total amount invoiced / Total labor charged for a job"
- **Research:** "Large accounting firms typically have realization in low 80% range"
- **Issue:** PRD mentions realization but doesn't provide target ranges or how to calculate
- **Recommendation:** Add realization rate explanation and target ranges to PRD

---

### 5. Success Factors Beyond Metrics

#### ✅ ALIGNED: Sponsor Factor

- PRD correctly identifies: "Big Four promotions depend more on politics and your boss having your back"
- Research confirms this finding
- Both recommend tracking sponsor_score based on senior relationships

#### ✅ ALIGNED: Visibility Moves

- PRD table matches research findings
- Both identify internal community leadership, thought leadership, mentoring
- Time investment estimates align

#### ✅ ALIGNED: Personal Brand

- PRD captures "Go-To Expert" concept
- Research confirms specialization accelerates advancement
- Both recommend tracking specialization_score

#### ✅ ALIGNED: Politics Reality

- PRD includes the quote about "merit ends, politics enters"
- Research confirms this finding
- Both recommend transparency about this reality

---

### 6. Service Line Translation

#### ✅ ALIGNED: Translation Tables

- PRD's Audit → Tech Risk/Advisory table matches research
- PRD's Tax → Advisory table matches research
- PRD's Consulting → Other Service Lines table matches research
- All match confidence levels align

#### ✅ ALIGNED: Mobility4U Data

- PRD: "~900 employees have started new mobility assignments"
- Research: "~900 employees have started new mobility assignments"
- PRD: "4,100+ employees on mobility assignments"
- Research: "4,100+ employees on mobility assignments or one-way transfers"
- Numbers match perfectly

---

### 7. Technical Stack

#### ✅ ALIGNED: Vector Database Recommendations

- PRD: Chroma for demo, Qdrant/Pinecone for production
- Technical Research: Chroma optimal for MVP (free, simple), Qdrant best performance/cost ratio
- Both align on migration path

#### ✅ ALIGNED: LLM Strategy

- PRD: GPT-5.2 Instant with dual validation
- Technical Research: GPT-5.2 Instant with dual validation pattern recommended
- Both align on approach

#### ✅ ALIGNED: Caching Strategy

- PRD: Multi-layer caching (semantic, prompt, response, embedding)
- Technical Research: Semantic caching 68.8% reduction, prompt caching 90% cost reduction
- PRD's caching strategy aligns with research findings

#### ✅ ALIGNED: Architecture Pattern

- PRD: Monolithic for MVP with clear service boundaries
- Technical Research: Monolithic recommended for MVP, microservices-ready design
- Both align on approach

---

### 8. EY Systems Integration

#### ✅ ALIGNED: Core Systems

- PRD mentions SuccessFactors, Credly, O\*NET
- Research confirms these are the right systems
- Both align on mock data approach for competition

#### ⚠️ GAP: PX360 Integration Details

- **PRD:** Mentions PX360 but doesn't detail X-data vs O-data integration
- **Research:** Provides detailed explanation of PX360's dual data model
- **Issue:** PRD doesn't explain how SpringAIS would integrate with PX360's experience data
- **Recommendation:** Add PX360 integration details to PRD (even if post-MVP)

#### ⚠️ GAP: Calibration Session Workflow

- **PRD:** Mentions calibration sessions but doesn't detail the workflow
- **Research:** Provides 4-stage calibration process (Preparation, Meeting, Adjustment, Finalization)
- **Issue:** PRD doesn't explain how SpringAIS supports calibration sessions
- **Recommendation:** Add calibration support features to PRD (e.g., calibration-ready data exports)

---

### 9. Badge Program

#### ✅ ALIGNED: Badge Levels

- PRD: Learning, Bronze, Silver, Gold, Platinum
- Research: Learning, Bronze, Silver, Gold, Platinum
- Both align on structure

#### ✅ ALIGNED: Badge Requirements

- PRD mentions badges in success patterns
- Research provides detailed requirements for each level
- Both align on badge importance

#### ⚠️ GAP: Badge Count

- **PRD:** Doesn't specify how many badges exist
- **Research:** "87 different badges available"
- **Issue:** PRD doesn't provide context on badge variety
- **Recommendation:** Add badge count and domains to PRD for context

---

### 10. Promotion Windows

#### ✅ ALIGNED: Timing

- PRD: August (regular), January (agile)
- Research: August (regular), January (agile, moved from May)
- Both align on current timing

#### ✅ ALIGNED: Agile Promotion Scope

- PRD: "Rank changes only" (Staff→Senior, Senior→Manager, Manager→SM)
- Research: "Typically for rank changes only"
- Both align on scope

#### ✅ ALIGNED: Fiscal Year

- PRD: July 1 - June 30
- Research: July 1 - June 30
- Both align perfectly

---

## Critical Flaws in Thought Process

### 1. Utilization Calculation Ambiguity

**The Flaw:**

- PRD uses utilization percentages without clarifying calculation method
- Research shows there are TWO different calculations (full vs effective)
- PRD doesn't specify which one to use

**Impact:**

- System could calculate wrong metric
- Employees might see misleading comparisons
- Success pattern benchmarks could be inaccurate

**Fix:**

- Clarify all utilization targets refer to **effective utilization**
- Add calculation method to technical requirements
- Update UI to show both metrics with explanation

### 2. Skip Promotion Time Requirement

**The Flaw:**

- PRD requires 18 months for skip promotion eligibility
- Research says skip promotions happen "every year"
- These statements conflict

**Impact:**

- System might incorrectly reject eligible skip promotion candidates
- Could create false negatives in promotion readiness assessment

**Fix:**

- Clarify: Skip promotions can happen at 12 months if all other criteria met
- The "skip" refers to skipping rank levels, not time requirements
- Update skip_promotion_eligible logic

### 3. Missing Calibration Support

**The Flaw:**

- PRD mentions calibration sessions but doesn't explain how SpringAIS supports them
- Research provides detailed calibration workflow
- PRD misses opportunity to differentiate on calibration support

**Impact:**

- Missing feature that could be valuable to HR users
- Could be a differentiator vs competitors

**Fix:**

- Add calibration support features to PRD
- Include calibration-ready data exports
- Add manager calibration dashboard features

### 4. EY-Parthenon Handling

**The Flaw:**

- PRD mentions EY-Parthenon exception but doesn't specify how system handles it
- Research provides full EY-Parthenon structure
- System needs to handle two different career hierarchies

**Impact:**

- System might incorrectly model EY-Parthenon employee progression
- Could give wrong recommendations to EY-Parthenon employees

**Fix:**

- Add logic to detect EY-Parthenon employees
- Apply different progression model for EY-Parthenon
- Update career hierarchy detection

---

## Recommendations

### High Priority Fixes

1. **Clarify Utilization Calculation**

   - Update PRD to specify "effective utilization" for all targets
   - Add calculation method to technical requirements
   - Update UI requirements to show both metrics

2. **Fix Skip Promotion Logic**

   - Change time requirement from 18 months to 12 months
   - Clarify that "skip" refers to rank levels, not time
   - Update skip_promotion_eligible code block

3. **Add Calibration Support**

   - Add calibration-ready data export features
   - Include manager calibration dashboard
   - Detail calibration workflow support

4. **Handle EY-Parthenon**
   - Add EY-Parthenon detection logic
   - Create separate progression model for EY-Parthenon
   - Update career hierarchy handling

### Medium Priority Additions

5. **Add Realization Rate Details**

   - Explain realization rate calculation
   - Add target ranges (low 80% range)
   - Include in success pattern benchmarks

6. **Add PX360 Integration Details**

   - Explain X-data vs O-data integration
   - Detail how SpringAIS would use experience data
   - Add to post-MVP roadmap

7. **Add Badge Context**
   - Include "87 different badges" in PRD
   - List badge domains
   - Provide context on badge variety

### Low Priority Enhancements

8. **Add More Calibration Details**
   - Include 4-stage calibration process
   - Detail manager preparation workflow
   - Add calibration outcome tracking

---

## Conclusion

The PRD is **strong and well-researched**, with most content aligning perfectly with the research. The main issues are:

1. **Ambiguity** in utilization calculation method
2. **Overly conservative** skip promotion time requirement
3. **Missing features** that could differentiate (calibration support)
4. **Incomplete handling** of EY-Parthenon structure

These are all fixable and don't undermine the core product vision. The PRD demonstrates deep understanding of EY's systems and processes, with only minor gaps to address.
