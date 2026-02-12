# Badge/Certification Discovery & Deep-Linking Research

> Research Date: 2026-02-11
> Author: Researcher Agent
> Status: Complete

## Executive Summary

This document evaluates approaches for discovering and deep-linking to specific badges and certifications relevant to user skills in the SpringAIS application. The current implementation links generically to `https://www.credly.com/organizations/ey/badges` -- the goal is to link to **specific** badges matched to user skills.

**Key finding:** A hybrid approach combining the **Microsoft Learn Catalog API** (free, public, no auth), **Credly authenticated API** (requires EY enterprise agreement), **structured URL patterns** for major providers, and an **AI-powered curated mapping layer** provides the best balance of coverage, accuracy, and maintainability.

---

## 1. Credly API

### Overview
Credly (by Pearson) is the dominant digital badge platform. EY uses Credly extensively -- confirmed at `https://www.credly.com/organizations/ey/badges`. EY issues badges covering strategy, data, government/public sector, and more.

### API Availability

#### Authenticated API (Official)
- **Base URL:** `https://api.credly.com/v1/`
- **Auth:** Basic Auth (`Authorization: Basic {Base64(token:)}`) or OAuth 2.0 Bearer tokens
- **Key Endpoint:** `GET /v1/organizations/{organization_id}/badge_templates`

**Supported query parameters:**
| Parameter | Description |
|-----------|-------------|
| `filter=skills::value` | Filter by comma-delimited skill tags |
| `filter=name::value` | Search by badge name (partial match; use quotes for exact) |
| `filter=state::active` | Filter by state (active/archived/draft) |
| `filter=public::true` | Filter to public badges only |
| `sort` | Sort by name, created_at, updated_at, badges_count |
| `page`, `per` | Pagination (default page size ~50) |

**Response fields include:** id, name, description, vanity_slug, image_url, url, skills (array), level (Foundational/Intermediate/Advanced), cost, time_to_earn, type_category, certification, earn_this_badge_url, global_activity_url

**Critical capability:** The `filter=skills::` parameter allows us to search badge templates by skill tags. This is the most direct way to match user skills to EY badges.

#### Undocumented Public JSON Endpoints
- **User badges:** `https://www.credly.com/users/{user-id}/badges.json` (no auth required, but no CORS)
- **Organization badges page:** `https://www.credly.com/organizations/ey/badges` (renders dynamically, not easily scraped)
- These endpoints are undocumented and could break at any time

### URL Patterns for Deep-Linking
| Pattern | Example |
|---------|---------|
| Organization badge list | `https://www.credly.com/organizations/ey/badges` |
| Specific badge template | `https://www.credly.com/org/ey/badge/{vanity_slug}` |
| Skill-related badges | `https://www.credly.com/skills/{skill-name}/related_badges` |
| Individual issued badge | `https://www.credly.com/badges/{badge-uuid}` |

**Confirmed EY badge URLs:**
- `https://www.credly.com/org/ey/badge/ey-strategy-learning-2021`
- `https://www.credly.com/org/ey/badge/ey-data-strategy-data-platform-learning-2021`

### Access Requirements
- Credly API access requires an **enterprise agreement**
- Pricing: ~$2,500-$20,000/year depending on volume + setup fee
- Per-badge cost: $2-$5 per badge issued
- No free tier or trial
- **EY likely already has an enterprise Credly agreement** since they actively issue badges

### Feasibility: HIGH (with enterprise access)
If EY has or can obtain Credly API access, the skill-based filtering is exactly what we need. The `vanity_slug` field enables deterministic deep-link URL construction.

---

## 2. Microsoft Learn Catalog API

### Overview
Microsoft provides a **free, public, no-authentication-required** API for their entire certification catalog.

### API Details
- **Endpoint:** `https://learn.microsoft.com/api/catalog/`
- **Auth:** None required (fully public)
- **Rate limits:** Not documented but appears generous

**Key query parameters:**
| Parameter | Values |
|-----------|--------|
| `type` | `certifications`, `mergedCertifications` |
| `level` | `beginner`, `intermediate`, `advanced` |
| `role` | `developer`, `functional-consultant`, `administrator`, etc. |
| `product` | `azure`, `dynamics-365`, `power-platform`, etc. |
| `subject` | `cloud-computing`, etc. |
| `uid` | Specific certification UID (case-sensitive) |

**Response fields for `mergedCertifications`:**
```json
{
  "uid": "certification.azure-solutions-architect",
  "title": "Microsoft Certified: Azure Solutions Architect Expert",
  "summary": "...",
  "url": "https://learn.microsoft.com/en-us/credentials/certifications/azure-solutions-architect/",
  "icon_url": "https://learn.microsoft.com/en-us/media/learn/certification/badges/...",
  "certification_type": "role-based",
  "products": ["azure"],
  "levels": ["advanced"],
  "roles": ["solution-architect"],
  "skills": ["Skill 1", "Skill 2"],
  "study_guide": [...]
}
```

