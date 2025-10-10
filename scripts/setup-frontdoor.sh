#!/bin/bash
set -e

# ============================================
# Azure Front Door Setup Script
# ============================================
# This script sets up Azure Front Door with:
# - Managed SSL certificate (free)
# - Backend pointing to your AKS frontend
# - HTTPS-only routing
# - Automatic certificate renewal

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
echo -e "${BLUE}║  Azure Front Door Setup for HTTPS                                 ║${NC}"
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
RESOURCE_GROUP="$AZURE_RESOURCE_GROUP"
# Get the current frontend IP from AKS (will be replaced by Front Door)
FRONTEND_IP=$(kubectl get svc -n fastazure frontend-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "40.67.155.178")
TENANT_ID="$AZURE_TENANT_ID"
FRONTEND_CLIENT_ID="$VITE_AZURE_CLIENT_ID"

FRONTDOOR_NAME="fastazure-fd"
BACKEND_ADDRESS="${FRONTEND_IP}"

echo -e "${GREEN}📖 Configuration:${NC}"
echo "  Resource Group:  $RESOURCE_GROUP"
echo "  Backend IP:      $BACKEND_ADDRESS"
echo "  Front Door Name: $FRONTDOOR_NAME"
echo ""

# Confirm
read -p "Continue with Azure Front Door setup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Setup cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}═══ Step 1: Creating Front Door Profile ═══${NC}"

# Create Front Door profile (Standard tier for managed certificate)
az afd profile create \
  --profile-name "$FRONTDOOR_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --sku Standard_AzureFrontDoor

echo -e "${GREEN}✅ Front Door profile created${NC}"
echo ""

echo -e "${BLUE}═══ Step 2: Creating Endpoint ═══${NC}"

ENDPOINT_NAME="fastazure-endpoint"

az afd endpoint create \
  --profile-name "$FRONTDOOR_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --endpoint-name "$ENDPOINT_NAME" \
  --enabled-state Enabled

# Get the endpoint hostname
ENDPOINT_HOSTNAME=$(az afd endpoint show \
  --profile-name "$FRONTDOOR_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --endpoint-name "$ENDPOINT_NAME" \
  --query hostName -o tsv)

echo -e "${GREEN}✅ Endpoint created: $ENDPOINT_HOSTNAME${NC}"
echo ""

echo -e "${BLUE}═══ Step 3: Creating Origin Group ═══${NC}"

ORIGIN_GROUP_NAME="fastazure-origin-group"

az afd origin-group create \
  --profile-name "$FRONTDOOR_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --origin-group-name "$ORIGIN_GROUP_NAME" \
  --probe-request-type GET \
  --probe-protocol Http \
  --probe-interval-in-seconds 60 \
  --probe-path /health \
  --sample-size 4 \
  --successful-samples-required 3 \
  --additional-latency-in-milliseconds 50

echo -e "${GREEN}✅ Origin group created${NC}"
echo ""

echo -e "${BLUE}═══ Step 4: Adding Origin (Backend) ═══${NC}"

ORIGIN_NAME="fastazure-origin"

az afd origin create \
  --profile-name "$FRONTDOOR_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --origin-group-name "$ORIGIN_GROUP_NAME" \
  --origin-name "$ORIGIN_NAME" \
  --origin-host-header "$BACKEND_ADDRESS" \
  --host-name "$BACKEND_ADDRESS" \
  --http-port 80 \
  --https-port 443 \
  --priority 1 \
  --weight 1000 \
  --enabled-state Enabled

echo -e "${GREEN}✅ Origin added${NC}"
echo ""

echo -e "${BLUE}═══ Step 5: Associating Endpoint with Domain ═══${NC}"

# Associate the endpoint's default domain
az afd route create \
  --profile-name "$FRONTDOOR_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --endpoint-name "$ENDPOINT_NAME" \
  --route-name "default-route" \
  --origin-group "$ORIGIN_GROUP_NAME" \
  --supported-protocols Http Https \
  --https-redirect Enabled \
  --forwarding-protocol HttpOnly \
  --link-to-default-domain Enabled \
  --patterns-to-match "/*" \
  --enabled-state Enabled

echo -e "${GREEN}✅ Route created with default domain (HTTP → HTTPS redirect enabled)${NC}"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ Azure Front Door Setup Complete!                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Your HTTPS URL:${NC} https://$ENDPOINT_HOSTNAME"
echo ""
echo -e "${YELLOW}═══ Next Steps ═══${NC}"
echo ""
echo "1. Update Azure AD Redirect URI:"
echo "   az ad app update --id $FRONTEND_CLIENT_ID \\"
echo "     --web-redirect-uris \"https://$ENDPOINT_HOSTNAME\" \"http://localhost:3000\""
echo ""
echo "2. Update .env file:"
echo "   sed -i \"s|FRONTEND_URL=.*|FRONTEND_URL=https://$ENDPOINT_HOSTNAME|\" .env"
echo "   sed -i \"s|VITE_AZURE_REDIRECT_URI=.*|VITE_AZURE_REDIRECT_URI=https://$ENDPOINT_HOSTNAME|\" .env"
echo "   sed -i \"s|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=https://$ENDPOINT_HOSTNAME|\" .env"
echo ""
echo "3. Sync to GitHub secrets:"
echo "   ./scripts/sync-github-secrets.sh"
echo ""
echo "4. Test your application:"
echo "   https://$ENDPOINT_HOSTNAME"
echo ""
echo -e "${GREEN}✅ Azure AD authentication will now work over HTTPS!${NC}"
echo ""

