// ============================================
// Fast Azure - Main Infrastructure Template
// ============================================
// Creates ACR, AKS, and supporting resources

targetScope = 'resourceGroup'

// ============================================
// Parameters
// ============================================

@description('The Azure region for all resources')
param location string = resourceGroup().location

@description('Environment name (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'dev'

@description('Base name for all resources')
param projectName string = 'fastazure'

@description('Your Azure AD tenant ID for RBAC')
param tenantId string = subscription().tenantId

@description('Your Azure AD object ID (user/service principal) for AKS admin access')
param adminObjectId string

@description('Enable Azure AD authentication for AKS')
param enableAzureAD bool = true

// ============================================
// Secret Parameters (from .env)
// ============================================

@secure()
@description('Azure AD Client ID for frontend authentication')
param azureClientId string = ''

@secure()
@description('Azure AD Tenant ID for frontend authentication')
param azureTenantId string = ''

@secure()
@description('Azure AD API Scope for backend access')
param azureApiScope string = ''

@description('Backend CORS origins (comma-separated)')
param backendCorsOrigins string = 'http://localhost:3000,http://localhost:5173'

@description('GitHub repository for OIDC authentication (format: owner/repo)')
param githubRepository string = ''

@description('Enable Azure Monitor for containers')
param enableMonitoring bool = true

@description('AKS node count')
@minValue(1)
@maxValue(10)
param nodeCount int = 3

@description('AKS node VM size')
param nodeVmSize string = 'Standard_D2s_v3'

@description('Kubernetes version')
param kubernetesVersion string = '1.28.0'

@description('Tags to apply to all resources')
param tags object = {
  Project: 'FastAzure'
  Environment: environment
  ManagedBy: 'Bicep'
}

// ============================================
// Variables
// ============================================

var resourcePrefix = '${projectName}-${environment}'
var acrName = replace('${resourcePrefix}acr', '-', '')
var aksName = '${resourcePrefix}-aks'
var logAnalyticsName = '${resourcePrefix}-logs'
var vnetName = '${resourcePrefix}-vnet'
var aksSubnetName = 'aks-subnet'
var mongoCosmosName = replace('${resourcePrefix}-cosmos', '-', '')
var keyVaultName = '${take(resourcePrefix, 20)}-kv-${uniqueString(resourceGroup().id)}'

// ============================================
// Log Analytics Workspace (for AKS monitoring)
// ============================================

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = if (enableMonitoring) {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// ============================================
// Virtual Network (for AKS)
// ============================================

resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: aksSubnetName
        properties: {
          addressPrefix: '10.0.1.0/24'
          serviceEndpoints: [
            {
              service: 'Microsoft.ContainerRegistry'
            }
            {
              service: 'Microsoft.Storage'
            }
          ]
        }
      }
    ]
  }
}

// ============================================
// Azure Key Vault
// ============================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: environment == 'prod' ? true : false
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
  }
}

// Grant admin user Key Vault Secrets Officer role
resource keyVaultAdminRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, adminObjectId, 'KeyVaultSecretsOfficer')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7') // Key Vault Secrets Officer
    principalId: adminObjectId
    principalType: 'User'
  }
}

// ============================================
// Key Vault Secrets
// ============================================

resource kvSecretMongoUri 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'mongodb-uri'
  properties: {
    value: cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString
    contentType: 'text/plain'
  }
}

resource kvSecretAzureClientId 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(azureClientId)) {
  parent: keyVault
  name: 'azure-client-id'
  properties: {
    value: azureClientId
    contentType: 'text/plain'
  }
}

resource kvSecretAzureTenantId 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(azureTenantId)) {
  parent: keyVault
  name: 'azure-tenant-id'
  properties: {
    value: azureTenantId
    contentType: 'text/plain'
  }
}

resource kvSecretAzureApiScope 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(azureApiScope)) {
  parent: keyVault
  name: 'azure-api-scope'
  properties: {
    value: azureApiScope
    contentType: 'text/plain'
  }
}

resource kvSecretBackendCorsOrigins 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'backend-cors-origins'
  properties: {
    value: backendCorsOrigins
    contentType: 'text/plain'
  }
}

// ============================================
// Azure Container Registry (ACR)
// ============================================

resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  tags: tags
  sku: {
    name: environment == 'prod' ? 'Premium' : 'Standard'
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
    networkRuleBypassOptions: 'AzureServices'
    policies: {
      quarantinePolicy: {
        status: 'disabled'
      }
      trustPolicy: {
        type: 'Notary'
        status: 'disabled'
      }
      retentionPolicy: {
        days: 30
        status: environment == 'prod' ? 'enabled' : 'disabled'
      }
    }
    encryption: {
      status: 'disabled'
    }
  }
}

// ============================================
// Azure Kubernetes Service (AKS)
// ============================================

resource aks 'Microsoft.ContainerService/managedClusters@2024-01-01' = {
  name: aksName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    kubernetesVersion: kubernetesVersion
    dnsPrefix: '${resourcePrefix}-dns'
    enableRBAC: true
    
    // Workload Identity (OIDC Issuer)
    oidcIssuerProfile: {
      enabled: true
    }
    securityProfile: {
      workloadIdentity: {
        enabled: true
      }
    }
    
    // Azure AD Integration
    aadProfile: enableAzureAD ? {
      managed: true
      enableAzureRBAC: true
      tenantID: tenantId
    } : null
    
    // Agent Pool (Node Pool)
    agentPoolProfiles: [
      {
        name: 'agentpool'
        count: nodeCount
        vmSize: nodeVmSize
        osType: 'Linux'
        mode: 'System'
        type: 'VirtualMachineScaleSets'
        enableAutoScaling: true
        minCount: environment == 'prod' ? 3 : 1
        maxCount: environment == 'prod' ? 10 : 5
        vnetSubnetID: vnet.properties.subnets[0].id
        maxPods: 110
        osDiskSizeGB: 128
        osDiskType: 'Managed'
      }
    ]
    
    // Networking
    networkProfile: {
      networkPlugin: 'azure'
      networkPolicy: 'azure'
      serviceCidr: '10.1.0.0/16'
      dnsServiceIP: '10.1.0.10'
      loadBalancerSku: 'standard'
      outboundType: 'loadBalancer'
    }
    
    // Add-ons
    addonProfiles: {
      omsagent: enableMonitoring ? {
        enabled: true
        config: {
          logAnalyticsWorkspaceResourceID: logAnalytics.id
        }
      } : {
        enabled: false
      }
      azurepolicy: {
        enabled: false
      }
      httpApplicationRouting: {
        enabled: false
      }
    }
    
    // Security
    apiServerAccessProfile: {
      enablePrivateCluster: false
    }
    
    // Auto-upgrade
    autoUpgradeProfile: {
      upgradeChannel: environment == 'prod' ? 'stable' : 'patch'
    }
  }
}

// ============================================
// Role Assignments
// ============================================

// Grant AKS pull permission from ACR
resource aksAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, aks.id, 'AcrPull')
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull
    principalId: aks.properties.identityProfile.kubeletidentity.objectId
    principalType: 'ServicePrincipal'
  }
}

// Grant admin user AKS cluster admin access
resource aksAdminRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(aks.id, adminObjectId, 'AKSClusterAdmin')
  scope: aks
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b1ff04bb-8a4e-4dc4-8eb5-8693973ce19b') // Azure Kubernetes Service RBAC Cluster Admin
    principalId: adminObjectId
    principalType: 'User'
  }
}

// Grant AKS kubelet identity access to Key Vault secrets
resource aksKeyVaultSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, aks.id, 'KeyVaultSecretsUser')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: aks.properties.identityProfile.kubeletidentity.objectId
    principalType: 'ServicePrincipal'
  }
}

// ============================================
// Managed Identity for GitHub OIDC
// ============================================

resource githubWorkloadIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${resourcePrefix}-github-identity'
  location: location
  tags: tags
}

// Federated Credential for GitHub OIDC
resource githubFederatedCredential 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = if (!empty(githubRepository)) {
  parent: githubWorkloadIdentity
  name: 'github-federated-credential'
  properties: {
    issuer: 'https://token.actions.githubusercontent.com'
    subject: 'repo:${githubRepository}:ref:refs/heads/main'
    audiences: [
      'api://AzureADTokenExchange'
    ]
  }
}

// Grant GitHub identity Key Vault Secrets User role
resource githubKeyVaultSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, githubWorkloadIdentity.name, 'GitHubSecretsUser')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: githubWorkloadIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Grant GitHub identity AcrPull role for ACR
resource githubAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, githubWorkloadIdentity.name, 'GitHubAcrPull')
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull
    principalId: githubWorkloadIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Grant GitHub identity Contributor role on AKS (for kubectl access)
resource githubAksContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(aks.id, githubWorkloadIdentity.name, 'GitHubAksContributor')
  scope: aks
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b24988ac-6180-42a0-ab88-20f7382dd24c') // Contributor
    principalId: githubWorkloadIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ============================================
// Cosmos DB for MongoDB (optional, managed MongoDB)
// ============================================

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: mongoCosmosName
  location: location
  tags: tags
  kind: 'MongoDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: environment == 'prod'
      }
    ]
    capabilities: [
      {
        name: 'EnableMongo'
      }
      {
        name: 'EnableServerless'
      }
    ]
    apiProperties: {
      serverVersion: '7.0'
    }
    enableAutomaticFailover: environment == 'prod'
    enableFreeTier: environment == 'dev'
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/mongodbDatabases@2024-05-15' = {
  parent: cosmosAccount
  name: 'appdb'
  properties: {
    resource: {
      id: 'appdb'
    }
  }
}

// ============================================
// Outputs
// ============================================

output acrName string = acr.name
output acrLoginServer string = acr.properties.loginServer
output aksName string = aks.name
output aksFqdn string = aks.properties.fqdn
output aksId string = aks.id
output aksNodeResourceGroup string = aks.properties.nodeResourceGroup
output aksOidcIssuerUrl string = aks.properties.oidcIssuerProfile.issuerURL
output logAnalyticsId string = enableMonitoring ? logAnalytics.id : ''
output vnetId string = vnet.id
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
output cosmosConnectionString string = cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output githubIdentityClientId string = githubWorkloadIdentity.properties.clientId
output githubIdentityPrincipalId string = githubWorkloadIdentity.properties.principalId
output githubIdentityName string = githubWorkloadIdentity.name

@description('Commands to connect to AKS')
output aksConnectCommands string = '''
# Get AKS credentials
az aks get-credentials --resource-group ${resourceGroup().name} --name ${aksName}

# Verify connection
kubectl get nodes

# View cluster info
kubectl cluster-info
'''

@description('Commands to push images to ACR')
output acrPushCommands string = '''
# Login to ACR
az acr login --name ${acrName}

# Build and push backend
docker build -t ${acr.properties.loginServer}/fastazure-backend:latest -f backend/Dockerfile .
docker push ${acr.properties.loginServer}/fastazure-backend:latest

# Build and push frontend
docker build -t ${acr.properties.loginServer}/fastazure-frontend:latest -f frontend/Dockerfile .
docker push ${acr.properties.loginServer}/fastazure-frontend:latest
'''

@description('Commands to access Key Vault secrets')
output keyVaultCommands string = '''
# View all secrets
az keyvault secret list --vault-name ${keyVaultName} --query "[].name" -o table

# Get a specific secret
az keyvault secret show --vault-name ${keyVaultName} --name mongodb-uri --query "value" -o tsv

# Set a new secret
az keyvault secret set --vault-name ${keyVaultName} --name my-secret --value "my-value"
'''

@description('GitHub Actions OIDC configuration')
output githubActionsConfig string = !empty(githubRepository) ? '''
# Add these secrets to your GitHub repository:
# Settings → Secrets and variables → Actions → New repository secret

AZURE_CLIENT_ID=${githubWorkloadIdentity.properties.clientId}
AZURE_TENANT_ID=${tenantId}
AZURE_SUBSCRIPTION_ID=${subscription().subscriptionId}

# Use in GitHub Actions workflow:
- uses: azure/login@v1
  with:
    client-id: $${{ secrets.AZURE_CLIENT_ID }}
    tenant-id: $${{ secrets.AZURE_TENANT_ID }}
    subscription-id: $${{ secrets.AZURE_SUBSCRIPTION_ID }}
''' : 'GitHub repository not configured'

