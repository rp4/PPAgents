#!/bin/bash

# PPAgents GCP Infrastructure Setup Script
# This script sets up Cloud SQL and Cloud Storage for the PPAgents application

set -e  # Exit on any error

# Configuration
PROJECT_ID="ppagents"
REGION="us-central1"
DB_INSTANCE_NAME="ppagents-db"
DB_NAME="ppagents"
DB_USER="ppagents_admin"
STORAGE_BUCKET="${PROJECT_ID}-storage"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}PPAgents GCP Infrastructure Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Database Instance: $DB_INSTANCE_NAME"
echo "Storage Bucket: $STORAGE_BUCKET"
echo ""

# Set the project
echo -e "${YELLOW}Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable compute.googleapis.com
echo -e "${GREEN}✓ APIs enabled${NC}"

# Create Cloud SQL PostgreSQL instance
echo -e "${YELLOW}Creating Cloud SQL PostgreSQL instance...${NC}"
echo "This will take 5-10 minutes. Please be patient..."

gcloud sql instances create $DB_INSTANCE_NAME \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --root-password=$(openssl rand -base64 32) \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=4 \
  --availability-type=zonal \
  || echo -e "${YELLOW}Instance may already exist, continuing...${NC}"

echo -e "${GREEN}✓ Cloud SQL instance created${NC}"

# Wait for instance to be ready
echo -e "${YELLOW}Waiting for instance to be ready...${NC}"
gcloud sql instances describe $DB_INSTANCE_NAME --format="value(state)" | grep RUNNABLE || {
  echo "Waiting for instance..."
  sleep 30
}

# Generate a secure password for the database user
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Create database
echo -e "${YELLOW}Creating database...${NC}"
gcloud sql databases create $DB_NAME \
  --instance=$DB_INSTANCE_NAME \
  || echo -e "${YELLOW}Database may already exist, continuing...${NC}"

echo -e "${GREEN}✓ Database created${NC}"

# Create database user
echo -e "${YELLOW}Creating database user...${NC}"
gcloud sql users create $DB_USER \
  --instance=$DB_INSTANCE_NAME \
  --password=$DB_PASSWORD \
  || echo -e "${YELLOW}User may already exist, continuing...${NC}"

echo -e "${GREEN}✓ Database user created${NC}"

# Get the connection name
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)")
echo -e "${GREEN}Connection Name: $CONNECTION_NAME${NC}"

# Create Cloud Storage bucket
echo -e "${YELLOW}Creating Cloud Storage bucket...${NC}"
gcloud storage buckets create gs://$STORAGE_BUCKET \
  --location=$REGION \
  --uniform-bucket-level-access \
  || echo -e "${YELLOW}Bucket may already exist, continuing...${NC}"

echo -e "${GREEN}✓ Cloud Storage bucket created${NC}"

# Set CORS policy for the bucket (needed for direct uploads)
echo -e "${YELLOW}Setting CORS policy...${NC}"
cat > /tmp/cors.json <<EOF
[
  {
    "origin": ["http://localhost:3000", "https://*.vercel.app"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gcloud storage buckets update gs://$STORAGE_BUCKET --cors-file=/tmp/cors.json
rm /tmp/cors.json
echo -e "${GREEN}✓ CORS policy set${NC}"

# Generate DATABASE_URL
# For local development with Cloud SQL Proxy
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"

# For direct connection (if you enable public IP)
# Get public IP
PUBLIC_IP=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(ipAddresses[0].ipAddress)")
DATABASE_URL_DIRECT="postgresql://${DB_USER}:${DB_PASSWORD}@${PUBLIC_IP}:5432/${DB_NAME}"

# Generate a secure NextAuth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Create .env.local file
echo -e "${YELLOW}Generating .env.local file...${NC}"

cat > .env.local <<EOF
# Database Configuration
# For local development, use Cloud SQL Proxy:
# ./cloud-sql-proxy --port 5432 $CONNECTION_NAME
DATABASE_URL="${DATABASE_URL}"

# Alternative: Direct connection (requires whitelisting your IP)
# DATABASE_URL="${DATABASE_URL_DIRECT}"

# Google Cloud Storage
GCS_BUCKET_NAME="${STORAGE_BUCKET}"
GCS_PROJECT_ID="${PROJECT_ID}"

# For local development, Application Default Credentials will be used
# No need for GCS_CREDENTIALS_PATH when using: gcloud auth application-default login

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# Google OAuth (for SSO)
# Get these from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Azure AD OAuth (optional)
# Get these from: https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps
AZURE_AD_CLIENT_ID="your-azure-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-client-secret"
AZURE_AD_TENANT_ID="your-azure-tenant-id"

# Application Settings
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# MCP Server (optional)
MCP_PORT="3001"
EOF

echo -e "${GREEN}✓ .env.local file created${NC}"

# Create a summary file with important information
cat > GCP_SETUP_SUMMARY.md <<EOF
# GCP Setup Summary

## Created Resources

### Cloud SQL Instance
- **Instance Name**: $DB_INSTANCE_NAME
- **Connection Name**: $CONNECTION_NAME
- **Database**: $DB_NAME
- **User**: $DB_USER
- **Password**: $DB_PASSWORD
- **Region**: $REGION
- **Public IP**: $PUBLIC_IP

### Cloud Storage
- **Bucket Name**: $STORAGE_BUCKET
- **Location**: $REGION
- **URL**: gs://$STORAGE_BUCKET

### NextAuth
- **Secret**: $NEXTAUTH_SECRET

## Next Steps

### 1. Install Cloud SQL Proxy (for local development)

Download the proxy:
\`\`\`bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
\`\`\`

Run it (in a separate terminal):
\`\`\`bash
./cloud-sql-proxy --port 5432 $CONNECTION_NAME
\`\`\`

### 2. Set Up SSO Provider

#### Google Workspace OAuth:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized redirect URIs:
   - http://localhost:3000/api/auth/callback/google
   - https://your-production-domain.com/api/auth/callback/google
5. Copy Client ID and Secret to .env.local

#### Azure AD OAuth:
1. Go to: https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps
2. New registration
3. Redirect URI: http://localhost:3000/api/auth/callback/azure-ad
4. Create client secret
5. Copy Application (client) ID, Client secret, and Directory (tenant) ID to .env.local

### 3. Install Dependencies and Run Migrations

\`\`\`bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate dev --name init

# Seed database
npm run prisma:seed
\`\`\`

### 4. Start Development Server

\`\`\`bash
# Terminal 1: Cloud SQL Proxy
./cloud-sql-proxy --port 5432 $CONNECTION_NAME

# Terminal 2: Next.js dev server
npm run dev
\`\`\`

## Security Notes

- Database password has been saved to .env.local
- Keep .env.local file secure and never commit it to git
- The .env.local file is already in .gitignore
- For production, use Secret Manager instead of .env files

## Useful Commands

\`\`\`bash
# Connect to database
gcloud sql connect $DB_INSTANCE_NAME --user=$DB_USER --database=$DB_NAME

# View instance details
gcloud sql instances describe $DB_INSTANCE_NAME

# List storage bucket contents
gcloud storage ls gs://$STORAGE_BUCKET

# Enable public IP access (if needed)
gcloud sql instances patch $DB_INSTANCE_NAME --authorized-networks=YOUR_IP/32
\`\`\`

EOF

echo -e "${GREEN}✓ Summary saved to GCP_SETUP_SUMMARY.md${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Review ${YELLOW}.env.local${NC} and ${YELLOW}GCP_SETUP_SUMMARY.md${NC}"
echo -e "2. Set up OAuth credentials (Google/Azure AD)"
echo -e "3. Download and run Cloud SQL Proxy"
echo -e "4. Run: ${YELLOW}npm install${NC}"
echo -e "5. Run: ${YELLOW}npm run prisma:migrate dev${NC}"
echo -e "6. Run: ${YELLOW}npm run dev${NC}"
echo ""
echo -e "${YELLOW}Important:${NC} Save your credentials from GCP_SETUP_SUMMARY.md in a secure location!"
