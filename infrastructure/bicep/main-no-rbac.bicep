// Simplified Bicep - No RBAC role assignments
// This version creates resources without role assignments to avoid permission issues

targetScope = 'resourceGroup'

@description('Environment name')
param environment string = 'dev'

@description('Location for all resources')
param location string = 'eastus2'

@description('Project name')
param projectName string = 'fastazure'

var resourcePrefix = '${projectName}-${environment}'
var acrName = replace('${projectName}${environment}acr', '-', '')
var aksName = '${resourcePrefix}-aks'
// Key Vault name must be 3-24 chars, alphanumeric and hyphens only
var keyVaultName = 'kv-${projectName}-${take(uniqueString(resourceGroup().id), 6)}'
var cosmosName = replace('${resourcePrefix}mongo', '-', '')

// ACR
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// AKS
resource aks 'Microsoft.ContainerService/managedClusters@2024-02-01' = {
  name: aksName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    dnsPrefix: aksName
    agentPoolProfiles: [
      {
        name: 'agentpool'
        count: 2
        vmSize: 'Standard_D2s_v3'
        mode: 'System'
      }
    ]
    networkProfile: {
      networkPlugin: 'azure'
      serviceCidr: '10.0.0.0/16'
      dnsServiceIP: '10.0.0.10'
    }
  }
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

// Cosmos DB
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: cosmosName
  location: location
  kind: 'MongoDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    capabilities: [
      {
        name: 'EnableMongo'
      }
    ]
  }
}

// Outputs
output acrName string = acr.name
output acrLoginServer string = acr.properties.loginServer
output aksName string = aks.name
output keyVaultName string = keyVault.name
output cosmosName string = cosmosAccount.name
output cosmosConnectionString string = cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString
