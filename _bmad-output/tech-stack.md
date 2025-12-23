# SpringAIS Technical Stack Documentation

**Last Updated:** 2025-12-23  
**Status:** MVP Architecture Approved  
**Azure Student Tier:** $0/month (all services covered)

---

## Executive Summary

SpringAIS leverages Azure Student Tier services and open-source frameworks to minimize custom development while maintaining enterprise-grade capabilities. This stack saves **6-8 weeks** of development time by using managed services and pre-built solutions instead of building from scratch.

**Key Principle:** Only code what we HAVE to. Use managed services, APIs, and open-source libraries for everything else.

---

## Infrastructure Services (Azure - $0/mo Student Tier)

### Core Services

| Service                              | Purpose                                                  | Development (Dev)                | Production         | Dev Strategy                  |
| ------------------------------------ | -------------------------------------------------------- | -------------------------------- | ------------------ | ----------------------------- |
| **Azure PostgreSQL Flexible Server** | Main database + pgvector for embeddings                  | Docker: `pgvector/pgvector:pg16` | Azure PostgreSQL   | Local (identical behavior) ✅ |
| **Azure Cache for Redis**            | Session cache, skill embedding cache, LLM response cache | Docker: `redis:7-alpine`         | Azure Redis Cache  | Local (identical behavior) ✅ |
| **Azure Blob Storage**               | Resume/document uploads                                  | **Azure Blob Storage**           | Azure Blob Storage | Azure (slight differences) ⚠️ |
| **Azure AD B2C**                     | Authentication + EY SSO integration                      | **Azure AD B2C**                 | Azure AD B2C       | Azure (auth flow differs) ⚠️  |
| **Azure App Service**                | FastAPI hosting                                          | `uvicorn` locally                | Azure App Service  | Local (identical code) ✅     |
| **Azure Functions**                  | Async skill extraction jobs                              | FastAPI BackgroundTasks          | Azure Functions    | Local (simpler for MVP) ✅    |

**Dev Strategy Rationale:**

- **Local Docker (PostgreSQL, Redis):** Identical behavior, faster iteration, offline-capable
- **Azure Services (Blob Storage, AD B2C):** Connect to real Azure to catch differences early
- **Local Code (FastAPI, BackgroundTasks):** Same code runs identically, easier debugging

### Why Azure Services?

- **$0 cost** on Student Tier (covers MVP needs)
- **Enterprise-ready** - Production-grade infrastructure
- **Managed services** - No infrastructure maintenance
- **SSO integration** - Azure AD B2C handles SAML/OIDC for EY integration
- **Scalability** - Auto-scales as needed
- **pgvector extension** - Built-in vector search (no separate vector DB needed)

---

## External Free Services & APIs

| Service            | Purpose                                                   | Why Use It                           | Integration Complexity         |
| ------------------ | --------------------------------------------------------- | ------------------------------------ | ------------------------------ |
| **O\*NET API**     | Skills taxonomy (39K+ skills, occupations, relationships) | Free, comprehensive, saves 2-3 weeks | Low - REST API wrapper         |
| **LlamaIndex OSS** | RAG pipeline structure, document parsing                  | Free, well-documented, saves 1 week  | Medium - Framework integration |
| **React Flow**     | Career path visualization, skill trees                    | Free, already in PRD, saves 3-4 days | Low - React component          |
| **OpenAI API**     | Skill extraction, validation, gap analysis                | Direct API access                    | Low - SDK integration          |

---

## Additional Azure Services (Free on Student Tier)

| Service                        | Purpose                                           | Time Saved | Why Use It                                           | Integration                |
| ------------------------------ | ------------------------------------------------- | ---------- | ---------------------------------------------------- | -------------------------- |
| **Azure Application Insights** | Monitoring, logging, performance tracking         | 2-3 days   | Built-in with App Service, automatic instrumentation | Low - Auto-instrumentation |
| **Azure Key Vault**            | Secrets management (API keys, connection strings) | 1 day      | Secure secret storage, rotation support              | Low - SDK integration      |

---

