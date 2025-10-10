#!/bin/bash
set -e

# ============================================
# Sync Environment Variables to GitHub Secrets
# ============================================
# This script reads from .env and syncs to GitHub repository secrets

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
echo -e "${BLUE}║  Sync Environment Variables to GitHub Secrets                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo ""
    echo "Please create .env from .env.example:"
    echo "  cp .env.example .env"
    echo "  nano .env  # Edit with your values"
    exit 1
fi

# Load environment variables from .env
echo -e "${GREEN}📖 Loading configuration from: $ENV_FILE${NC}"
set -a  # automatically export all variables
source "$ENV_FILE"
set +a
echo ""

# Display current configuration
echo -e "${BLUE}═══ Current Configuration ═══${NC}"
echo ""
echo -e "${YELLOW}Azure:${NC}"
echo "  Tenant ID:         $AZURE_TENANT_ID"
echo "  Resource Group:    $AZURE_RESOURCE_GROUP"
echo "  ACR Name:          $ACR_NAME"
echo "  AKS Cluster:       $AKS_CLUSTER_NAME"
echo ""
echo -e "${YELLOW}Azure AD:${NC}"
echo "  Frontend Client:   $VITE_AZURE_CLIENT_ID"
echo "  Backend Client:    $AZURE_BACKEND_CLIENT_ID"
echo "  API Scope:         $VITE_AZURE_API_SCOPE"
echo ""
echo -e "${YELLOW}Deployment:${NC}"
echo "  Frontend URL:      $FRONTEND_URL"
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

# Sync secrets (only the ones needed for GitHub Actions)
echo "Syncing secrets..."

# Azure Configuration
gh secret set AZURE_TENANT_ID --body "$AZURE_TENANT_ID" --repo "$REPO" && echo "✅ AZURE_TENANT_ID"
gh secret set AZURE_SUBSCRIPTION_ID --body "$AZURE_SUBSCRIPTION_ID" --repo "$REPO" && echo "✅ AZURE_SUBSCRIPTION_ID"

# Azure AD Frontend
gh secret set VITE_AZURE_CLIENT_ID --body "$VITE_AZURE_CLIENT_ID" --repo "$REPO" && echo "✅ VITE_AZURE_CLIENT_ID"
gh secret set VITE_AZURE_TENANT_ID --body "$VITE_AZURE_TENANT_ID" --repo "$REPO" && echo "✅ VITE_AZURE_TENANT_ID"
gh secret set VITE_AZURE_API_SCOPE --body "$VITE_AZURE_API_SCOPE" --repo "$REPO" && echo "✅ VITE_AZURE_API_SCOPE"

echo ""
echo -e "${GREEN}✅ Configuration synced successfully!${NC}"
echo ""
echo -e "${BLUE}═══ GitHub Secrets Updated ═══${NC}"
echo "The following secrets have been updated in GitHub:"
echo "  • AZURE_TENANT_ID"
echo "  • AZURE_SUBSCRIPTION_ID"
echo "  • VITE_AZURE_CLIENT_ID"
echo "  • VITE_AZURE_TENANT_ID"
echo "  • VITE_AZURE_API_SCOPE"
echo ""
echo -e "${YELLOW}Note:${NC} AZURE_CLIENT_ID (GitHub OIDC) is managed separately"
echo ""
echo -e "${BLUE}═══ Next Steps ═══${NC}"
echo "1. Verify secrets in GitHub: https://github.com/$REPO/settings/secrets/actions"
echo "2. Trigger deployment: git push origin main"
echo ""

