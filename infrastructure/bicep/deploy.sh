#!/bin/bash
# ============================================
# Fast Azure - Bicep Deployment Script
# ============================================
# Deploys ACR, AKS, and supporting resources

set -e

# ============================================
# Configuration
# ============================================

RESOURCE_GROUP="${RESOURCE_GROUP:-fastazure-rg}"
LOCATION="${LOCATION:-eastus}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-}"  # Format: owner/repo
BICEP_FILE="main.bicep"
PARAMS_FILE="main.bicepparam"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Helper Functions
# ============================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# Pre-flight Checks
# ============================================

log_info "Starting Fast Azure infrastructure deployment..."
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    log_error "Azure CLI is not installed. Please install it: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    log_error "Not logged into Azure. Please run: az login"
    exit 1
fi

# Check if bicep file exists
if [ ! -f "$BICEP_FILE" ]; then
    log_error "Bicep file not found: $BICEP_FILE"
    exit 1
fi

# Get current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
log_info "Using subscription: $SUBSCRIPTION ($SUBSCRIPTION_ID)"
echo ""

# ============================================
# Get User Info for RBAC
# ============================================

log_info "Getting your Azure AD Object ID for AKS admin access..."
ADMIN_OBJECT_ID=$(az ad signed-in-user show --query id -o tsv)

if [ -z "$ADMIN_OBJECT_ID" ]; then
    log_error "Could not retrieve your Azure AD Object ID. Please ensure you're logged in with: az login"
    exit 1
fi

log_success "Admin Object ID: $ADMIN_OBJECT_ID"
echo ""

# ============================================
# Load Secrets from .env file
# ============================================

log_info "Loading secrets from .env file..."

# Check if .env exists in project root
ENV_FILE="../../.env"
if [ -f "$ENV_FILE" ]; then
    # Source .env file (but handle it safely)
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        
        # Remove quotes and export
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        case "$key" in
            VITE_AZURE_CLIENT_ID)
                AZURE_CLIENT_ID="$value"
                ;;
            VITE_AZURE_TENANT_ID)
                AZURE_TENANT_ID="$value"
                ;;
            VITE_AZURE_API_SCOPE)
                AZURE_API_SCOPE="$value"
                ;;
            BACKEND_CORS_ORIGINS)
                BACKEND_CORS="$value"
                ;;
        esac
    done < "$ENV_FILE"
    
    log_success "Loaded configuration from .env"
    
    # Check if running in dev mode
    if [ -z "$AZURE_CLIENT_ID" ] || [ "$AZURE_CLIENT_ID" == "" ]; then
        log_warning "No Azure AD Client ID found - secrets will not be stored in Key Vault"
        log_warning "This is fine for dev mode (VITE_DEV_NO_AUTH=true)"
    else
        log_success "Azure AD credentials loaded from .env"
    fi
else
    log_warning ".env file not found at $ENV_FILE"
    log_warning "Azure AD secrets will not be stored in Key Vault"
    log_warning "You can add them later with: az keyvault secret set"
    AZURE_CLIENT_ID=""
    AZURE_TENANT_ID=""
    AZURE_API_SCOPE=""
    BACKEND_CORS="http://localhost:3000,http://localhost:5173"
fi
echo ""

# ============================================
# Create Resource Group
# ============================================

log_info "Checking resource group: $RESOURCE_GROUP..."

if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    log_warning "Resource group already exists: $RESOURCE_GROUP"
else
    log_info "Creating resource group: $RESOURCE_GROUP in $LOCATION..."
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --tags Environment="$ENVIRONMENT" Project="FastAzure"
    log_success "Resource group created"
fi
echo ""

# ============================================
# Deploy Bicep Template
# ============================================

log_info "Deploying infrastructure with Bicep..."
log_info "This will create:"
log_info "  - Azure Container Registry (ACR)"
log_info "  - Azure Kubernetes Service (AKS) with Workload Identity"
log_info "  - Azure Key Vault (with secrets)"
log_info "  - Virtual Network"
log_info "  - Log Analytics Workspace"
log_info "  - Cosmos DB for MongoDB"

if [ -n "$GITHUB_REPOSITORY" ]; then
    log_info "  - GitHub OIDC Managed Identity for: $GITHUB_REPOSITORY"
