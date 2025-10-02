// ============================================
// Fast Azure - Parameters File
// ============================================
// Fill in your values and use with:
// az deployment group create --parameters @main.bicepparam

using './main.bicep'

// ============================================
// Required Parameters
// ============================================

// Your Azure AD Object ID (get with: az ad signed-in-user show --query id -o tsv)
param adminObjectId = '<YOUR_AZURE_AD_OBJECT_ID>'

// GitHub repository for OIDC (format: owner/repo, e.g., 'myorg/myrepo')
// Leave empty to skip GitHub OIDC setup
param githubRepository = ''  // Example: 'jharris/fast_azure'

// ============================================
// Secrets (from .env file)
// ============================================

// Leave empty if using dev mode (VITE_DEV_NO_AUTH=true)
param azureClientId = ''        // VITE_AZURE_CLIENT_ID
param azureTenantId = ''        // VITE_AZURE_TENANT_ID
param azureApiScope = ''        // VITE_AZURE_API_SCOPE
param backendCorsOrigins = 'http://localhost:3000,http://localhost:5173'

// ============================================
// Optional Parameters (can override defaults)
// ============================================

param location = 'eastus'
param environment = 'dev'
param projectName = 'fastazure'
param enableAzureAD = true
param enableMonitoring = true
param nodeCount = 2  // Lower for dev to save costs
param nodeVmSize = 'Standard_D2s_v3'
param kubernetesVersion = '1.28.0'

param tags = {
  Project: 'FastAzure'
  Environment: 'dev'
  ManagedBy: 'Bicep'
  CostCenter: 'Engineering'
}