### URL Pattern for Deep-Linking
```
https://learn.microsoft.com/en-us/credentials/certifications/{certification-id}/
```

### Feasibility: VERY HIGH
This is the best API available -- free, public, rich data, includes skills arrays for matching, and direct URLs for deep-linking. Should be implemented first.

---

## 3. AWS Certifications

### Overview
AWS certifications are a major target for technology professionals. No public API exists, but URL patterns are predictable.

### API Availability
- **No public API** for certification discovery
- AWS certifications are issued as Credly badges via `https://www.credly.com/org/amazon-web-services/badge/`
- Exam registration handled through Pearson VUE

### URL Patterns
| Certification | URL |
|---------------|-----|
| Solutions Architect Associate | `https://aws.amazon.com/certification/certified-solutions-architect-associate/` |
| Solutions Architect Professional | `https://aws.amazon.com/certification/certified-solutions-architect-professional/` |
| Developer Associate | `https://aws.amazon.com/certification/certified-developer-associate/` |
| SysOps Associate | `https://aws.amazon.com/certification/certified-sysops-admin-associate/` |
| Cloud Practitioner | `https://aws.amazon.com/certification/certified-cloud-practitioner/` |

**General pattern:** `https://aws.amazon.com/certification/certified-{role-slug}/`

**Credly pattern:** `https://www.credly.com/org/amazon-web-services/badge/aws-certified-{role-slug}`

### Feasibility: MEDIUM
No API, but the fixed set of ~12 certifications can be statically mapped. URL patterns are predictable. AWS badges on Credly can be discovered via Credly API.

---

## 4. Google Cloud Certifications

### Overview
Google Cloud certifications have a clean URL structure but no public discovery API.

### API Availability
- **No public API** for certification discovery
- Google Cloud uses Credly for digital badge issuance
- Google Cloud Skills Directory is powered by Credly

### URL Patterns
```
https://cloud.google.com/learn/certification/{certification-name}
```

**Examples:**
| Certification | URL |
|---------------|-----|
| Associate Cloud Engineer | `https://cloud.google.com/learn/certification/cloud-engineer` |
| Professional Cloud Architect | `https://cloud.google.com/learn/certification/cloud-architect` |
| Professional Data Engineer | `https://cloud.google.com/learn/certification/data-engineer` |

### Feasibility: MEDIUM
Fixed set of ~10 certifications, predictable URLs. Best handled with a static curated mapping.

---

## 5. Salesforce / Trailhead

### Overview
Salesforce Trailhead combines learning modules (badges) and professional certifications.

### API Availability
- **No official public API** for badge/certification discovery
- Third-party Trailblazer Profile API exists (unofficial)
- Trailhead badges are earned through completing modules, not purchased
- Salesforce certifications are separate from Trailhead badges

### URL Patterns
| Type | Pattern |
|------|---------|
| Trailhead module | `https://trailhead.salesforce.com/content/learn/modules/{module-slug}` |
| Trailmix collection | `https://trailhead.salesforce.com/users/{user}/trailmixes/{trailmix-slug}` |
| Certification info | `https://trailhead.salesforce.com/credentials/{cert-type}` |

### Feasibility: LOW-MEDIUM
No reliable API. Best approach is curated mapping of key Salesforce certifications to their known URLs.

---

## 6. CompTIA Certifications

### Overview
CompTIA is a major vendor-neutral IT certification body. All CompTIA badges are issued through Credly.

### API Availability
- **No direct API** from CompTIA
- All badges issued via **Credly**: `https://www.credly.com/organizations/comptia/badges`
- Discoverable through Credly API if available

### URL Patterns
| Certification | CompTIA URL | Credly URL |
|---------------|-------------|------------|
| A+ | `https://www.comptia.org/certifications/a` | `https://www.credly.com/org/comptia/badge/comptia-a-ce-certification` |
| Security+ | `https://www.comptia.org/certifications/security` | `https://www.credly.com/org/comptia/badge/comptia-security-ce-certification` |
| Network+ | `https://www.comptia.org/certifications/network` | `https://www.credly.com/org/comptia/badge/comptia-network-ce-certification` |

### Feasibility: MEDIUM
Fixed set of ~15 certifications. Credly integration makes them discoverable via Credly API.

---

## 7. PMI Certifications

### Overview
Project Management Institute certifications (PMP, CAPM, etc.) are issued via Credly.