fi

echo ""
log_warning "This may take 10-15 minutes..."
echo ""

DEPLOYMENT_NAME="fastazure-deployment-$(date +%Y%m%d-%H%M%S)"

# Prepare parameters
PARAMS=(
    --parameters adminObjectId="$ADMIN_OBJECT_ID"
    --parameters environment="$ENVIRONMENT"
    --parameters location="$LOCATION"
)

# Add GitHub repository if provided
if [ -n "$GITHUB_REPOSITORY" ]; then
    PARAMS+=(--parameters githubRepository="$GITHUB_REPOSITORY")
    log_success "GitHub OIDC will be configured for: $GITHUB_REPOSITORY"
fi

# Add secrets if available
if [ -n "$AZURE_CLIENT_ID" ]; then
    PARAMS+=(--parameters azureClientId="$AZURE_CLIENT_ID")
fi
if [ -n "$AZURE_TENANT_ID" ]; then
    PARAMS+=(--parameters azureTenantId="$AZURE_TENANT_ID")
fi
if [ -n "$AZURE_API_SCOPE" ]; then
    PARAMS+=(--parameters azureApiScope="$AZURE_API_SCOPE")
fi
if [ -n "$BACKEND_CORS" ]; then
    PARAMS+=(--parameters backendCorsOrigins="$BACKEND_CORS")
fi

# Deploy with parameters
az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --template-file "$BICEP_FILE" \
    "${PARAMS[@]}" \
    --verbose

log_success "Deployment completed!"
echo ""

# ============================================
# Get Outputs
# ============================================

log_info "Retrieving deployment outputs..."
echo ""

ACR_NAME=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query properties.outputs.acrName.value -o tsv)

ACR_LOGIN_SERVER=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query properties.outputs.acrLoginServer.value -o tsv)

AKS_NAME=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query properties.outputs.aksName.value -o tsv)

COSMOS_CONNECTION=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query properties.outputs.cosmosConnectionString.value -o tsv)

KEY_VAULT_NAME=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query properties.outputs.keyVaultName.value -o tsv)

KEY_VAULT_URI=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --query properties.outputs.keyVaultUri.value -o tsv)

# Get GitHub identity info if configured
if [ -n "$GITHUB_REPOSITORY" ]; then
    GITHUB_CLIENT_ID=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query properties.outputs.githubIdentityClientId.value -o tsv)
    
    GITHUB_IDENTITY_NAME=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query properties.outputs.githubIdentityName.value -o tsv)
    
    AKS_OIDC_ISSUER=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query properties.outputs.aksOidcIssuerUrl.value -o tsv)
fi

# ============================================
# Display Summary
# ============================================

echo ""
log_success "==================== DEPLOYMENT COMPLETE ===================="
echo ""
echo "Resource Group:    $RESOURCE_GROUP"
echo "Location:          $LOCATION"
echo "Environment:       $ENVIRONMENT"
echo ""
echo "ACR Name:          $ACR_NAME"
echo "ACR Login Server:  $ACR_LOGIN_SERVER"
echo ""
echo "AKS Cluster:       $AKS_NAME"
echo ""
echo "Key Vault:         $KEY_VAULT_NAME"
echo "Key Vault URI:     $KEY_VAULT_URI"
echo ""

if [ -n "$GITHUB_REPOSITORY" ]; then
    echo "GitHub Identity:   $GITHUB_IDENTITY_NAME"
    echo "Client ID:         $GITHUB_CLIENT_ID"
    echo "OIDC Issuer:       $AKS_OIDC_ISSUER"
    echo ""
fi

# ============================================
# Next Steps
# ============================================

