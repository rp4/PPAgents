# ⚡ Quick Start 

---

## 1️⃣ Generate Secrets

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Save this output - you'll need it!
```

---

## 2️⃣ Set Environment Variables

Create `.env.production` with these **6 required variables**:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/database"
DIRECT_URL="${DATABASE_URL}"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="<paste-the-secret-you-generated>"

# Google OAuth (or use Azure AD)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Environment
NODE_ENV="production"
```

---

## 3️⃣ Set Up Database

### Option A - GCP Cloud SQL (Recommended for Production):

**Step 1: Create Cloud SQL Database**
```bash
# Create database in existing Cloud SQL instance
gcloud sql databases create ppagents --instance=YOUR_INSTANCE_NAME

# Create dedicated user with secure password
DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users create ppagents_user \
  --instance=YOUR_INSTANCE_NAME \
  --password="$DB_PASSWORD"

echo "Save this password: $DB_PASSWORD"
```

**Step 2: Run Migrations via Cloud SQL Proxy**
```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.2/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Start proxy (replace with your connection string)
./cloud-sql-proxy YOUR_PROJECT:REGION:INSTANCE --port 5433 &

# URL-encode the password (important for special characters!)
ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote_plus('$DB_PASSWORD'))")

# Run migrations
export DATABASE_URL="postgresql://ppagents_user:${ENCODED_PASSWORD}@localhost:5433/ppagents"
export DIRECT_URL="$DATABASE_URL"
npx prisma migrate deploy

# Optional: Add seed data
npm run prisma:seed

# Stop proxy
pkill cloud-sql-proxy
```

**Update .env.production** with the Cloud SQL Unix socket connection:
```bash
DATABASE_URL="postgresql://ppagents_user:URL_ENCODED_PASSWORD@/ppagents?host=/cloudsql/PROJECT:REGION:INSTANCE"
DIRECT_URL="${DATABASE_URL}"
```

### Option B - Local PostgreSQL:
```bash
# Create database
createdb ppagents

# Run migrations
export DATABASE_URL="postgresql://localhost:5432/ppagents"
npx prisma migrate deploy

# Optional: Seed data
npm run prisma:seed
```

---

## 4️⃣ Build

```bash
npm ci
npx prisma generate
npm run build
```

---

## 5️⃣ Deploy

### Prerequisites
```bash
# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com
```

### Option 1 - Cloud Run (Direct from Source):
```bash
# Deploy directly from source (Cloud Run builds the Docker image)
gcloud run deploy ppagents \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="DATABASE_URL=postgresql://ppagents_user:URL_ENCODED_PASSWORD@/ppagents?host=/cloudsql/PROJECT:REGION:INSTANCE" \
  --set-env-vars="DIRECT_URL=postgresql://ppagents_user:URL_ENCODED_PASSWORD@/ppagents?host=/cloudsql/PROJECT:REGION:INSTANCE" \
  --set-env-vars="NEXTAUTH_URL=https://YOUR_SERVICE_URL" \
  --set-env-vars="NEXTAUTH_SECRET=YOUR_SECRET" \
  --set-env-vars="GOOGLE_CLIENT_ID=YOUR_CLIENT_ID" \
  --set-env-vars="GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET" \
  --add-cloudsql-instances="PROJECT:REGION:INSTANCE"

# Note: Replace URL_ENCODED_PASSWORD, YOUR_SERVICE_URL, and credentials with actual values
```

**Important**: The `NEXTAUTH_URL` should match the Cloud Run service URL you'll get after deployment (e.g., `https://ppagents-123456789.us-central1.run.app`)

### Option 2 - Docker (Build Locally):
```bash
# Build Docker image
docker build -t ppagents .

# Tag for GCR
docker tag ppagents gcr.io/YOUR_PROJECT/ppagents

# Push to GCR
docker push gcr.io/YOUR_PROJECT/ppagents

# Deploy to Cloud Run
gcloud run deploy ppagents \
  --image gcr.io/YOUR_PROJECT/ppagents \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=...,NEXTAUTH_URL=...,NEXTAUTH_SECRET=...,GOOGLE_CLIENT_ID=...,GOOGLE_CLIENT_SECRET=..." \
  --add-cloudsql-instances="PROJECT:REGION:INSTANCE"
```

### Option 3 - Local Development:
```bash
npm run dev
# Access at http://localhost:3000
```

---

## 6️⃣ Configure OAuth Callback

Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
1. Edit your OAuth client
2. Add redirect URI: `https://your-domain.com/api/auth/callback/google`
3. Save

---

## ✅ Done!


### Verify it's working:

```bash
# Health check
curl https://your-domain.com/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## ⚠️ You'll See This Warning (It's OK!)

```
⚠️  PRODUCTION WARNING: Upstash Redis not configured.
Rate limiting will use in-memory fallback.
```

**This is fine** You don't need Redis.

---

## 🆘 Troubleshooting

### Docker Build Fails: "COPY failed: stat app/public: file does not exist"
```bash
# Create the public directory if it doesn't exist
mkdir -p public
echo "# Public Assets" > public/README.md
```

### TypeScript Build Errors
The codebase should build cleanly. If you see errors about missing fields like `platforms`, `tags`, or `category_id`, make sure you have the latest code.

### Database Connection Fails
```bash
# For special characters in password, URL-encode it:
python3 -c "import urllib.parse; print(urllib.parse.quote_plus('YOUR_PASSWORD'))"

# Test connection:
psql "postgresql://ppagents_user:ENCODED_PASSWORD@localhost:5433/ppagents" -c "SELECT version();"
```

### Cloud Build Permission Errors
```bash
# Enable required APIs
gcloud services enable artifactregistry.googleapis.com containerregistry.googleapis.com

# Grant permissions to Cloud Build service account
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

### App Won't Start
- Check all 6 environment variables are set
- Verify DATABASE_URL is correct: `psql "$DATABASE_URL"`
- Make sure domain uses HTTPS
- Check Cloud Run logs: `gcloud run services logs read ppagents --region=us-central1`

### OAuth Not Working
- Check redirect URI is configured correctly in Google Cloud Console
- Verify CLIENT_ID and SECRET are correct
- Ensure NEXTAUTH_URL matches your actual domain (must be HTTPS)
- Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`

### Migrations Won't Run
- Ensure Cloud SQL Proxy is running and accessible
- Check password is URL-encoded correctly
- Verify database user has necessary permissions:
  ```sql
  GRANT ALL PRIVILEGES ON DATABASE ppagents TO ppagents_user;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ppagents_user;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ppagents_user;
  ```

### Still Stuck?
- Check build logs: `gcloud builds list --limit=5`
- Check Cloud Run logs: `gcloud run services logs read ppagents --region=us-central1 --limit=50`
- See full guide: [CLAUDE.md](CLAUDE.md) for detailed architecture documentation

---