## Additional Third-Party Services (Free Tiers)

| Service            | Purpose                       | Time Saved | Why Use It                                                      | Cost                       |
| ------------------ | ----------------------------- | ---------- | --------------------------------------------------------------- | -------------------------- |
| **Sentry**         | Error tracking and monitoring | 1-2 days   | Automatic error grouping, stack traces                          | Free tier: 5K events/month |
| **GitHub Actions** | CI/CD pipeline                | 2-3 days   | Free for private repos (2,000 min/month), easy Azure deployment | Free (private repos)       |

---

## Technology Stack Details

### Backend Stack

**Framework:**

- **FastAPI** (Python 3.11+) - Async REST API framework
  - Auto-generates OpenAPI 3.0 docs
  - Pydantic validation
  - WebSocket support for real-time notifications

**Database:**

- **PostgreSQL 16** with **pgvector extension**
  - Structured data (employees, roles, matches, audit logs)
  - Vector embeddings storage (3072-D vectors from text-embedding-3-large)
  - Unified database (no separate vector DB needed)
  - **Why pgvector over Chroma:**
    - Single database for all data
    - Better production performance
    - Easier to maintain
    - PRD mentions pgvector as option

**Caching:**

- **Azure Redis Cache** (via `redis-py`)
  - **LangChain Semantic Cache** - Similar prompts → cached LLM responses (68.8% API reduction)
  - **Redis Direct Cache** - Exact matches for:
    - Skill extraction results (7 days TTL)
    - Embeddings (indefinite TTL)
    - O\*NET API responses
    - Session data

**LLM Orchestration:**

- **LangChain** - LLM orchestration, prompt management, semantic caching
- **LlamaIndex** - RAG pipeline structure, document parsing, chunking
- **OpenAI SDK** - Direct API calls for GPT-5.2 Instant and text-embedding-3-large

**File Storage:**

- **Azure Blob Storage** - Resume/document uploads
- **Development:** Connect to real Azure Blob Storage (Student Tier)
  - Ensures dev/prod parity for file operations
  - Tests real SDK behavior and CORS configurations
  - Catches Azure-specific edge cases early
  - **Why not Azurite:** SDK differences, CORS edge cases, large file handling differs

**Authentication:**

- **Azure AD B2C** - Enterprise auth + SSO
  - **Development:** Connect to real Azure AD B2C (Student Tier)
  - Handles SAML/OIDC for EY integration
  - User management
  - Token validation middleware
  - **Why real Azure in dev:** Auth flow differences (redirects, tokens, OIDC) need real testing

**Background Jobs:**

- **Azure Functions** - Async skill extraction processing
- **Local Dev:** FastAPI BackgroundTasks (inline processing)

**Monitoring & Logging:**

- **Azure Application Insights** - Automatic monitoring, performance tracking (free on Student Tier)
  - Auto-instrumentation with App Service
  - Custom metrics for LLM costs, cache hit rates, response times
  - Per PRD requirement: "Cost monitoring" and "Performance benchmarks"
- **structlog** - Structured JSON logging (Azure App Insights compatible)
- **Sentry** (recommended) - Error tracking and alerting (free tier: 5K events/month)
  - Better than custom error tracking
  - Automatic error grouping, stack traces
  - Alerts for critical errors

**Secrets Management:**

- **Azure Key Vault** - Secure storage for API keys, connection strings (free on Student Tier)
  - Store OpenAI API keys, Azure connection strings, O\*NET API keys
  - Automatic rotation support
  - Better than environment variables for production

### Frontend Stack

**Framework:**

- **React 18+** with **TypeScript**
- **Vite** - Build tool and dev server

**UI Components:**

- **shadcn/ui** - Professional component library
  - Built on Radix UI primitives
  - Tailwind CSS styling
  - Accessible by default

**Visualization:**

- **React Flow** - Career path visualization, skill trees
  - Interactive node graphs
  - Custom node/edge rendering

**Charts & Analytics:**

- **Recharts** - Dashboard visualizations
  - Success pattern charts
  - Match statistics
  - Career competitiveness metrics