log_info "==================== NEXT STEPS ===================="
echo ""
echo "1. Connect to your AKS cluster:"
echo "   ${GREEN}az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_NAME${NC}"
echo ""
echo "2. Verify cluster connection:"
echo "   ${GREEN}kubectl get nodes${NC}"
echo ""
echo "3. Login to ACR:"
echo "   ${GREEN}az acr login --name $ACR_NAME${NC}"
echo ""
echo "4. Build and push your images:"
echo "   ${GREEN}docker build -t $ACR_LOGIN_SERVER/fastazure-backend:latest -f backend/Dockerfile .${NC}"
echo "   ${GREEN}docker push $ACR_LOGIN_SERVER/fastazure-backend:latest${NC}"
echo ""
echo "   ${GREEN}docker build -t $ACR_LOGIN_SERVER/fastazure-frontend:latest -f frontend/Dockerfile .${NC}"
echo "   ${GREEN}docker push $ACR_LOGIN_SERVER/fastazure-frontend:latest${NC}"
echo ""
echo "5. View secrets in Key Vault:"
echo "   ${GREEN}az keyvault secret list --vault-name $KEY_VAULT_NAME --query \"[].name\" -o table${NC}"
echo ""
echo "6. Get a specific secret:"
echo "   ${GREEN}az keyvault secret show --vault-name $KEY_VAULT_NAME --name mongodb-uri --query \"value\" -o tsv${NC}"
echo ""
echo "7. Deploy to Kubernetes:"
echo "   ${GREEN}kubectl apply -f infrastructure/k8s/${NC}"
echo ""
echo "   Note: Kubernetes will use secrets from Key Vault via CSI driver or environment variables"
echo ""

if [ -n "$GITHUB_REPOSITORY" ]; then
    TENANT_ID=$(az account show --query tenantId -o tsv)
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    
    echo "8. Configure GitHub Actions:"
    echo "   ${YELLOW}Add these secrets to your GitHub repository:${NC}"
    echo "   ${GREEN}Settings → Secrets and variables → Actions → New repository secret${NC}"
    echo ""
    echo "   ${GREEN}AZURE_CLIENT_ID${NC}        = $GITHUB_CLIENT_ID"
    echo "   ${GREEN}AZURE_TENANT_ID${NC}        = $TENANT_ID"
    echo "   ${GREEN}AZURE_SUBSCRIPTION_ID${NC}  = $SUBSCRIPTION_ID"
    echo ""
    echo "   This identity has permissions to:"
    echo "   - Pull from ACR ($ACR_NAME)"
    echo "   - Read Key Vault secrets ($KEY_VAULT_NAME)"
    echo "   - Manage AKS cluster ($AKS_NAME)"
    echo ""
fi

# Save outputs to file
OUTPUT_FILE="deployment-outputs-${ENVIRONMENT}.txt"
cat > "$OUTPUT_FILE" << EOF
Fast Azure Deployment Outputs
==============================
Deployment:        $DEPLOYMENT_NAME
Resource Group:    $RESOURCE_GROUP
Location:          $LOCATION
Environment:       $ENVIRONMENT
Timestamp:         $(date)

ACR Name:          $ACR_NAME
ACR Login Server:  $ACR_LOGIN_SERVER

AKS Cluster:       $AKS_NAME

Key Vault:         $KEY_VAULT_NAME
Key Vault URI:     $KEY_VAULT_URI

Secrets stored in Key Vault:
- mongodb-uri (Cosmos DB connection string)
- azure-client-id (if provided)
- azure-tenant-id (if provided)
- azure-api-scope (if provided)
- backend-cors-origins

$(if [ -n "$GITHUB_REPOSITORY" ]; then
cat << GITHUB_INFO

GitHub OIDC Configuration:
Repository:     $GITHUB_REPOSITORY
Identity Name:  $GITHUB_IDENTITY_NAME
Client ID:      $GITHUB_CLIENT_ID

GitHub Secrets to Add:
AZURE_CLIENT_ID:        $GITHUB_CLIENT_ID
AZURE_TENANT_ID:        $(az account show --query tenantId -o tsv)
AZURE_SUBSCRIPTION_ID:  $(az account show --query id -o tsv)

Permissions granted:
- ACR Pull (for pulling images)
- Key Vault Secrets User (for reading secrets)
- AKS Contributor (for kubectl access)
GITHUB_INFO
fi)

Next Steps:
1. az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_NAME
2. kubectl get nodes
3. az acr login --name $ACR_NAME
4. Build and push images
5. Deploy to Kubernetes
EOF

log_success "Deployment outputs saved to: $OUTPUT_FILE"
echo ""
log_success "==================== DEPLOYMENT COMPLETE ===================="

