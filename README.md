# ETA-Simulator

A full-stack simulation platform for modeling and optimizing water treatment processes. Built for engineers to design, analyze, and compare treatment plant configurations with real-time simulation and cost analysis.

## Live Application

| Environment | URL |
|-------------|-----|
| **Production** | https://eta-simulator-2026.web.app |
| **API** | https://eta-simulator-api-194990387864.us-central1.run.app |
| **API Docs** | https://eta-simulator-api-194990387864.us-central1.run.app/docs |

## Features

### Process Simulation
- **Interactive Flow Diagram**: Drag-and-drop equipment nodes with React Flow
- **Mass Balance Engine**: Real-time simulation of treatment processes
- **Multi-Stage Support**: Model clarifiers, thickeners, dewatering units, and more

### Analysis Tools
- **Jar Test Integration**: Optimize polymer dosing with lab data
- **TCO Calculator**: Total Cost of Ownership analysis including chemicals, energy, and disposal
- **A/B Comparison**: Side-by-side scenario comparison with visual diff

### Plant Profiles
- **Drinking Water Treatment**: Filtration-focused analysis with colmation modeling
- **Wastewater Sludge**: Traditional dewatering optimization
- **Configurable Parameters**: Adapt to any plant configuration

### Mobile Support
- **Responsive Design**: Full mobile layout for field use
- **Touch-Optimized**: Bottom navigation, swipe gestures, bottom sheets
- **Process Journey View**: Vertical card-based equipment flow

### Project Management
- **Save/Load Projects**: Persist configurations to cloud database
- **Export Results**: Download simulation data
- **Version History**: Track changes over time

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| React Flow v12 | Flow diagram |
| Zustand | State management |
| TanStack Query | API caching |
| Tailwind CSS | Styling |
| Lucide Icons | Iconography |

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.11 | Runtime |
| FastAPI | API framework |
| Pydantic v2 | Validation |
| SQLAlchemy | ORM |
| Alembic | Migrations |
| PostgreSQL | Database (prod) |
| SQLite | Database (dev) |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Firebase Hosting | Frontend CDN |
| Cloud Run | Backend containers |
| Cloud SQL | PostgreSQL database |
| Artifact Registry | Docker images |
| Secret Manager | Credentials |

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (optional)

### Local Development

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

### Docker Compose

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

## Deployment

### Quick Deploy

```bash
./deploy.sh
```

This script:
1. Builds Docker image for Cloud Run (AMD64)
2. Pushes to Artifact Registry
3. Deploys backend to Cloud Run
4. Builds frontend with production API URL
5. Deploys frontend to Firebase Hosting

### Manual Deploy

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

### Verify Deployment

```bash
# Test infrastructure setup
./scripts/test-infrastructure.sh

# Test live deployment
./scripts/test-deployment.sh
```

## Project Structure

```
ETA-simulator/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI routes
│   │   ├── auth/           # Authentication (IAP)
│   │   ├── db/             # Database config
│   │   ├── engine/         # Simulation logic
│   │   ├── models/         # SQLAlchemy models
│   │   ├── config.py       # Settings
│   │   └── main.py         # Entry point
│   ├── alembic/            # DB migrations
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/
│   │   │   ├── canvas/     # Flow diagram
│   │   │   ├── mobile/     # Mobile components
│   │   │   ├── panels/     # UI panels
│   │   │   └── ui/         # Base components
│   │   ├── hooks/          # Custom hooks
│   │   ├── stores/         # Zustand stores
│   │   └── types/          # TypeScript types
│   ├── .env.production     # Production config
│   └── package.json
│
├── scripts/
│   ├── test-infrastructure.sh
│   └── test-deployment.sh
│
├── docs/
│   └── DEPLOYMENT.md       # Deployment guide
│
├── Dockerfile.backend      # Cloud Run container
├── firebase.json           # Firebase config
├── deploy.sh              # Deployment script
└── docker-compose.yml     # Local development
```

## Configuration

### Environment Variables

#### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | SQLite (dev) |
| `AUTH_ENABLED` | Enable IAP authentication | `false` |
| `CORS_ORIGINS` | Allowed origins | localhost |
| `LOG_LEVEL` | Logging verbosity | `INFO` |

#### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_GCP_PROJECT_ID` | GCP project ID |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/simulate` | POST | Run simulation |
| `/api/simulate/validate` | POST | Validate config |
| `/api/projects` | GET/POST | List/create projects |
| `/api/projects/{id}` | GET/PUT/DELETE | Project CRUD |
| `/api/jar-tests` | GET/POST | Jar test data |
| `/api/default-config` | GET | Default plant config |

## Testing

### Backend Tests
```bash
cd backend
pytest -v
```

### Frontend Tests
```bash
cd frontend
npm run test
```

### E2E Tests
```bash
./scripts/test-deployment.sh
```

## Cost Estimates

| Service | Monthly Cost |
|---------|--------------|
| Firebase Hosting | Free tier |
| Cloud Run | $5-15 |
| Cloud SQL (micro) | ~$10 |
| **Total** | **~$15-25** |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Acknowledgments

- Built with [Claude Code](https://claude.ai/claude-code)
- Flow diagrams powered by [React Flow](https://reactflow.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
