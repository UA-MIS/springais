# Backend Developer Notes

## Docker-Only Commands

Run everything from the repo root using Docker Compose:

```bash
docker compose up -d
docker compose exec backend alembic history
docker compose exec backend alembic current
docker compose exec backend alembic upgrade head
docker compose exec backend alembic downgrade -1
docker compose exec backend alembic downgrade base
docker compose exec backend pytest tests/models/ -v
```

### Notes

- The backend container uses `DATABASE_URL` from `docker-compose.yml`.
- If you need a separate test DB, set `TEST_DATABASE_URL` in the container env.
