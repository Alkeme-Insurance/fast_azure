#!/bin/bash
set -e

# ============================================
# Configure Azure AD App as SPA
# ============================================
# This script configures the Azure AD frontend
# app registration as a Single-Page Application
# with proper redirect URIs.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Configure Azure AD App as SPA                                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env from .env.example:"
    echo "  cp .env.example .env"
    exit 1
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# Read configuration from environment
FRONTEND_CLIENT_ID="$VITE_AZURE_CLIENT_ID"
FRONTEND_URL="$FRONTEND_URL"

echo -e "${GREEN}📖 Configuration:${NC}"
echo "  Client ID:     $FRONTEND_CLIENT_ID"
echo "  Frontend URL:  $FRONTEND_URL"
echo ""

# Get Object ID
echo -e "${BLUE}═══ Step 1: Getting App Object ID ═══${NC}"
OBJECT_ID=$(az ad app show --id "$FRONTEND_CLIENT_ID" --query id -o tsv)
echo -e "${GREEN}✅ Object ID: $OBJECT_ID${NC}"
echo ""

# Update to SPA type
echo -e "${BLUE}═══ Step 2: Configuring as Single-Page Application ═══${NC}"

az rest --method PATCH \
  --uri "https://graph.microsoft.com/v1.0/applications/$OBJECT_ID" \
  --headers 'Content-Type=application/json' \
  --body "{
    \"spa\": {
      \"redirectUris\": [
        \"$FRONTEND_URL\",
        \"http://localhost:3000\"
      ]
    },
    \"web\": {
      \"redirectUris\": []
    }
  }"

echo -e "${GREEN}✅ App configured as SPA!${NC}"
echo ""

# Verify configuration
echo -e "${BLUE}═══ Step 3: Verifying Configuration ═══${NC}"
CONFIG=$(az rest --method GET \
  --uri "https://graph.microsoft.com/v1.0/applications/$OBJECT_ID" \
  --query "{displayName:displayName, appId:appId, spa:spa, web:web}")

echo "$CONFIG" | jq .
echo ""

# Check if SPA redirect URIs are set
SPA_URIS=$(echo "$CONFIG" | jq -r '.spa.redirectUris | length')
if [ "$SPA_URIS" -gt 0 ]; then
    echo -e "${GREEN}✅ SPA redirect URIs configured: $SPA_URIS URIs${NC}"
else
    echo -e "${RED}❌ No SPA redirect URIs found!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ Azure AD App Configured as SPA!                               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Clear your browser cache/cookies"
echo "2. Visit: $FRONTEND_URL"
echo "3. Click 'Sign In' and authenticate"
echo ""
echo -e "${GREEN}✅ Authentication should now work!${NC}"
echo ""