**HTTP Client:**

- **Axios** - API communication
- **openapi-typescript** - TypeScript types generated from FastAPI OpenAPI spec

**State Management:**

- **React Query (TanStack Query)** - Server state management, caching
- **Zustand** (optional) - Client state management

---

## Caching Strategy (Multi-Layer)

### Layer 1: LangChain Semantic Cache

**Purpose:** Cache LLM responses based on semantic similarity (not exact matches)

**Implementation:**

```python
from langchain.cache import RedisCache
from langchain.globals import set_llm_cache
import redis

redis_client = redis.Redis.from_url("redis://localhost:6379")
set_llm_cache(RedisCache(redis_client))
```

**What it caches:**

- LLM prompt → response pairs
- Uses embedding similarity (cosine similarity > 0.95)
- Handles prompt variations automatically

**Benefits:**

- 68.8% API call reduction (per PRD)
- Handles similar prompts without exact match
- Reduces LLM costs significantly

**Example:**

```
Prompt A: "Extract skills from: 'I built Python APIs'"
Prompt B: "Extract skills from: 'Developed Python REST APIs'"
→ LangChain sees these as similar
→ Returns cached response from Prompt A
```

### Layer 2: Redis Exact Match Cache

**Purpose:** Fast lookups for identical requests

**What it caches:**

1. **Skill Extraction Results** (7 days TTL)

   - Key: `skill_extraction:{resume_hash}`
   - Value: Extracted skills with confidence scores

2. **Embeddings** (Indefinite TTL)

   - Key: `embedding:{skill_name}`
   - Value: 3072-D vector from text-embedding-3-large
   - Pre-cached: ~250 common EY skills

3. **O\*NET API Responses** (24 hours TTL)

   - Key: `onet_api:{endpoint}:{params}`
   - Value: API response JSON

4. **Session Data** (15 minutes TTL)
   - Key: `session:{user_id}`
   - Value: User session data

**Benefits:**

- O(1) lookup time
- Prevents redundant API calls
- Instant responses for cached data

### Cache Flow Example

```python
def extract_skills(resume_text: str):
    # 1. Check Redis (exact match)
    resume_hash = hash(resume_text)
    cached = redis.get(f"skill_extraction:{resume_hash}")
    if cached:
        return cached  # Instant return (<3s per PRD)

    # 2. Check LangChain semantic cache (similar prompts)
    llm_response = langchain_llm.invoke(prompt, cache=True)

    # 3. If cache miss, call LLM
    if not llm_response.from_cache:
        llm_response = openai_api.call(prompt)

    # 4. Store in Redis (exact match) for future identical uploads
    redis.setex(
        f"skill_extraction:{resume_hash}",
        7 * 24 * 3600,  # 7 days TTL
        llm_response
    )

    return llm_response
```

---

## Integration Architecture

### O\*NET API Integration

**Purpose:** Skills taxonomy (39K+ skills, occupation mappings)

**Client:**

```python
# Simple REST API wrapper
class ONetClient:
    def get_skill_info(self, skill_name: str):
        # Check Redis cache first
        # Call O*NET API if cache miss
        # Cache response for 24 hours
```

**Caching Strategy:**

- Aggressive caching (24h TTL)
- Pre-load common EY skills into database
- Fallback to database if API unavailable

### LlamaIndex Integration

**Purpose:** Document parsing and RAG pipeline structure

**Use Cases:**

- Resume parsing (PDF, Word, text)
- Document chunking
- Retrieval patterns

**Integration Points:**

- Document loading (resume uploads)
- Chunking strategy (for large documents)
- Vector store integration (pgvector)

### LangChain Integration

**Purpose:** LLM orchestration and prompt management

**Use Cases:**

- Dual LLM validation pipeline
- Prompt templates
- Semantic caching
- Chain composition

**Key Components:**

- `LangChain LLM` - OpenAI wrapper with caching
- `PromptTemplate` - Reusable prompt templates
- `Chain` - Skill extraction → validation pipeline

---

## Development Environment

