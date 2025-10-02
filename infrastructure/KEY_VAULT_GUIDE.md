# Azure Key Vault Integration Guide

This guide explains how Azure Key Vault is used to securely store and manage secrets in the Fast Azure application.

## 📋 Table of Contents

- [Overview](#overview)
- [What Gets Stored](#what-gets-stored)
- [How It Works](#how-it-works)
- [Deployment](#deployment)
- [Access Control](#access-control)
- [Using Secrets in Kubernetes](#using-secrets-in-kubernetes)
- [Managing Secrets](#managing-secrets)
- [Security Best Practices](#security-best-practices)

---

## Overview

Azure Key Vault is a cloud service for securely storing and accessing secrets, keys, and certificates. In Fast Azure, Key Vault automatically stores all sensitive configuration from your `.env` file during infrastructure deployment.

### Benefits

- ✅ **Centralized Secret Management** - All secrets in one secure location
- ✅ **Automatic Encryption** - Secrets encrypted at rest and in transit
- ✅ **Access Control** - Fine-grained RBAC permissions
- ✅ **Audit Logging** - Track who accessed what and when
- ✅ **Integration with Kubernetes** - Easy secret injection into pods
- ✅ **Soft Delete & Purge Protection** - Prevent accidental deletion

---

## What Gets Stored

The Bicep deployment automatically stores these secrets in Key Vault:

### Automatic Secrets

1. **`mongodb-uri`**
   - Cosmos DB connection string (generated during deployment)
   - Example: `mongodb+srv://fastazuredev:****@fastazuredev.mongo.cosmos.azure.com:10255/appdb`

2. **`backend-cors-origins`**
   - Allowed CORS origins for backend
   - Example: `http://localhost:3000,http://localhost:5173`

### From .env File (if provided)

3. **`azure-client-id`**
   - Azure AD Application (Client) ID
   - From: `VITE_AZURE_CLIENT_ID` in `.env`

4. **`azure-tenant-id`**
   - Azure AD Directory (Tenant) ID
   - From: `VITE_AZURE_TENANT_ID` in `.env`

5. **`azure-api-scope`**
   - Azure AD API scope for backend access
   - From: `VITE_AZURE_API_SCOPE` in `.env`

---

## How It Works

### 1. During Deployment

```mermaid
graph LR
    A[.env file] -->|Read by deploy.sh| B[Bicep Template]
    B -->|Creates| C[Key Vault]
    B -->|Stores secrets| C
    D[Cosmos DB] -->|Connection string| C
```

The deployment script:
1. Reads secrets from `.env` file in project root
2. Passes them as secure parameters to Bicep template
3. Bicep creates Key Vault with RBAC enabled
4. Bicep stores all secrets in Key Vault
5. Grants necessary permissions to admin user and AKS

### 2. Access Control (RBAC)

Permissions are automatically configured:

| Principal | Role | Purpose |
|-----------|------|---------|
| **Your User Account** | Key Vault Secrets Officer | Full secret management |
| **AKS Managed Identity** | Key Vault Secrets User | Read secrets for pods |

### 3. In Kubernetes

Secrets can be accessed two ways:

**Option A: Manual (current setup)**
- Run `create-k8s-secrets.sh` to copy secrets to Kubernetes
- Kubernetes secrets are injected as environment variables

**Option B: CSI Driver (advanced)**
- Mount secrets directly from Key Vault into pods
- No duplication in Kubernetes
- Automatic rotation

---

## Deployment

### Initial Deployment

Secrets are automatically stored during infrastructure deployment:

```bash
cd infrastructure/bicep

# Ensure .env file exists in project root
ls -la ../../.env

# Deploy (reads .env automatically)
./deploy.sh
```

**What happens:**
1. Script reads `VITE_AZURE_*` variables from `.env`
2. Deploys Key Vault with unique name (e.g., `fastazure-dev-kv-abc123`)
3. Stores all secrets with proper names
4. Outputs Key Vault name and URI

### After Deployment

The deployment script shows:

```
Key Vault:         fastazure-dev-kv-abc123xyz
Key Vault URI:     https://fastazure-dev-kv-abc123xyz.vault.azure.net/

Secrets stored in Key Vault:
- mongodb-uri (Cosmos DB connection string)
- azure-client-id (if provided)
- azure-tenant-id (if provided)
- azure-api-scope (if provided)
- backend-cors-origins
```

---

## Access Control

### View Your Permissions

```bash
# Get Key Vault name
KEY_VAULT_NAME=$(az deployment group show \
  --resource-group fastazure-rg \
  --name <deployment-name> \
  --query properties.outputs.keyVaultName.value -o tsv)

# List your role assignments
az role assignment list \
  --scope $(az keyvault show --name $KEY_VAULT_NAME --query id -o tsv) \
  --query "[].{Role:roleDefinitionName, Principal:principalName}"
```

### Grant Access to Another User

```bash
# Get their Object ID
OTHER_USER_ID=$(az ad user show \
  --id user@example.com \
  --query id -o tsv)

# Grant Key Vault Secrets User role (read-only)
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $OTHER_USER_ID \
  --scope $(az keyvault show --name $KEY_VAULT_NAME --query id -o tsv)

# Or grant Key Vault Secrets Officer role (full access)
az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee $OTHER_USER_ID \
  --scope $(az keyvault show --name $KEY_VAULT_NAME --query id -o tsv)
```

---

## Using Secrets in Kubernetes

### Option 1: Manual Copy (Current Method)

Use the provided script to copy secrets from Key Vault to Kubernetes:

```bash
cd infrastructure/bicep

# Set Key Vault name (or let script find it)
export KEY_VAULT_NAME=fastazure-dev-kv-abc123xyz

# Create Kubernetes secrets
./create-k8s-secrets.sh
```

**What it does:**
1. Retrieves all secrets from Key Vault
2. Creates Kubernetes secret `fastazure-secrets` in `fastazure` namespace
3. Verifies secret creation

**Result:**
```
✓ Kubernetes secret created: fastazure-secrets

Secrets have been created in Kubernetes namespace: fastazure
```

### Option 2: CSI Secret Store Driver (Advanced)

For automatic secret sync and rotation:

**1. Install CSI Driver:**
```bash
# Enable CSI driver on AKS
az aks addon enable \
  --resource-group fastazure-rg \
  --name fastazure-dev-aks \
  --addon azure-keyvault-secrets-provider
```

**2. Create SecretProviderClass:**
```yaml
# infrastructure/k8s/secret-provider.yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: azure-keyvault-secrets
  namespace: fastazure
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    useVMManagedIdentity: "true"
    userAssignedIdentityID: <kubelet-identity-client-id>
    keyvaultName: <your-keyvault-name>
    tenantId: <your-tenant-id>
    objects: |
      array:
        - |
          objectName: mongodb-uri
          objectType: secret
        - |
          objectName: azure-client-id
          objectType: secret
        - |
          objectName: azure-tenant-id
          objectType: secret
        - |
          objectName: azure-api-scope
          objectType: secret
```

**3. Mount in Pod:**
```yaml
volumes:
  - name: secrets-store
    csi:
      driver: secrets-store.csi.k8s.io
      readOnly: true
      volumeAttributes:
        secretProviderClass: azure-keyvault-secrets

volumeMounts:
  - name: secrets-store
    mountPath: "/mnt/secrets-store"
    readOnly: true
```

---

## Managing Secrets

### List All Secrets

```bash
az keyvault secret list \
  --vault-name $KEY_VAULT_NAME \
  --query "[].name" -o table
```

### Get Secret Value

```bash
az keyvault secret show \
  --vault-name $KEY_VAULT_NAME \
  --name mongodb-uri \
  --query "value" -o tsv
```

### Set/Update Secret

```bash
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name my-new-secret \
  --value "my-secret-value"
```

### Delete Secret (Soft Delete)

```bash
# Soft delete (can be recovered)
az keyvault secret delete \
  --vault-name $KEY_VAULT_NAME \
  --name my-secret

# View deleted secrets
az keyvault secret list-deleted \
  --vault-name $KEY_VAULT_NAME

# Recover deleted secret
az keyvault secret recover \
  --vault-name $KEY_VAULT_NAME \
  --name my-secret

# Purge (permanent deletion, only if purge protection is off)
az keyvault secret purge \
  --vault-name $KEY_VAULT_NAME \
  --name my-secret
```

### Update Secret Version

Key Vault maintains version history:

```bash
# Set new version
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name mongodb-uri \
  --value "new-connection-string"

# List all versions
az keyvault secret list-versions \
  --vault-name $KEY_VAULT_NAME \
  --name mongodb-uri

# Get specific version
az keyvault secret show \
  --vault-name $KEY_VAULT_NAME \
  --name mongodb-uri \
  --version <version-id>
```

---

## Security Best Practices

### 1. Enable Soft Delete (Already Enabled)

```bicep
enableSoftDelete: true
softDeleteRetentionInDays: 90
```

Protects against accidental deletion.

### 2. Enable Purge Protection (Production Only)

```bicep
enablePurgeProtection: environment == 'prod' ? true : false
```

Prevents permanent deletion even by administrators.

### 3. Use RBAC Instead of Access Policies

```bicep
enableRbacAuthorization: true
```

Modern, fine-grained access control.

### 4. Restrict Network Access (Production)

```bicep
publicNetworkAccess: 'Disabled'
networkAcls: {
  defaultAction: 'Deny'
  virtualNetworkRules: [
    {
      id: vnet.properties.subnets[0].id
    }
  ]
}
```

Only allow access from AKS VNet.

### 5. Enable Diagnostic Logging

```bash
# Enable logging to Log Analytics
az monitor diagnostic-settings create \
  --name key-vault-logs \
  --resource $(az keyvault show --name $KEY_VAULT_NAME --query id -o tsv) \
  --workspace $(az monitor log-analytics workspace show --resource-group fastazure-rg --workspace-name fastazure-dev-logs --query id -o tsv) \
  --logs '[{"category": "AuditEvent","enabled": true}]'
```

### 6. Rotate Secrets Regularly

```bash
# Update secret
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name azure-client-id \
  --value "new-client-id"

# Update Kubernetes (if using manual method)
cd infrastructure/bicep
./create-k8s-secrets.sh

# Restart pods to pick up new secrets
kubectl rollout restart deployment/backend -n fastazure
kubectl rollout restart deployment/frontend -n fastazure
```

### 7. Never Hardcode Secrets

❌ **Bad:**
```python
mongodb_uri = "mongodb+srv://user:password@server"
```

✅ **Good:**
```python
mongodb_uri = os.getenv("MONGODB_URI")
```

### 8. Use Least Privilege

Grant only the minimum required permissions:
- **Read-only** for applications (Secrets User)
- **Full access** only for administrators (Secrets Officer)

---

## Troubleshooting

### Error: "The user or application does not have secrets list permission"

**Solution:**
```bash
# Grant yourself Secrets User role
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $(az ad signed-in-user show --query id -o tsv) \
  --scope $(az keyvault show --name $KEY_VAULT_NAME --query id -o tsv)
```

### Error: "Secret not found"

**Solution:**
```bash
# List all secrets to check name
az keyvault secret list --vault-name $KEY_VAULT_NAME --query "[].name" -o table

# Secret names are case-sensitive
az keyvault secret show --vault-name $KEY_VAULT_NAME --name mongodb-uri
```

### Error: "Kubernetes pods can't access secrets"

**Solution:**
```bash
# Check if secrets exist in Kubernetes
kubectl get secret fastazure-secrets -n fastazure

# If not, run the script
cd infrastructure/bicep
./create-k8s-secrets.sh

# Restart pods
kubectl rollout restart deployment/backend -n fastazure
```

### View Audit Logs

```bash
# Query Key Vault access logs
az monitor log-analytics query \
  --workspace <workspace-id> \
  --analytics-query "AzureDiagnostics | where ResourceProvider == 'MICROSOFT.KEYVAULT' | take 100"
```

---

## Integration with Makefile

The infrastructure Makefile includes Key Vault commands:

```bash
cd infrastructure

# View all secrets
make kv-list

# Get MongoDB connection string
make kv-get-mongo

# Create Kubernetes secrets from Key Vault
make kv-to-k8s
```

(Add these to `infrastructure/Makefile` for convenience)

---

## Summary

Azure Key Vault provides:
- ✅ Automatic secret storage during deployment
- ✅ Secure access control with RBAC
- ✅ Integration with AKS pods
- ✅ Audit logging and compliance
- ✅ Version history and soft delete
- ✅ Easy secret rotation

**Next Steps:**
1. Deploy infrastructure with `./deploy.sh`
2. Verify secrets: `az keyvault secret list --vault-name <name>`
3. Copy to Kubernetes: `./create-k8s-secrets.sh`
4. Deploy application: `kubectl apply -f infrastructure/k8s/`

---

For more information, see:
- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [AKS + Key Vault Integration](https://docs.microsoft.com/en-us/azure/aks/csi-secrets-store-driver)
- [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) - Complete deployment guide

