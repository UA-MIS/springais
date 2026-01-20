# Integration Patterns

This document defines shared integration patterns for Step 3 blocks (N/O/P).

## Authenticated API Calls

Frontend should use the shared API client that injects the JWT token into every request.

```ts
import api from '../services/api';

const response = await api.get('/skills/recommendations');
```

## Auth Lifecycle

- Login or register returns `{ token, user }`
- Store token in `localStorage`
- API client injects `Authorization: Bearer <token>`
- 401 responses clear token and redirect to `/login`

## Skill Recommendations (Hybrid)

For the Profile "My Skills" view:
- call `GET /api/skills/recommendations`
- update status with `PATCH /api/skills/recommendations/{skill}/status`

## Example: Save Match Trigger

```ts
await api.post('/matches/save', payload);
// Backend refreshes recommendations automatically
```

## Troubleshooting

- **401 on every request**: verify `Authorization: Bearer <token>` is set and `JWT_SECRET_KEY` matches backend config.
- **CORS errors**: ensure backend allows the frontend origin and `Authorization` header.
- **User logged out unexpectedly**: check token expiration and system clock skew.
