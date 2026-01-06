# SpringAIS Testing Strategy

**Last Updated:** 2026-01-06
**Purpose:** Integration testing approach for Step 3 (Blocks M, N, O, P, Q)

---

## Testing Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │  10% (Playwright)
                    │   (Block Q)     │
                    ├─────────────────┤
                    │  Integration    │  30% (FastAPI TestClient, React Testing Library)
                    │  Tests          │
                    │ (Blocks M-P)    │
                    ├─────────────────┤
                    │   Unit Tests    │  60% (pytest, Vitest)
                    │ (Blocks A-L)    │
                    └─────────────────┘
```

---

## Unit Tests (Blocks A-L)

**Purpose:** Test individual functions and components in isolation

### Backend Unit Tests (pytest)

```python
# backend/tests/test_matching_service.py
import pytest
from app.services.matching_service import MatchingService

@pytest.fixture
def mock_db(mocker):
    return mocker.Mock()

def test_calculate_composite_score():
    service = MatchingService()
    score = service._calculate_composite_score(
        similarity=0.8,
        experience_match=0.9,
        success_pattern=0.7
    )

    expected = 0.50 * 0.8 + 0.25 * 0.9 + 0.25 * 0.7
    assert score == pytest.approx(expected, rel=0.01)
```

### Frontend Unit Tests (Vitest)

```typescript
// frontend/tests/components/SkillCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkillCard from '@/components/skills/SkillCard';

describe('SkillCard', () => {
  it('renders skill name and proficiency', () => {
    render(<SkillCard name="Python" proficiency="Expert" />);

    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
  });
});
```

---

## Integration Tests (Blocks M-P)

**Purpose:** Test frontend-backend integration without full E2E

### Backend Integration Tests

```python
# backend/tests/integration/test_matches_integration.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_matches_authenticated():
    # Login
    login_response = client.post('/api/auth/login', json={
        'email': 'test@ey.com',
        'password': 'password'
    })
    token = login_response.json()['token']

    # Get matches
    response = client.get(
        '/api/matches/employee/1',
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    assert 'matches' in response.json()
    assert len(response.json()['matches']) > 0

def test_get_matches_unauthorized():
    # Try without token
    response = client.get('/api/matches/employee/1')
    assert response.status_code == 401

def test_get_matches_forbidden():
    # Login as employee 1
    token = login_as_employee(1)

    # Try to access employee 2's matches
    response = client.get(
        '/api/matches/employee/2',
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 403
```

### Frontend Integration Tests (React Testing Library)

```typescript
// frontend/tests/integration/MatchResults.integration.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MatchResults from '@/pages/MatchResults';
import * as api from '@/services/api';

describe('MatchResults Integration', () => {
  it('fetches and displays matches', async () => {
    // Mock API
    vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        matches: [
          {
            job_id: 42,
            title: 'Senior AI Engineer',
            composite_score: 0.82,
            overlapping_skills: ['Python', 'ML'],
            missing_skills: ['Kubernetes']
          }
        ]
      }
    });

    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MatchResults />
      </QueryClientProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Senior AI Engineer')).toBeInTheDocument();
      expect(screen.getByText('82%')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new Error('Network error'));

    render(<MatchResults />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load matches/i)).toBeInTheDocument();
    });
  });
});
```

---

## E2E Tests (Block Q)

**Purpose:** Test complete user journeys across frontend + backend

### Playwright E2E Tests

```typescript
// frontend/tests/e2e/matching-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Full Matching Flow', () => {
  test('user can login, view matches, and apply', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'test@ey.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Redirects to dashboard
    await expect(page).toHaveURL(/dashboard/);

    // Navigate to matches
    await page.click('text=Match Results');
    await expect(page).toHaveURL(/matches/);

    // Wait for matches to load
    await page.waitForSelector('.match-card');

    // Click first match
    const firstMatch = page.locator('.match-card').first();
    await expect(firstMatch).toContainText('%'); // Has match score

    // Apply to job
    await firstMatch.locator('button:has-text("Apply")').click();

    // Verify application tracked
    await expect(page.locator('text=Application submitted')).toBeVisible();
  });

  test('handles missing skills gracefully', async ({ page }) => {
    // Login as employee with no skills
    await page.goto('http://localhost:5173/login');
    await login(page, 'noskills@ey.com', 'password');

    // Navigate to matches
    await page.click('text=Match Results');

    // Should show "complete your profile" message
    await expect(page.locator('text=Complete your profile')).toBeVisible();
  });
});
```

**Run E2E Tests:**
```bash
cd frontend
npx playwright test
```

---

## Performance Testing

### Backend Load Testing (Locust)

```python
# backend/tests/load/locustfile.py
from locust import HttpUser, task, between

class SpringAISUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        # Login
        response = self.client.post('/api/auth/login', json={
            'email': 'test@ey.com',
            'password': 'password'
        })
        self.token = response.json()['token']

    @task
    def get_matches(self):
        self.client.get(
            '/api/matches/employee/1',
            headers={'Authorization': f'Bearer {self.token}'}
        )

    @task
    def get_career_path(self):
        self.client.get(
            '/api/career-paths/employee/1',
            headers={'Authorization': f'Bearer {self.token}'}
        )
```

**Run Load Test:**
```bash
locust -f backend/tests/load/locustfile.py --host=http://localhost:8000
```

**Targets:**
- 100 concurrent users
- Match query: <1 second (p95)
- API errors: <1%

---

## Security Testing (Block Q)

### OWASP ZAP Scan

```bash
# Run OWASP ZAP automated scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:8000/api \
  -r zap_report.html
```

**Check For:**
- SQL injection vulnerabilities
- XSS vulnerabilities
- Missing security headers
- JWT token validation

---

## Frontend Lighthouse Audit (Block Q)

```bash
# Run Lighthouse performance audit
npx lighthouse http://localhost:5173/dashboard \
  --output=html \
  --output-path=./lighthouse-report.html \
  --only-categories=performance,accessibility,best-practices
```

**Targets:**
- Performance: >85
- Accessibility: >90
- Best Practices: >90

---

## CI/CD Pipeline (Future)

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run backend unit tests
        run: |
          cd backend
          pytest tests/

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run frontend unit tests
        run: |
          cd frontend
          npm run test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Start services
        run: docker-compose up -d
      - name: Run E2E tests
        run: |
          cd frontend
          npx playwright test
```

---

## Test Coverage Targets

| Layer | Target Coverage |
|-------|----------------|
| Backend services | >80% |
| Frontend components | >70% |
| Integration tests | All critical paths |
| E2E tests | All user journeys |

**Check Coverage:**
```bash
# Backend
pytest --cov=app --cov-report=html

# Frontend
npm run test:coverage
```

---

## Related Documentation

- `reference-docs/integration/api-contracts.md` - API contracts to test
- `implementation-tracking/STEP-3-INTEGRATION/BLOCK-Q-E2E-TESTING/` - E2E test implementation

**Implemented In:** Block Q (E2E Testing & Polish)