### Local Development Setup

**Development Strategy:**

- **Local Docker:** PostgreSQL, Redis (identical behavior, faster iteration)
- **Azure Services:** Blob Storage, AD B2C (connect to real Azure to catch differences early)
- **Local Code:** FastAPI with uvicorn (same code, easier debugging)

**Docker Compose Services:**

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: springais
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      # Local Docker services
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/springais
      - REDIS_URL=redis://redis:6379
      # Real Azure services (from environment variables or .env file)
      - AZURE_STORAGE_CONNECTION_STRING=${AZURE_STORAGE_CONNECTION_STRING}
      - AZURE_AD_B2C_TENANT_ID=${AZURE_AD_B2C_TENANT_ID}
      - AZURE_AD_B2C_CLIENT_ID=${AZURE_AD_B2C_CLIENT_ID}
      - AZURE_AD_B2C_CLIENT_SECRET=${AZURE_AD_B2C_CLIENT_SECRET}
      - AZURE_AD_B2C_POLICY_NAME=${AZURE_AD_B2C_POLICY_NAME}
      # External APIs
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ONET_API_KEY=${ONET_API_KEY}

  frontend:
    build: ./frontend
    command: npm run dev
    volumes:
      - ./frontend:/app
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000
      - VITE_AZURE_AD_B2C_TENANT_ID=${AZURE_AD_B2C_TENANT_ID}
      - VITE_AZURE_AD_B2C_CLIENT_ID=${AZURE_AD_B2C_CLIENT_ID}
      - VITE_AZURE_AD_B2C_POLICY_NAME=${AZURE_AD_B2C_POLICY_NAME}
```

**Environment Variables (.env file):**

```bash
# Azure Blob Storage (from Azure Portal)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...

# Azure AD B2C (from Azure Portal)
AZURE_AD_B2C_TENANT_ID=your-tenant-id
AZURE_AD_B2C_CLIENT_ID=your-client-id
AZURE_AD_B2C_CLIENT_SECRET=your-client-secret
AZURE_AD_B2C_POLICY_NAME=B2C_1_signupsignin

