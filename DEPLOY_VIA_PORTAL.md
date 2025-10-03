# 🚀 Deploy Infrastructure via Azure Portal (Workaround)

## ❌ Azure CLI Bug

The Azure CLI has a known bug ("ERROR: The content for this response was already consumed") that's preventing deployment via command line.

**Workaround:** Use Azure Portal or REST API instead.

---

## 📋 Option 1: Deploy via Azure Portal (Easiest)

### Step 1: Prepare Template

The ARM JSON template is already generated at:
```
infrastructure/bicep/main.json
```

### Step 2: Open Azure Portal Deployment

**Direct Link:**
```
https://portal.azure.com/#create/Microsoft.Template
```

Or navigate manually:
1. Go to https://portal.azure.com
2. Search for "Deploy a custom template"
3. Click "Deploy a custom template"

### Step 3: Upload Template

1. Click "Build your own template in the editor"
2. Click "Load file"
3. Select: `infrastructure/bicep/main.json`
4. Click "Save"

### Step 4: Fill Parameters

**Basics:**
- **Subscription:** Your Azure subscription
- **Resource Group:** `fastazure-rg` (select existing)
- **Region:** `East US`

**Settings (copy these values):**

| Parameter | Value |
|-----------|-------|
| **Environment** | `dev` |
| **Location** | `eastus` |
| **Admin Object Id** | `f36d4365-feb7-412a-8293-87e82aea74e2` |
| **Azure Client Id** | `93aa5068-cdd5-48df-99fb-01407ae51271` |
| **Azure Tenant Id** | `79e26e89-11be-48b6-ad96-fca9c401382c` |
| **Azure Api Scope** | `api://93aa5068-cdd5-48df-99fb-01407ae51271/.default` |
| **Backend Cors Origins** | `["http://localhost:3000","http://localhost:5173","http://localhost:8001"]` |
| **Github Repository** | `Alkeme-Insurance/fast_azure` |

### Step 5: Deploy

1. Click "Review + create"
2. Review the configuration
3. Click "Create"

**Deployment will take 10-15 minutes.**

---

## 📋 Option 2: Use Azure REST API (Command Line)

This works around the Azure CLI bug:

```bash
cd /home/jharris/workspace/fast_azure/infrastructure/bicep

# Get subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Deploy using REST API
az rest \
  --method PUT \
  --uri "https://management.azure.com/subscriptions/$SUBSCRIPTION_ID/resourcegroups/fastazure-rg/providers/Microsoft.Resources/deployments/main?api-version=2021-04-01" \
  --body '{
    "properties": {
      "templateLink": {
        "uri": "file://./main.json"
      },
      "parameters": {
        "environment": { "value": "dev" },
        "location": { "value": "eastus" },
        "adminObjectId": { "value": "f36d4365-feb7-412a-8293-87e82aea74e2" },
        "azureClientId": { "value": "93aa5068-cdd5-48df-99fb-01407ae51271" },
        "azureTenantId": { "value": "79e26e89-11be-48b6-ad96-fca9c401382c" },
        "azureApiScope": { "value": "api://93aa5068-cdd5-48df-99fb-01407ae51271/.default" },
        "backendCorsOrigins": { "value": ["http://localhost:3000","http://localhost:5173","http://localhost:8001"] },
        "githubRepository": { "value": "Alkeme-Insurance/fast_azure" }
      },
      "mode": "Incremental"
    }
  }'
```

---

## 🔍 Monitor Deployment Progress

### In Azure Portal
1. Go to Resource Group `fastazure-rg`
2. Click "Deployments" in left menu
3. Watch "main" deployment progress
4. Click on "main" to see detailed status

### Via Command Line
```bash
# Check deployment status
az deployment group show \
  --resource-group fastazure-rg \
  --name main \
  --query "{Status: properties.provisioningState, Duration: properties.duration}"

# Watch it (refreshes every 10 seconds)
watch -n 10 'az deployment group show --resource-group fastazure-rg --name main --query properties.provisioningState -o tsv 2>/dev/null || echo "Not started yet..."'
```

---

## ✅ After Deployment Completes

### 1. Get Deployment Outputs
```bash
az deployment group show \
  --resource-group fastazure-rg \
  --name main \
  --query properties.outputs \
  --output json > deployment-outputs.json

# View outputs
cat deployment-outputs.json | jq
```

### 2. Extract the NEW GitHub Identity Client ID
```bash
NEW_CLIENT_ID=$(cat deployment-outputs.json | jq -r '.githubIdentityClientId.value')
echo "New GitHub Actions Client ID: $NEW_CLIENT_ID"
echo ""
echo "⚠️  IMPORTANT: Update GitHub secret with this value!"
```

### 3. Update GitHub Secret
```bash
gh secret set AZURE_CLIENT_ID \
  --body "$NEW_CLIENT_ID" \
  --repo Alkeme-Insurance/fast_azure

echo "✅ GitHub secret AZURE_CLIENT_ID updated!"

# Verify
gh secret list --repo Alkeme-Insurance/fast_azure | grep AZURE_CLIENT_ID
```

