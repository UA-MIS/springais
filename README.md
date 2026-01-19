# SpringAIS - AI-Powered Talent Mobility Platform

SpringAIS is an AI-powered talent mobility platform designed for EY to help employees discover career opportunities, identify skill gaps, and navigate internal mobility options.

## Tech Stack

### Backend
- **Python 3.11+** with FastAPI
- **PostgreSQL 16** with pgvector extension
- **Redis 7** for caching
- **SQLAlchemy 2.0** ORM
- **OpenAI API** for AI-powered features

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router v6** for navigation
- **React Query** for API state management
- **Recharts** for data visualization
- **React Flow** for graph visualizations

### Infrastructure
- **Docker Compose** for local development
- **pgvector** for similarity search

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SpringAIS
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys:
   # - OPENAI_API_KEY
   # - ONET_API_KEY
   ```

3. **Start all services**
   ```bash
   docker compose up -d --build
   ```

4. **Verify services are running**
   ```bash
   docker compose ps
   ```

   All services should show as "Up" and healthy:
   - `springais-backend` on http://localhost:8000
   - `springais-frontend` on http://localhost:3000
   - `springais-postgres` on localhost:5432
   - `springais-redis` on localhost:6380

5. **Access the application**
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:8000
   - **API Documentation:** http://localhost:8000/docs

## Development

### Backend Development

The backend is automatically reloaded when you make changes to files in the `backend/` directory.

**Run backend locally (without Docker):**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development

The frontend is automatically reloaded when you make changes to files in the `frontend/src/` directory.

**Run frontend locally (without Docker):**
```bash
cd frontend
npm install
npm run dev
```

### Database Management

**Access PostgreSQL:**
```bash
docker exec -it springais-postgres psql -U postgres springais
```

**View tables:**
```sql
\dt
```

**Run SQL scripts:**
```bash
docker exec -i springais-postgres psql -U postgres springais < scripts/your_script.sql
```

### Redis Management

**Access Redis CLI:**
```bash
docker exec -it springais-redis redis-cli
```

## Project Structure

```
SpringAIS/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── main.py         # FastAPI entry point
│   │   ├── database.py     # Database configuration
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile
├── frontend/               # React application
│   ├── src/
│   │   ├── App.tsx        # Main component
│   │   ├── main.tsx       # Entry point
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   └── lib/           # Utilities
│   ├── package.json
│   └── Dockerfile
├── data/                   # SQL dumps and data files
├── scripts/                # Database initialization scripts
├── docker-compose.yml      # Local development stack
├── .env                    # Environment variables (gitignored)
└── .env.example            # Environment template
```

## Database Schema

The application uses 6 main tables:

1. **employees** - Synthetic employee data
2. **roles** - Role definitions and requirements
3. **job_postings** - Scraped job postings from EY careers
4. **skill_embeddings** - Cached vector embeddings for skills
5. **users** - Demo user profiles
6. **matches** - User-to-role matching results

## API Endpoints

### Health Check
- `GET /` - API information
- `GET /health` - Health status

Additional endpoints will be added by implementation blocks.

## Troubleshooting

### Services won't start
```bash
# Stop all services
docker compose down

# Remove volumes and restart
docker compose down -v
docker compose up -d --build
```

### Port conflicts
If you see "port already allocated" errors, edit `docker-compose.yml` to use different ports:
- PostgreSQL: Change `5432:5432` to `5433:5432`
- Redis: Change `6380:6379` to `6381:6379`
- Backend: Change `8000:8000` to `8001:8000`
- Frontend: Change `3000:3000` to `3001:3000`

### Database connection errors
```bash
# Check if postgres is healthy
docker compose ps

# View logs
docker compose logs postgres
```

### Missing Postgres extensions (pgvector / pgcrypto)
If you upgraded an existing Postgres volume (so init scripts didn’t run), ensure required extensions exist:

```bash
docker exec springais-postgres psql -U postgres -d springais -c "CREATE EXTENSION IF NOT EXISTS vector;"
docker exec springais-postgres psql -U postgres -d springais -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

### Frontend build errors
```bash
# Rebuild frontend container
docker-compose build frontend
docker-compose up -d frontend
```

## Data Sharing

Large data files (SQL dumps, synthetic data) are stored in the `data-dumps` branch:

```bash
# Access data dumps
git checkout data-dumps
git pull origin data-dumps

# Return to main
git checkout main
```

**Important:** Never merge `data-dumps` to `main`.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test locally with `docker-compose up`
4. Commit and push your changes
5. Create a pull request

## Team Workflow

This project is designed for parallel development:
- **Backend developers:** Work in `backend/app/routes/` and `backend/app/services/`
- **Frontend developers:** Work in `frontend/src/pages/` and `frontend/src/components/`
- **Data engineers:** Work on SQL scripts and use the `data-dumps` branch

## License

Internal EY project - All rights reserved

## Support

For issues or questions, contact the SpringAIS development team.