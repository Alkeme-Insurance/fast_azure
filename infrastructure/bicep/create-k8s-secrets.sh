#!/bin/bash
# ============================================
# Create Kubernetes Secrets from Key Vault
# ============================================
# This script retrieves secrets from Azure Key Vault
# and creates Kubernetes secrets for the application

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Configuration
# ============================================

NAMESPACE="${NAMESPACE:-fastazure}"
KEY_VAULT_NAME="${KEY_VAULT_NAME}"
RESOURCE_GROUP="${RESOURCE_GROUP:-fastazure-rg}"

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

# ============================================
# Main Script
# ============================================

echo ""
log_info "Creating Kubernetes secrets from Azure Key Vault..."
echo ""

# Check if Key Vault name is provided
if [ -z "$KEY_VAULT_NAME" ]; then
    log_warning "KEY_VAULT_NAME not provided. Trying to find it..."
    
    # Try to get from latest deployment
    KEY_VAULT_NAME=$(az deployment group list \
        --resource-group "$RESOURCE_GROUP" \
        --query "[?name | starts_with(@, 'fastazure-deployment')].properties.outputs.keyVaultName.value | [-1]" \
        -o tsv 2>/dev/null)
    
    if [ -z "$KEY_VAULT_NAME" ] || [ "$KEY_VAULT_NAME" == "null" ]; then
        echo "Could not find Key Vault name automatically."
        echo "Please provide it with: export KEY_VAULT_NAME=<your-keyvault-name>"
        exit 1
    fi
    
    log_success "Found Key Vault: $KEY_VAULT_NAME"
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    log_warning "kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if connected to AKS
if ! kubectl cluster-info &> /dev/null; then
    log_warning "Not connected to Kubernetes cluster."
    echo "Run: az aks get-credentials --resource-group $RESOURCE_GROUP --name <aks-name>"
    exit 1
fi

# Create namespace if it doesn't exist
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    log_info "Creating namespace: $NAMESPACE"
    kubectl create namespace "$NAMESPACE"
fi

log_info "Retrieving secrets from Key Vault: $KEY_VAULT_NAME"

# Get MongoDB URI
MONGODB_URI=$(az keyvault secret show \
    --vault-name "$KEY_VAULT_NAME" \
    --name "mongodb-uri" \
    --query "value" -o tsv 2>/dev/null || echo "")

if [ -z "$MONGODB_URI" ]; then
    log_warning "mongodb-uri not found in Key Vault"
    MONGODB_URI="mongodb://localhost:27017"
fi

# Get Azure AD Client ID (optional)
AZURE_CLIENT_ID=$(az keyvault secret show \
    --vault-name "$KEY_VAULT_NAME" \
    --name "azure-client-id" \
    --query "value" -o tsv 2>/dev/null || echo "")

# Get Azure AD Tenant ID (optional)
AZURE_TENANT_ID=$(az keyvault secret show \
    --vault-name "$KEY_VAULT_NAME" \
    --name "azure-tenant-id" \
    --query "value" -o tsv 2>/dev/null || echo "")

# Get Azure API Scope (optional)
AZURE_API_SCOPE=$(az keyvault secret show \
    --vault-name "$KEY_VAULT_NAME" \
    --name "azure-api-scope" \
    --query "value" -o tsv 2>/dev/null || echo "")

log_success "Retrieved secrets from Key Vault"

# Delete existing secret if it exists
if kubectl get secret fastazure-secrets -n "$NAMESPACE" &> /dev/null; then
    log_warning "Deleting existing secret: fastazure-secrets"
    kubectl delete secret fastazure-secrets -n "$NAMESPACE"
fi

# Create Kubernetes secret
log_info "Creating Kubernetes secret: fastazure-secrets"

KUBECTL_CMD="kubectl create secret generic fastazure-secrets --namespace=$NAMESPACE"
KUBECTL_CMD+=" --from-literal=mongodb-uri='$MONGODB_URI'"

if [ -n "$AZURE_CLIENT_ID" ]; then
    KUBECTL_CMD+=" --from-literal=azure-client-id='$AZURE_CLIENT_ID'"
fi

if [ -n "$AZURE_TENANT_ID" ]; then
    KUBECTL_CMD+=" --from-literal=azure-tenant-id='$AZURE_TENANT_ID'"
fi

if [ -n "$AZURE_API_SCOPE" ]; then
    KUBECTL_CMD+=" --from-literal=azure-api-scope='$AZURE_API_SCOPE'"
fi

# Execute the command
eval "$KUBECTL_CMD"

log_success "Kubernetes secret created: fastazure-secrets"
echo ""

# Verify secret
log_info "Verifying secret..."
kubectl get secret fastazure-secrets -n "$NAMESPACE"
echo ""

log_success "==================== COMPLETE ===================="
echo ""
echo "Secrets have been created in Kubernetes namespace: $NAMESPACE"
echo ""
echo "To view secret keys:"
echo "  ${GREEN}kubectl describe secret fastazure-secrets -n $NAMESPACE${NC}"
echo ""
echo "To view a specific secret value (base64 decoded):"
echo "  ${GREEN}kubectl get secret fastazure-secrets -n $NAMESPACE -o jsonpath='{.data.mongodb-uri}' | base64 -d${NC}"
echo ""
echo "You can now deploy your application:"
echo "  ${GREEN}kubectl apply -f infrastructure/k8s/${NC}"
echo ""