# External APIs
OPENAI_API_KEY=your-openai-key
ONET_API_KEY=your-onet-key
```

**Start Command:**

```bash
# Load environment variables and start services
docker-compose up
```

**Access Points:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432 (local Docker)
- Redis: localhost:6379 (local Docker)
- Azure Blob Storage: Connected via connection string
- Azure AD B2C: Connected via tenant/client credentials

**Why This Approach:**

1. **PostgreSQL & Redis (Local):** Identical behavior, faster, offline-capable
2. **Azure Blob Storage (Real Azure):** Catches SDK differences, CORS issues, large file handling
3. **Azure AD B2C (Real Azure):** Auth flow is different - need real OIDC/SAML testing
4. **FastAPI (Local):** Same code, easier debugging with hot reload

### Development vs Production Strategy

**Principle:** Use local alternatives for services with identical behavior. Connect to Azure/external sources for services with any differences.

| Service             | Development                             | Production                 | Rationale                                  |
| ------------------- | --------------------------------------- | -------------------------- | ------------------------------------------ |
| **PostgreSQL**      | Local Docker (`pgvector/pgvector:pg16`) | Azure PostgreSQL           | Identical PostgreSQL + pgvector behavior   |
| **Redis**           | Local Docker (`redis:7-alpine`)         | Azure Redis Cache          | Identical Redis protocol and commands      |
| **Blob Storage**    | **Azure Blob Storage**                  | Azure Blob Storage         | SDK differences, CORS, large file handling |
| **AD B2C**          | **Azure AD B2C**                        | Azure AD B2C               | Auth flow differences (OIDC/SAML, tokens)  |
| **FastAPI**         | Local `uvicorn`                         | Azure App Service          | Same code, easier debugging locally        |
| **Background Jobs** | FastAPI BackgroundTasks                 | Azure Functions (optional) | Simpler for MVP, same business logic       |

**Why Connect to Azure in Dev:**

1. **Azure Blob Storage:**

   - Azurite emulator has limitations (advanced features, CORS edge cases)
   - Real Azure SDK behavior differs slightly
   - Large file uploads behave differently
   - SAS token generation needs real Azure

2. **Azure AD B2C:**
   - Auth flow is fundamentally different (redirects, OIDC/SAML)
   - Token format and validation differs
   - SSO integration needs real Azure
   - Local bypass skips critical auth logic

**Benefits of This Approach:**

- ✅ Catch Azure-specific issues early
- ✅ Test real auth flows during development
- ✅ Validate connection strings before deployment
- ✅ Faster iteration on PostgreSQL/Redis (local Docker)
- ✅ Same code runs identically (FastAPI)
- ✅ No surprises at deployment time

**Setup Requirements:**

1. **Azure Student Tier Account** - Free credits for all services
2. **Azure Blob Storage Account** - Create storage account, get connection string
3. **Azure AD B2C Tenant** - Create tenant, register app, configure policies
4. **Azure Application Insights** - Auto-enabled with App Service (no setup needed)
5. **Azure Key Vault** - Create vault, store secrets (API keys, connection strings)
6. **Sentry Account** - Sign up for free tier (5K events/month)
7. **GitHub Actions** - Already available with GitHub repo (free for private repos: 2,000 min/month)
8. **Environment Variables** - Store credentials in `.env` file (gitignored) or Azure Key Vault

### Production Deployment

**Azure Services:**

- **Azure App Service** - FastAPI application
- **Azure PostgreSQL Flexible Server** - Database with pgvector
- **Azure Redis Cache** - Caching layer
- **Azure Blob Storage** - File storage (same as dev)
- **Azure AD B2C** - Authentication (same as dev)
- **Azure Application Insights** - Monitoring (auto-enabled with App Service)
- **Azure Key Vault** - Secrets management (same as dev)
- **Azure Functions** - Background jobs (optional)

**Deployment Pipeline:**

- **GitHub Actions** → Azure App Service
  - Automated on push to main branch
  - Runs tests, builds, deploys
  - Free for private repos: 2,000 minutes/month
- Environment variables configured in Azure Portal or Key Vault
- Database migrations via Alembic
- **Note:** Blob Storage, AD B2C, Application Insights, and Key Vault already configured from dev (no changes needed)

---

## What We DON'T Build (Use Services Instead)

| Component                   | Solution         | Time Saved | Notes                                          |
| --------------------------- | ---------------- | ---------- | ---------------------------------------------- |
| **Skills Taxonomy**         | O\*NET API       | 2-3 weeks  | 39K skills, hierarchies, occupation mappings   |
| **Vector Storage + Search** | pgvector         | 1-2 weeks  | Built into PostgreSQL, no separate vector DB   |
| **Auth + SSO**              | Azure AD B2C     | 1-2 weeks  | Handles SAML/OIDC, EY integration ready        |
| **File Storage**            | Azure Blob       | 2-3 days   | Upload/download resumes, no file handling code |
| **Caching Layer**           | Redis            | 2-3 days   | Session storage, embedding cache               |
| **RAG Pipeline Structure**  | LlamaIndex       | 1 week     | Document loading, chunking, retrieval patterns |
| **Graph Visualization**     | React Flow       | 3-4 days   | Interactive node graphs for career paths       |
| **Background Jobs**         | Azure Functions  | 2-3 days   | Async processing without job queues            |
| **Database Management**     | Azure PostgreSQL | Ongoing    | Backups, scaling, maintenance handled          |

**Total Time Saved: ~6-8 weeks**

---

## What We Code By Hand

### Backend Components

| Component                     | Description                                        | Complexity | Est. Time |
| ----------------------------- | -------------------------------------------------- | ---------- | --------- |
| **API Routes**                | REST endpoints for all features                    | Medium     | 3-4 days  |
| **Database Models**           | SQLAlchemy/SQLModel schemas                        | Low        | 1 day     |
| **Skill Extraction Pipeline** | LLM prompts + O\*NET mapping + validation          | Medium     | 3-4 days  |
| **Dual LLM Validation**       | Extract skills → validate with evidence quotes     | Medium     | 1-2 days  |
| **Matching Algorithm**        | pgvector queries + scoring logic + discovery modes | Medium     | 3-4 days  |
| **Success Pattern Analysis**  | Query historical data, calculate metrics           | Medium     | 2-3 days  |
| **Gap Analysis**              | Compare user skills vs target role requirements    | Low        | 1 day     |
| **Two-Sided Matching Logic**  | Anonymous tokens, mutual opt-in reveal             | Medium     | 2 days    |
| **Notification Service**      | WebSocket or polling for alerts                    | Low        | 1 day     |
| **Admin Audit Queries**       | Fairness metrics, bias detection SQL               | Medium     | 1-2 days  |

### Frontend Components

| Component                      | Description                                      | Complexity | Est. Time |
| ------------------------------ | ------------------------------------------------ | ---------- | --------- |
| **Auth Flow UI**               | Login/logout, SSO redirect                       | Low        | 0.5 days  |
| **Profile Upload/Display**     | Resume upload, extracted skills view             | Medium     | 1-2 days  |
| **Skill Confidence UI**        | Show skills with evidence, confidence scores     | Medium     | 1 day     |
| **Opportunity Search**         | Filters, discovery modes (Best Fit/Stretch/etc)  | Medium     | 2 days    |
| **Match Results Display**      | Cards with match scores, skill gaps              | Medium     | 1-2 days  |
| **Career Journey Map**         | React Flow integration, skill tree visualization | Medium     | 3-4 days  |
| **Success Patterns Overlay**   | Charts showing what drives advancement           | Medium     | 1-2 days  |
| **Hiring Manager Dashboard**   | Candidate pool, anonymous tokens, reveal flow    | Medium     | 2 days    |
| **Admin Dashboard**            | Fairness metrics, audit logs, system health      | Medium     | 2 days    |
| **Upskilling Recommendations** | Gap display, resource suggestions                | Low        | 1 day     |

### Integration Code

| Component             | Description                               | Complexity | Est. Time |
| --------------------- | ----------------------------------------- | ---------- | --------- |
| **O\*NET Client**     | API wrapper for skills/occupations        | Low        | 0.5 days  |
| **LLM Service**       | Abstraction for skill extraction calls    | Low        | 0.5 days  |
| **Embedding Service** | Generate + cache embeddings               | Low        | 0.5 days  |
| **Azure Blob Client** | Upload/download resume files              | Low        | 0.5 days  |
| **Auth Middleware**   | Azure AD B2C token validation             | Low        | 0.5 days  |
| **Monitoring Setup**  | Application Insights + Sentry integration | Low        | 0.5 days  |
| **Key Vault Client**  | Secrets management integration            | Low        | 0.5 days  |
| **CI/CD Pipeline**    | GitHub Actions deployment setup           | Low        | 0.5 days  |

---

## Performance Targets

### Response Times (Per PRD)

| Operation                 | Target | Notes                      |
| ------------------------- | ------ | -------------------------- |
| Uncached skill inference  | <15s   | Full dual LLM pipeline     |
| Cached skill inference    | <3s    | Semantic cache hit         |
| Role matching queries     | <2s    | pgvector similarity search |
| Career Journey Map render | <3s    | React Flow visualization   |
| Real-time notifications   | <1s    | WebSocket delivery         |

### Caching Targets

| Metric                    | Target | Notes                      |
| ------------------------- | ------ | -------------------------- |
| Semantic cache hit rate   | >60%   | LangChain semantic caching |
| Embedding cache hit rate  | >80%   | Pre-cached common skills   |
| O\*NET API cache hit rate | >90%   | Aggressive caching         |

---

## Cost Breakdown

### Monthly Costs (Student Tier)

| Service                    | Cost     | Notes                         |
| -------------------------- | -------- | ----------------------------- |
| Azure PostgreSQL           | $0       | Student Tier covers           |
| Azure Redis Cache          | $0       | Student Tier covers           |
| Azure Blob Storage         | $0       | Student Tier covers           |
| Azure AD B2C               | $0       | Student Tier covers           |
| Azure App Service          | $0       | Student Tier covers           |
| Azure Functions            | $0       | Student Tier covers           |
| Azure Application Insights | $0       | Student Tier covers           |
| Azure Key Vault            | $0       | Student Tier covers           |
| O\*NET API                 | $0       | Free public API               |
| LlamaIndex OSS             | $0       | Open source                   |
| React Flow                 | $0       | Open source                   |
| Sentry                     | $0       | Free tier: 5K events/month    |
| GitHub Actions             | $0       | Free for private repos        |
| OpenAI API                 | Variable | Pay-per-use (you have access) |

**Total Infrastructure Cost: $0/month**

**Variable Costs:**

- OpenAI API calls (GPT-5.2 Instant, text-embedding-3-large)
- Estimated: $50-200/month for MVP demo scale

---

## Development Timeline

### Phase 1: Foundation (Week 1)

- Docker Compose setup
- FastAPI skeleton + PostgreSQL schema
- React app + shadcn/ui
- Azure AD B2C integration (or local bypass)
- **Deliverable:** `docker-compose up` works

### Phase 2: Core AI Pipeline (Weeks 2-3)

- OpenAI API integration + LangChain
- Dual LLM skill inference
- O\*NET API client + caching
- Confidence scoring
- Vector embeddings generation (pgvector)
- **Deliverable:** Upload resume → extracted skills

### Phase 3: Matching Engine (Week 4)

- pgvector similarity queries
- Semantic matching algorithm
- Match scoring with confidence intervals
- Discovery modes (Best Fit, Stretch, Exploratory, Trending)
- **Deliverable:** Top 10 role matches

### Phase 4: Career Visualization (Week 5)

- React Flow skill tree
- Success Pattern overlay (6 metric categories)
- Career Competitiveness Dashboard
- Progress path visualization
- **Deliverable:** Visual career journey map

### Phase 5: User Flows (Weeks 6-7)

- Employee workflow (upload, explore, opt-in)
- Hiring manager workflow (post role, see matches, invite)
- Admin workflow (audit logs, fairness dashboard)
- Anonymous matching with mutual opt-in
- **Deliverable:** Complete user journeys functional

### Phase 6: Polish & Testing (Week 8)

- UI polish, animations
- Edge case handling
- Integration testing
- Demo data generation
- **Deliverable:** Competition-ready demo

**Total: 8 weeks**

---

## Key Architectural Decisions

### 1. pgvector over Chroma

**Decision:** Use pgvector (PostgreSQL extension) instead of separate Chroma vector database

**Rationale:**

- Unified database for all data (structured + vectors)
- Better production performance
- Easier to maintain (one database)
- PRD mentions pgvector as option
- Azure PostgreSQL supports pgvector extension

**Trade-offs:**

- May need performance tuning at scale
- Monitor query times (target: <50ms p95 for production)

### 2. LangChain + LlamaIndex Together

**Decision:** Use both frameworks (not just one)

**Rationale:**

- **LangChain:** LLM orchestration, semantic caching, prompt management
- **LlamaIndex:** Document parsing, RAG pipeline structure
- Complementary, not redundant

**Boundaries:**

- LlamaIndex: Document loading, chunking, retrieval patterns
- LangChain: LLM calls, caching, prompt chains

### 3. Azure AD B2C for Auth

**Decision:** Use Azure AD B2C instead of building custom auth, connect to real Azure in dev

**Rationale:**

- Handles SAML/OIDC for EY SSO integration
- Enterprise-ready security
- Free on Student Tier
- Saves 1-2 weeks of development

**Development Strategy:**

- **Connect to real Azure AD B2C** (not local bypass)
- Auth flow differences (redirects, OIDC/SAML, tokens) need real testing
- Catch SSO integration issues early
- Validate token format and validation logic
- **Why not local bypass:** Auth is fundamentally different - need real Azure to test properly

### 4. Dual Caching Strategy

**Decision:** Use both LangChain semantic cache AND Redis exact cache

**Rationale:**

- **LangChain:** Handles similar prompts (semantic similarity)
- **Redis:** Fast exact matches
- Maximum cost savings (68.8% API reduction)
- Matches PRD requirements

### 5. O\*NET API Integration

**Decision:** Use O\*NET API instead of building skills taxonomy

**Rationale:**

- 39K+ skills, hierarchies, occupation mappings
- Free public API
- Saves 2-3 weeks of development
- Aggressive caching strategy (24h TTL)

---

## Security Considerations

### Authentication & Authorization

- Azure AD B2C handles user authentication
- JWT tokens for API authorization
- RBAC middleware for role-based access
- Token refresh mechanism

### Data Privacy

- PII tokenization (EMP-XXXXXX format)
- Anonymous matching until mutual opt-in
- Audit logging for all sensitive operations
- GDPR/CCPA compliance considerations

### API Security

- HTTPS/TLS for all communications
- API rate limiting
- Input validation (Pydantic)
- SQL injection prevention (SQLAlchemy ORM)

---

## Monitoring & Observability

### Logging

- **structlog** - Structured JSON logging
- Azure App Insights compatible format
- Log levels: DEBUG, INFO, WARNING, ERROR
- Request/response logging

### Error Tracking

- **Sentry** (recommended) - Error tracking and alerting
- Free tier: 5K events/month (covers MVP needs)
- Automatic error grouping
- Stack trace capture
- Real-time alerts for critical errors
- **Why use it:** Better than building custom error tracking (saves 1-2 days)

### Performance Monitoring

- **Azure Application Insights** (built-in with App Service)
- Automatic instrumentation (no code changes needed)
- Custom metrics for:
  - LLM API call counts (per PRD: cost monitoring)
  - Cache hit rates (per PRD: >60% semantic cache target)
  - Response times (per PRD: <15s uncached, <3s cached)
  - Error rates
- **Why use it:** Free on Student Tier, automatic setup (saves 2-3 days)

### Secrets Management

- **Azure Key Vault** (recommended)
- Secure storage for:
  - OpenAI API keys
  - Azure connection strings
  - O\*NET API keys
  - Database credentials
- Automatic rotation support
- **Why use it:** Better than environment variables, free on Student Tier (saves 1 day)

### CI/CD Pipeline

- **GitHub Actions** (recommended)
- Free for private repos: 2,000 minutes/month (covers MVP needs)
- Automated deployment to Azure App Service
- Run tests, build, deploy on push
- **Why use it:** Saves 2-3 days of manual deployment setup

---

## Future Considerations (Post-MVP)

### Scalability

- **Qdrant** - Consider migrating from pgvector if performance degrades
- **Azure Kubernetes Service** - If App Service limits reached
- **CDN** - For static assets

### Additional Integrations

- **SuccessFactors API** - Real EY data integration
- **Credly API** - Real badge data
- **Qualtrics API** - Employee experience data (X-data)

### Advanced Features

- **LangSmith** - LLM observability and monitoring
- **Multi-region deployment** - For global scale
- **Mobile apps** - iOS/Android native apps

---

## References

- [PRD](./prd.md) - Product Requirements Document
- [Azure Student Tier](https://azure.microsoft.com/en-us/free/students/) - Free Azure credits
- [pgvector Documentation](https://github.com/pgvector/pgvector) - PostgreSQL vector extension
- [LangChain Documentation](https://python.langchain.com/) - LLM orchestration framework
- [LlamaIndex Documentation](https://docs.llamaindex.ai/) - RAG framework
- [O\*NET API](https://www.onetcenter.org/web-services.html) - Skills taxonomy API
- [React Flow](https://reactflow.dev/) - Node graph visualization
- [shadcn/ui](https://ui.shadcn.com/) - React component library

---

## Document History

| Date       | Version | Changes                          | Author |
| ---------- | ------- | -------------------------------- | ------ |
| 2025-12-23 | 1.0     | Initial tech stack documentation | Clays  |