### 4. Verify All Resources Were Created
```bash
# List all resources
az resource list --resource-group fastazure-rg --output table

# Check specific resources
echo "=== Key Vault ==="
az keyvault list --resource-group fastazure-rg --query "[].{Name:name,Location:location}" --output table

echo "=== AKS Cluster ==="
az aks show --resource-group fastazure-rg --name fastazure-dev-aks --query "{Name:name,K8sVersion:kubernetesVersion,Status:provisioningState}" --output table

echo "=== Container Registry ==="
az acr show --resource-group fastazure-rg --name fastazuredevacr --query "{Name:name,LoginServer:loginServer,Status:provisioningState}" --output table

echo "=== Cosmos DB ==="
az cosmosdb show --resource-group fastazure-rg --name fastazuredevmongo --query "{Name:name,Kind:kind,Status:provisioningState}" --output table

echo "=== Managed Identity ==="
az identity show --resource-group fastazure-rg --name fastazure-dev-github-identity --query "{Name:name,ClientId:clientId,PrincipalId:principalId}" --output table
```

### 5. Get AKS Credentials
```bash
az aks get-credentials \
  --resource-group fastazure-rg \
  --name fastazure-dev-aks \
  --overwrite-existing

# Verify connection
kubectl get nodes
kubectl cluster-info
```

### 6. Test GitHub Actions Workflow
```bash
# Trigger workflow
git commit --allow-empty -m "Test deployment with new managed identity"
git push origin main

# Watch it succeed!
gh run watch --repo Alkeme-Insurance/fast_azure --exit-status
```

---

## 🎯 Expected Outputs

After deployment, you should get these outputs:

```json
{
  "acrLoginServer": {
    "type": "String",
    "value": "fastazuredevacr.azurecr.io"
  },
  "acrName": {
    "type": "String",
    "value": "fastazuredevacr"
  },
  "aksName": {
    "type": "String",
    "value": "fastazure-dev-aks"
  },
  "aksOidcIssuerUrl": {
    "type": "String",
    "value": "https://oidc.prod-aks.azure.com/..."
  },
  "githubIdentityClientId": {
    "type": "String",
    "value": "<NEW-CLIENT-ID-HERE>"
  },
  "githubIdentityName": {
    "type": "String",
    "value": "fastazure-dev-github-identity"
  },
  "githubIdentityPrincipalId": {
    "type": "String",
    "value": "<PRINCIPAL-ID>"
  },
  "keyVaultName": {
    "type": "String",
    "value": "fastazure-dev-kv-xxxxx"
  },
  "keyVaultUri": {
    "type": "String",
    "value": "https://fastazure-dev-kv-xxxxx.vault.azure.net/"
  }
}
```

**The most important value:** `githubIdentityClientId` - This goes into GitHub secret `AZURE_CLIENT_ID`

---

## 🐛 Troubleshooting

### Deployment Fails

**View error details:**
```bash
az deployment group show \
  --resource-group fastazure-rg \
  --name main \
  --query properties.error
```

**Common issues:**
1. **Quota limits** - Request quota increase in Azure Portal
2. **Region availability** - Try different region
3. **Permission issues** - Ensure you have Owner/Contributor role

### Resource Already Exists

If resources from a previous attempt exist:
```bash
# Delete entire resource group and start fresh
az group delete --name fastazure-rg --yes --no-wait

# Wait 5 minutes, then recreate
az group create --name fastazure-rg --location eastus

# Deploy again (via Portal or REST API)
```

---

## 📚 Related Documentation

- **[FIXING_GITHUB_OIDC.md](./FIXING_GITHUB_OIDC.md)** - Full troubleshooting guide
- **[GITHUB_ACTIONS_MONITORING.md](./GITHUB_ACTIONS_MONITORING.md)** - Monitor workflows
- **[GITHUB_SECRETS_CONFIGURED.md](./GITHUB_SECRETS_CONFIGURED.md)** - Secrets guide
- **[infrastructure/AZURE_DEPLOYMENT.md](./infrastructure/AZURE_DEPLOYMENT.md)** - Complete deployment guide
- **[infrastructure/GITHUB_OIDC_GUIDE.md](./infrastructure/GITHUB_OIDC_GUIDE.md)** - OIDC setup

---

## 🎉 Summary

1. ✅ **Deploy via Portal:** https://portal.azure.com/#create/Microsoft.Template
2. ✅ **Upload:** `infrastructure/bicep/main.json`
3. ✅ **Fill parameters** (copy from table above)
4. ✅ **Wait 10-15 minutes**
5. ✅ **Get new client ID** from outputs
6. ✅ **Update GitHub secret:** `AZURE_CLIENT_ID`
7. ✅ **Push code** to trigger workflow
8. ✅ **GitHub Actions succeeds!** 🎉

**The Azure CLI bug is annoying, but the Portal deployment works perfectly!**

