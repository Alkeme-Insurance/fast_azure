#!/bin/bash
set -e

# ============================================
# Setup GitHub OIDC for Fast Azure
# ============================================
# This creates a Managed Identity with federated credentials
# for GitHub Actions to authenticate to Azure (passwordless)

echo "🔐 Setting up GitHub OIDC Authentication..."
echo ""

# Configuration
RESOURCE_GROUP="fastazure-rg"
LOCATION="eastus2"
IDENTITY_NAME="fastazure-github-identity"
GITHUB_REPO="Alkeme-Insurance/fast_azure"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

echo "Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Identity Name: $IDENTITY_NAME"
echo "  GitHub Repo: $GITHUB_REPO"
echo "  Subscription: $SUBSCRIPTION_ID"
echo ""

# Step 1: Create Managed Identity
echo "📝 Step 1: Creating Managed Identity..."
az identity create \
  --name $IDENTITY_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --tags Project=FastAzure Environment=dev Purpose=GitHubOIDC

echo "✅ Managed Identity created"
echo ""

# Get identity details
CLIENT_ID=$(az identity show --name $IDENTITY_NAME --resource-group $RESOURCE_GROUP --query clientId -o tsv)
PRINCIPAL_ID=$(az identity show --name $IDENTITY_NAME --resource-group $RESOURCE_GROUP --query principalId -o tsv)

echo "Identity Details:"
echo "  Client ID: $CLIENT_ID"
echo "  Principal ID: $PRINCIPAL_ID"
echo ""

# Step 2: Create Federated Credential for GitHub
echo "📝 Step 2: Creating Federated Credential for GitHub..."
az identity federated-credential create \
  --name github-main-branch \
  --identity-name $IDENTITY_NAME \
  --resource-group $RESOURCE_GROUP \
  --issuer https://token.actions.githubusercontent.com \
  --subject "repo:${GITHUB_REPO}:ref:refs/heads/main" \
  --audiences api://AzureADTokenExchange

echo "✅ Federated credential created for main branch"
echo ""

# Step 3: Grant permissions
echo "📝 Step 3: Granting Azure permissions..."

# Wait for identity to propagate
echo "⏳ Waiting for identity to propagate (30 seconds)..."
sleep 30

# Contributor role on subscription (for creating resources)
echo "  → Granting Contributor role on subscription..."
az role assignment create \
  --assignee $CLIENT_ID \
  --role Contributor \
  --scope /subscriptions/$SUBSCRIPTION_ID

echo "✅ Permissions granted"
echo ""

# Step 4: Update GitHub Secret
echo "📝 Step 4: Updating GitHub Secret..."
gh secret set AZURE_CLIENT_ID \
  --body "$CLIENT_ID" \
  --repo $GITHUB_REPO

echo "✅ GitHub secret AZURE_CLIENT_ID updated"
echo ""

# Step 5: Verify setup
echo "📝 Step 5: Verifying setup..."

echo "Federated Credentials:"
az identity federated-credential list \
  --identity-name $IDENTITY_NAME \
  --resource-group $RESOURCE_GROUP \
  --output table

echo ""
echo "Role Assignments:"
az role assignment list \
  --assignee $CLIENT_ID \
  --output table

echo ""
echo "GitHub Secrets:"
gh secret list --repo $GITHUB_REPO | grep AZURE

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ GitHub OIDC Setup Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📋 Summary:"
echo "  ✅ Managed Identity created: $IDENTITY_NAME"
echo "  ✅ Client ID: $CLIENT_ID"
echo "  ✅ Federated credential configured for: $GITHUB_REPO"
echo "  ✅ GitHub secret AZURE_CLIENT_ID updated"
echo "  ✅ Contributor permissions granted"
echo ""
echo "🚀 Next Steps:"
echo "  1. Push code to trigger GitHub Actions:"
echo "     git commit --allow-empty -m 'Test GitHub OIDC'"
echo "     git push origin main"
echo ""
echo "  2. Watch the workflow:"
echo "     gh run watch --repo $GITHUB_REPO --exit-status"
echo ""
echo "  3. GitHub Actions will now:"
echo "     - Authenticate to Azure (passwordless!)"
echo "     - Create/update infrastructure"
echo "     - Deploy application to AKS"
echo ""
echo "════════════════════════════════════════════════════════════"
