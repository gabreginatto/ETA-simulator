# SludgeSim - Sludge Dewatering Simulation Platform

A full-stack simulation platform for modeling and optimizing sludge dewatering processes in wastewater treatment plants.

## Features

- **Process Flow Visualization**: Interactive React Flow canvas with equipment nodes
- **Simulation Engine**: Mass balance calculations for dewatering operations
- **Polymer Optimization**: Jar test integration for optimal polymer dosing
- **KPI Dashboard**: Real-time metrics for cake production, costs, and efficiency
- **Project Management**: Save and load plant configurations

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- Pydantic v2
- SQLAlchemy (SQLite)

### Frontend
- React 18
- TypeScript
- Vite
- React Flow v12
- Zustand
- TanStack Query
- Tailwind CSS
- shadcn/ui

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API documentation available at: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Application available at: http://localhost:5173

### Using Docker

```bash
docker-compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── models/       # Data models (Stream, JarTest, Project)
│   │   ├── engine/       # Simulation logic
│   │   ├── api/          # FastAPI routes
│   │   └── db/           # Database configuration
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── canvas/   # React Flow nodes/edges
│   │   │   ├── panels/   # UI panels
│   │   │   └── forms/    # Equipment forms
│   │   ├── hooks/        # Custom React hooks
│   │   ├── stores/       # Zustand state
│   │   ├── api/          # API client
│   │   └── types/        # TypeScript types
│   └── ...
└── docker-compose.yml
```

## License

MIT