### API Availability
- **No public API** from PMI
- Badges issued via Credly
- PMI certification info at `https://www.pmi.org/certifications`

### URL Patterns
| Certification | URL |
|---------------|-----|
| PMP | `https://www.pmi.org/certifications/project-management-pmp` |
| CAPM | `https://www.pmi.org/certifications/certified-associate-capm` |
| PMI-ACP | `https://www.pmi.org/certifications/agile-acp` |

### Feasibility: MEDIUM
Small fixed set. Best handled with curated mapping.

---

## 8. Open Badges Standard (1EdTech / IMS Global)

### Overview
Open Badges is an interoperability standard, not a discovery mechanism. It defines how badges are structured and exchanged.

### Key Points
- **Open Badges 3.0** released May 2024 by 1EdTech
- Defines badge structure (JSON-LD), issuance, verification, and exchange
- **Badge Connect API** (in OB 2.1) and the OB 3.0 API provide RESTful endpoints for badge exchange
- Uses OAuth 2.0 Authorization Code Grant

### Relevance to Our Use Case
- Open Badges standard does **not** provide a universal badge discovery/search mechanism
- It standardizes how badges are described and verified
- No central registry or aggregator exists for Open Badge discovery
- Individual platforms (Credly, Badgr, etc.) implement the standard but each has its own API

### Feasibility for Discovery: LOW
The standard is about interoperability, not discovery. Not directly useful for our badge search use case.

---

## 9. Badge Aggregator Services

### Services Evaluated
| Platform | API | Discovery | Notes |
|----------|-----|-----------|-------|
| **Credly** | Yes (enterprise) | Best for org-specific badges | Dominant platform, most certifications end up here |
| **Accredible** | Yes | Limited | Used by some ed-tech providers |
| **BadgeCert** | RESTful API available | Limited | Smaller platform, contact for API access |
| **Certifier** | Yes | Limited | Growing platform |
| **Sertifier** | Yes | Limited | 8M+ credentials issued |

**No universal badge aggregator exists.** Credly is the closest thing to a central platform, as most major certification providers (AWS, CompTIA, PMI, Google Cloud, Cisco, etc.) issue badges through Credly.

---

## 10. Badge Relevance Matching Approaches

