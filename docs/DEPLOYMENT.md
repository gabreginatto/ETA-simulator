# ETA-Simulator Deployment Documentation

This document describes the complete GCP + Firebase deployment architecture for ETA-Simulator.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Live URLs](#live-urls)
- [GCP Resources](#gcp-resources)
- [Local Configuration Files](#local-configuration-files)
- [Deployment Process](#deployment-process)
- [Testing & Verification](#testing--verification)
- [Cost Estimates](#cost-estimates)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

---

## Architecture Overview

```
                                    ┌─────────────────────────────────────────┐
                                    │              Google Cloud               │
                                    │                                         │
┌──────────┐     HTTPS              │  ┌─────────────────────────────────┐   │
│          │ ◄──────────────────────┼──┤       Firebase Hosting          │   │
│  Users   │                        │  │   (CDN - Static Frontend)       │   │
│          │                        │  │   eta-simulator-2026.web.app    │   │
└──────────┘                        │  └─────────────────────────────────┘   │
     │                              │                  │                      │
     │                              │                  │ API Calls            │
     │                              │                  ▼                      │
     │         HTTPS                │  ┌─────────────────────────────────┐   │
     └──────────────────────────────┼─►│         Cloud Run               │   │
                                    │  │   (Containerized Backend)       │   │
                                    │  │   eta-simulator-api-*.run.app   │   │
                                    │  └─────────────────────────────────┘   │
                                    │                  │                      │
                                    │                  │ SQL Connection       │
                                    │                  ▼                      │
                                    │  ┌─────────────────────────────────┐   │
                                    │  │       Cloud SQL                 │   │
                                    │  │   (PostgreSQL 15)               │   │
                                    │  │   eta-sim-pg                    │   │
                                    │  └─────────────────────────────────┘   │
                                    │                                         │
                                    └─────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Technology | Responsibility |
|-----------|------------|----------------|
| **Frontend** | React + Vite | User interface, flow diagram editor, results visualization |
| **Firebase Hosting** | CDN | Serves static frontend assets globally with low latency |
| **Backend** | FastAPI + Python | Simulation engine, API endpoints, business logic |
| **Cloud Run** | Serverless container | Hosts backend, auto-scales 0-10 instances |
| **Cloud SQL** | PostgreSQL 15 | Persistent storage for projects, jar tests, user data |
| **Secret Manager** | GCP Secrets | Stores database credentials securely |

---

## Live URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | https://eta-simulator-2026.web.app | Main application UI |
| **Backend API** | https://eta-simulator-api-194990387864.us-central1.run.app | REST API |
| **Health Check** | https://eta-simulator-api-194990387864.us-central1.run.app/health | Service health |
| **API Docs** | https://eta-simulator-api-194990387864.us-central1.run.app/docs | Swagger UI |

---

## GCP Resources

### Project Configuration

| Property | Value |
|----------|-------|
| **Project ID** | `eta-simulator-2026` |
| **Project Number** | `194990387864` |
| **Region** | `us-central1` |
| **Billing Account** | `012580-D981C5-DB34E3` |

### Enabled APIs

| API | Purpose |
|-----|---------|
| `artifactregistry.googleapis.com` | Docker image storage |
| `run.googleapis.com` | Cloud Run deployment |
| `sqladmin.googleapis.com` | Cloud SQL management |
| `secretmanager.googleapis.com` | Secrets storage |
| `cloudbuild.googleapis.com` | CI/CD builds |
| `firebase.googleapis.com` | Firebase services |
| `firebasehosting.googleapis.com` | Static hosting |

### Cloud SQL Instance

| Property | Value |
|----------|-------|
| **Instance Name** | `eta-sim-pg` |
| **Database Version** | PostgreSQL 15 |
| **Tier** | `db-f1-micro` (1 vCPU, 614MB RAM) |
| **Location** | `us-central1-c` |
| **Database Name** | `sludgesim` |
| **User** | `appuser` |
| **Connection Name** | `eta-simulator-2026:us-central1:eta-sim-pg` |

### Cloud Run Service

| Property | Value |
|----------|-------|
| **Service Name** | `eta-simulator-api` |
| **Image** | `us-central1-docker.pkg.dev/eta-simulator-2026/eta-simulator/api:latest` |
| **Min Instances** | 0 (scales to zero) |
| **Max Instances** | 10 |
| **Memory** | 512Mi |
| **CPU** | 1 |
| **Timeout** | 300s |
| **Concurrency** | 80 requests/instance |
| **Service Account** | `eta-sim-runner@eta-simulator-2026.iam.gserviceaccount.com` |

### Artifact Registry

| Property | Value |
|----------|-------|
| **Repository Name** | `eta-simulator` |
| **Location** | `us-central1` |
| **Format** | Docker |
| **Image Path** | `us-central1-docker.pkg.dev/eta-simulator-2026/eta-simulator/api` |

### Service Account & IAM

**Service Account:** `eta-sim-runner@eta-simulator-2026.iam.gserviceaccount.com`

| Role | Purpose |
|------|---------|
| `roles/cloudsql.client` | Connect to Cloud SQL |
| `roles/secretmanager.secretAccessor` | Access database credentials |

### Secrets

| Secret Name | Purpose |
|-------------|---------|
| `database-url` | PostgreSQL connection string with Cloud SQL socket path |

---

## Local Configuration Files

### firebase.json

Firebase Hosting configuration for SPA routing and caching:

```json
{
  "hosting": {
    "public": "frontend/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/assets/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

### .firebaserc

Firebase project linking:

```json
{
  "projects": {
    "default": "eta-simulator-2026"
  }
}
```

### Dockerfile.backend

Backend-only container for Cloud Run:

```dockerfile
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

RUN useradd --create-home appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
```

### frontend/.env.production

Production environment variables (auto-generated by deploy.sh):

```
VITE_API_URL=https://eta-simulator-api-194990387864.us-central1.run.app/api
VITE_GCP_PROJECT_ID=eta-simulator-2026
```

### backend/app/config.py (CORS)

CORS configuration includes Firebase Hosting domains:

```python
cors_origins: List[str] = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
    # Firebase Hosting domains
    "https://eta-simulator-2026.web.app",
    "https://eta-simulator-2026.firebaseapp.com",
]
```

---

## Deployment Process

### Automated Deployment

Run the deployment script from the project root:

```bash
./deploy.sh
```

This script performs:
1. Sets GCP project context
2. Builds Docker image for AMD64 architecture
3. Pushes image to Artifact Registry
4. Deploys to Cloud Run
5. Retrieves Cloud Run URL
6. Updates frontend environment with API URL
7. Builds frontend production bundle
8. Deploys to Firebase Hosting

### Manual Deployment Steps

#### 1. Build and Push Backend

```bash
# Build for AMD64 (required for Cloud Run)
docker build --platform linux/amd64 -f Dockerfile.backend \
  -t us-central1-docker.pkg.dev/eta-simulator-2026/eta-simulator/api:latest .

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/eta-simulator-2026/eta-simulator/api:latest
```

#### 2. Deploy to Cloud Run

```bash
gcloud run deploy eta-simulator-api \
  --image=us-central1-docker.pkg.dev/eta-simulator-2026/eta-simulator/api:latest \
  --region=us-central1 \
  --service-account=eta-sim-runner@eta-simulator-2026.iam.gserviceaccount.com \
  --add-cloudsql-instances=eta-simulator-2026:us-central1:eta-sim-pg \
  --set-secrets=DATABASE_URL=database-url:latest \
  --set-env-vars="AUTH_ENABLED=false" \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi
```

#### 3. Get Cloud Run URL

```bash
API_URL=$(gcloud run services describe eta-simulator-api \
  --region=us-central1 \
  --format='value(status.url)')
echo $API_URL
```

#### 4. Build Frontend

```bash
cd frontend

# Update production environment
echo "VITE_API_URL=${API_URL}/api" > .env.production
echo "VITE_GCP_PROJECT_ID=eta-simulator-2026" >> .env.production

# Install dependencies and build
npm ci
npm run build

cd ..
```

#### 5. Deploy to Firebase

```bash
firebase deploy --only hosting
```

---

## Testing & Verification

### Infrastructure Tests

Verify GCP resources are properly configured:

```bash
./scripts/test-infrastructure.sh
```

Tests include:
- GCP project and billing
- All required APIs enabled
- Cloud SQL instance status
- Secret Manager secrets
- Artifact Registry repository
- Service account and IAM roles
- Firebase configuration
- Local files present
- Docker daemon running

### Deployment Tests

Verify the live deployment is working:

```bash
./scripts/test-deployment.sh
```

Tests include:
- Backend health check
- API endpoints responding
- Frontend serving correctly
- SPA routing working
- CORS headers configured
- Database connectivity

### Manual Verification

```bash
# Backend health
curl https://eta-simulator-api-194990387864.us-central1.run.app/health

# API documentation
open https://eta-simulator-api-194990387864.us-central1.run.app/docs

# Frontend
open https://eta-simulator-2026.web.app
```

---

## Cost Estimates

### Monthly Cost Breakdown

| Service | Configuration | Estimated Cost |
|---------|---------------|----------------|
| **Firebase Hosting** | Up to 10GB bandwidth | Free |
| **Cloud Run** | Min 0, avg 2 instances | $5-15 |
| **Cloud SQL** | db-f1-micro (1 vCPU, 614MB) | ~$10 |
| **Artifact Registry** | <1GB storage | Free |
| **Secret Manager** | 1 secret, minimal access | Free |
| **Total** | | **~$15-25/month** |

### Cost Optimization Tips

1. **Cloud SQL**: Consider stopping instance during non-business hours
2. **Cloud Run**: Already scales to zero when not in use
3. **Monitoring**: Set up billing alerts at $25, $50, $100

---

## Troubleshooting

### Common Issues

#### 1. Cloud Run Deployment Fails with Architecture Error

**Error:** `Container manifest type must support amd64/linux`

**Solution:** Build with platform flag:
```bash
docker build --platform linux/amd64 -f Dockerfile.backend -t IMAGE_NAME .
```

#### 2. Database Connection Fails

**Check Cloud SQL is running:**
```bash
gcloud sql instances describe eta-sim-pg --format='value(state)'
# Should return: RUNNABLE
```

**Verify secret:**
```bash
gcloud secrets versions access latest --secret=database-url
```

#### 3. CORS Errors in Browser

**Verify backend CORS config includes Firebase domain:**
```bash
grep -A 10 "cors_origins" backend/app/config.py
```

Should include:
- `https://eta-simulator-2026.web.app`
- `https://eta-simulator-2026.firebaseapp.com`

#### 4. Frontend Shows Blank Page

**Check browser console for API errors.**

**Verify .env.production has correct API URL:**
```bash
cat frontend/.env.production
```

#### 5. Cold Start Latency

Cloud Run scales to zero. First request after idle may take 5-10s.

**To reduce:** Set `--min-instances=1` (increases cost ~$20/month)

### Useful Commands

```bash
# View Cloud Run logs
gcloud run services logs read eta-simulator-api --region=us-central1

# View Cloud SQL logs
gcloud sql operations list --instance=eta-sim-pg

# Check IAM permissions
gcloud projects get-iam-policy eta-simulator-2026

# List deployed revisions
gcloud run revisions list --service=eta-simulator-api --region=us-central1
```

---

## Security Considerations

### Current Security Measures

1. **Non-root container user**: Backend runs as `appuser`, not root
2. **Secrets in Secret Manager**: Database credentials not in environment
3. **HTTPS everywhere**: All endpoints use TLS
4. **Cloud SQL private connection**: Uses Cloud SQL proxy socket
5. **Minimal IAM permissions**: Service account has only required roles

### Future Enhancements

1. **Enable IAP Authentication**: Restrict access to authorized users
   ```bash
   gcloud run services update eta-simulator-api --no-allow-unauthenticated
   ```

2. **VPC Connector**: Route Cloud Run through private network

3. **Cloud Armor**: Add WAF protection for DDoS and OWASP threats

4. **Binary Authorization**: Enforce signed container images

---

## Appendix

### Environment Variables

#### Backend (Cloud Run)

| Variable | Source | Description |
|----------|--------|-------------|
| `DATABASE_URL` | Secret Manager | PostgreSQL connection string |
| `AUTH_ENABLED` | Environment | Enable/disable authentication |
| `PORT` | Cloud Run | Server port (default 8080) |

#### Frontend (Build-time)

| Variable | File | Description |
|----------|------|-------------|
| `VITE_API_URL` | .env.production | Backend API base URL |
| `VITE_GCP_PROJECT_ID` | .env.production | GCP project identifier |

### File Structure

```
ETA-simulator/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # Entry point
│   │   ├── config.py          # Configuration (CORS, DB)
│   │   └── ...
│   └── requirements.txt
├── frontend/                   # React frontend
│   ├── src/
│   ├── dist/                   # Production build (gitignored)
│   ├── .env.production         # Production env vars
│   └── package.json
├── scripts/
│   ├── test-infrastructure.sh  # GCP verification tests
│   └── test-deployment.sh      # E2E deployment tests
├── docs/
│   └── DEPLOYMENT.md           # This document
├── Dockerfile.backend          # Backend container
├── firebase.json               # Firebase Hosting config
├── .firebaserc                 # Firebase project link
├── deploy.sh                   # Automated deployment
└── README.md                   # Project overview
```

---

*Last updated: January 2, 2026*
*Deployed by: Claude Code*
