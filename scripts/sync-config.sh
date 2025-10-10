#!/bin/bash
set -e

# ============================================
# Sync Configuration Script
# ============================================
# This script reads from config/azure-config.json and:
# 1. Updates GitHub repository secrets
# 2. Displays current configuration
# 3. Can be used to validate configuration

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_FILE="${PROJECT_ROOT}/config/azure-config.json"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Fast Azure - Configuration Sync                                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Configuration file not found: $CONFIG_FILE${NC}"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is not installed. Please install it: sudo apt-get install jq${NC}"
    exit 1
fi

# Read configuration
echo -e "${GREEN}📖 Reading configuration from: $CONFIG_FILE${NC}"
echo ""

TENANT_ID=$(jq -r '.azure.tenantId' "$CONFIG_FILE")
FRONTEND_CLIENT_ID=$(jq -r '.azureAd.frontend.clientId' "$CONFIG_FILE")
BACKEND_CLIENT_ID=$(jq -r '.azureAd.backend.clientId' "$CONFIG_FILE")
API_SCOPE=$(jq -r '.azureAd.backend.apiScope' "$CONFIG_FILE")
FRONTEND_IP=$(jq -r '.deployment.frontendPublicIp' "$CONFIG_FILE")
RESOURCE_GROUP=$(jq -r '.azure.resourceGroup' "$CONFIG_FILE")
ACR_NAME=$(jq -r '.containerRegistry.name' "$CONFIG_FILE")
AKS_CLUSTER=$(jq -r '.kubernetes.clusterName' "$CONFIG_FILE")

# Display current configuration
echo -e "${BLUE}═══ Current Configuration ═══${NC}"
echo ""
echo -e "${YELLOW}Azure AD:${NC}"
echo "  Tenant ID:         $TENANT_ID"
echo "  Frontend Client:   $FRONTEND_CLIENT_ID"
echo "  Backend Client:    $BACKEND_CLIENT_ID"
echo "  API Scope:         $API_SCOPE"
echo ""
echo -e "${YELLOW}Deployment:${NC}"
echo "  Frontend IP:       $FRONTEND_IP"
echo "  Resource Group:    $RESOURCE_GROUP"
echo "  ACR Name:          $ACR_NAME"
echo "  AKS Cluster:       $AKS_CLUSTER"
echo ""

# Ask if user wants to sync to GitHub secrets
read -p "Do you want to sync these values to GitHub secrets? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Skipping GitHub secrets sync${NC}"
    exit 0
fi

# Get repository name
REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || echo "")
if [ -z "$REPO" ]; then
    echo -e "${RED}❌ Could not determine repository. Run this from within the repository.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🔄 Syncing to GitHub repository: $REPO${NC}"
echo ""

# Sync secrets
gh secret set VITE_AZURE_CLIENT_ID --body "$FRONTEND_CLIENT_ID" --repo "$REPO" && echo "✅ VITE_AZURE_CLIENT_ID"
gh secret set VITE_AZURE_TENANT_ID --body "$TENANT_ID" --repo "$REPO" && echo "✅ VITE_AZURE_TENANT_ID"
gh secret set VITE_AZURE_API_SCOPE --body "$API_SCOPE" --repo "$REPO" && echo "✅ VITE_AZURE_API_SCOPE"

echo ""
echo -e "${GREEN}✅ Configuration synced successfully!${NC}"
echo ""
echo -e "${BLUE}═══ Next Steps ═══${NC}"
echo "1. Review the configuration in: config/azure-config.json"
echo "2. Update GitHub secrets manually if needed"
echo "3. Deploy with: git push origin main"
echo ""