### Approach A: Keyword Matching (Simplest)
- Match user skill strings against badge skill tags
- Use exact and partial string matching
- **Pro:** Simple to implement, deterministic
- **Con:** Misses semantic relationships ("Python" won't match "Python Programming")

### Approach B: Curated Mapping Table (Most Reliable)
- Manually map skills to relevant certifications/badges
- Store as a database table or JSON configuration
- **Pro:** Most accurate, full control over recommendations
- **Con:** Requires ongoing maintenance, doesn't scale to thousands of skills

### Approach C: AI Semantic Similarity (Most Flexible)
- Use embeddings (Sentence-BERT, OpenAI) to compute similarity between user skills and badge descriptions/skills
- Compute cosine similarity between skill vectors and badge vectors
- **Pro:** Handles synonyms, abbreviations, related concepts
- **Con:** Requires embedding infrastructure, less deterministic, potential hallucination

### Approach D: Hybrid (Recommended)
1. **Curated mapping** for high-value certifications (AWS, Azure, GCP, CompTIA, PMI) -- ~50-100 entries
2. **Credly API skill filter** for EY-specific and other Credly-hosted badges
3. **Microsoft Learn API** for all Microsoft/Azure certifications (free, rich data)
4. **AI similarity** as a fallback/enhancement layer for uncovered skills
5. **URL template construction** for providers with predictable patterns

---

## 11. Recommended Strategy

### Tier 1: Immediate Implementation (No External Dependencies)

| Component | Approach | Effort |
|-----------|----------|--------|
| **Microsoft Learn Catalog API** | Direct API integration, no auth needed | Low |
| **Curated mapping table** | Static JSON/DB mapping of top 50-100 certifications to skills | Medium |
| **URL template construction** | Build deep links from known patterns (AWS, GCP, CompTIA, PMI) | Low |

### Tier 2: Medium-Term (Requires Coordination)

| Component | Approach | Effort |
|-----------|----------|--------|
| **Credly API integration** | Requires EY enterprise API credentials | Medium |
| **Credly skill-based search** | Use `filter=skills::` for dynamic badge discovery | Low (once API access secured) |
| **Badge metadata caching** | Cache Credly badge templates locally for performance | Medium |

### Tier 3: Enhancement (Nice to Have)

| Component | Approach | Effort |
|-----------|----------|--------|
| **AI similarity matching** | Sentence-BERT embeddings for skill-to-badge matching | High |
| **Community-driven curation** | Allow users to suggest badge-skill mappings | Medium |
| **Badge progress tracking** | Track which badges users have earned vs. recommended | Medium |

---

## 12. Risks and Limitations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Credly API access not available** | High | Fall back to curated mapping + URL templates. Undocumented JSON endpoints exist but are fragile. |
| **Badge/cert data goes stale** | Medium | Implement periodic refresh. Microsoft API data is always current. Curated mapping needs quarterly review. |
| **Skill name mismatch** | Medium | Normalize skill names. Use fuzzy matching. AI similarity helps. |
| **URL patterns change** | Low | Monitor with health checks. Major providers rarely change URL structures. |
| **Rate limiting on APIs** | Low | Cache responses aggressively. Microsoft API appears generous. Credly paginated at 50/page. |
| **CORS issues with Credly public endpoints** | Medium | Use backend proxy. Never call undocumented endpoints from frontend directly. |
| **EY-specific badges not discoverable** | Medium | Credly API with org filter is the only reliable approach. |

---

## 13. Cost Considerations

| Component | Cost |
|-----------|------|
| Microsoft Learn Catalog API | **Free** (no auth, no limits documented) |
| Curated mapping maintenance | **Staff time** (~2-4 hours/quarter to review) |
| Credly API (if EY doesn't have it) | **$2,500-$20,000/year** + setup fee |
| AI embeddings (if using OpenAI) | **~$0.0001/query** (negligible at expected volume) |
| AI embeddings (if using local Sentence-BERT) | **Free** after initial infrastructure setup |

---

## 14. Architecture Implications

### Data Flow
```
User Skills --> Matching Engine --> Badge Results --> Deep-Link URLs
                    |
                    +--> Microsoft Learn API (live query)
                    +--> Credly API (cached, skill filter)
                    +--> Curated Mapping Table (local DB)
                    +--> AI Similarity (fallback)
```

### Caching Strategy
- Microsoft Learn data: Cache for 24 hours (data changes infrequently)
- Credly badge templates: Cache for 1 hour (or webhook-driven invalidation)
- Curated mappings: Loaded at startup, refreshed on deployment
- AI embeddings: Pre-computed and stored in database

### Backend Service Design
- New `/api/badges/discover` endpoint accepting skill names
- Aggregates results from all sources
- Returns unified badge objects with: name, provider, description, url, relevance_score, image_url
- Results ranked by relevance score

---

## 15. Summary Table: Provider Comparison

| Provider | API Available | Auth Required | Skill Search | Deep-Link Pattern | Badge Count | Feasibility |
|----------|--------------|---------------|--------------|-------------------|-------------|-------------|
| **Credly** | Yes (enterprise) | Yes (Basic/OAuth) | Yes (skill filter) | `/org/{org}/badge/{slug}` | 1000s | HIGH* |
| **Microsoft Learn** | Yes (free) | No | By role/product/level | `/credentials/certifications/{id}/` | ~150 | VERY HIGH |
| **AWS** | No | N/A | N/A | `/certification/certified-{slug}/` | ~12 | MEDIUM |
| **Google Cloud** | No | N/A | N/A | `/learn/certification/{name}` | ~10 | MEDIUM |
| **CompTIA** | No (via Credly) | Via Credly | Via Credly | `/certifications/{name}` | ~15 | MEDIUM |
| **PMI** | No (via Credly) | Via Credly | Via Credly | `/certifications/{slug}` | ~7 | MEDIUM |
| **Salesforce** | No | N/A | N/A | Varies | 100s of modules | LOW |
| **Open Badges** | Standard only | N/A | No central registry | N/A | N/A | LOW |

*HIGH feasibility assumes EY has or can obtain Credly enterprise API access.

---

## References

- Credly Developer API: https://www.credly.com/docs
- Credly Badge Templates API: https://docs.credly.com/browse/reference/get_v1-organizations-organization-id-badge-templates
- Microsoft Learn Catalog API: https://learn.microsoft.com/en-us/training/support/catalog-api-developer-reference
- Open Badges 3.0 Specification: https://www.imsglobal.org/spec/ob/v3p0
- 1EdTech Open Badges: https://www.1edtech.org/standards/open-badges
- AWS Certifications: https://aws.amazon.com/certification/
- Google Cloud Certifications: https://cloud.google.com/learn/certification
- EY Credly Organization: https://www.credly.com/organizations/ey/badges
- Credly Pricing Reference: https://certifier.io/blog/credly-pricing-is-credly-worth-it-in-2022
- Credly Public Badge Embedding (no API key): https://medium.com/@stephaniehohenberg/how-i-dynamically-embedded-credly-badges-in-my-angular-portfolio-no-api-key-needed-fa5086cfa56d
