#!/bin/bash
# ETA-Simulator Deployment Script
# Deploys backend to Cloud Run and frontend to Firebase Hosting
set -e

PROJECT_ID="eta-simulator-2026"
REGION="us-central1"
API_IMAGE="us-central1-docker.pkg.dev/$PROJECT_ID/eta-simulator/api:latest"
SERVICE_NAME="eta-simulator-api"
CLOUD_SQL_INSTANCE="$PROJECT_ID:$REGION:eta-sim-pg"

echo "=========================================="
echo "ETA-Simulator Deployment"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "=========================================="

# Ensure we're using the correct project
gcloud config set project $PROJECT_ID

# Step 1: Build and push backend image
echo ""
echo "=== Step 1: Building Backend Docker Image (AMD64) ==="
docker build --platform linux/amd64 -f Dockerfile.backend -t $API_IMAGE .

echo ""
echo "=== Step 2: Pushing to Artifact Registry ==="
docker push $API_IMAGE

# Step 3: Deploy to Cloud Run
echo ""
echo "=== Step 3: Deploying to Cloud Run ==="
gcloud run deploy $SERVICE_NAME \
  --image=$API_IMAGE \
  --region=$REGION \
  --service-account=eta-sim-runner@$PROJECT_ID.iam.gserviceaccount.com \
  --add-cloudsql-instances=$CLOUD_SQL_INSTANCE \
  --set-secrets=DATABASE_URL=database-url:latest \
  --set-env-vars="AUTH_ENABLED=false,CORS_ORIGINS=https://eta-simulator-2026.web.app" \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --concurrency=80

# Get Cloud Run URL
echo ""
echo "=== Step 4: Getting Cloud Run URL ==="
API_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
echo "Backend API URL: $API_URL"

# Step 5: Build frontend with production API URL
echo ""
echo "=== Step 5: Building Frontend ==="
cd frontend
echo "VITE_API_URL=${API_URL}/api" > .env.production
echo "VITE_GCP_PROJECT_ID=$PROJECT_ID" >> .env.production
npm ci
npm run build
cd ..

# Step 6: Deploy to Firebase Hosting
echo ""
echo "=== Step 6: Deploying to Firebase Hosting ==="
firebase deploy --only hosting

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo "Frontend: https://eta-simulator-2026.web.app"
echo "Backend API: $API_URL"
echo ""
echo "Test the deployment:"
echo "  curl $API_URL/health"
echo "=========================================="
