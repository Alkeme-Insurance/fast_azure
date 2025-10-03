# 🚀 Quick Deploy to Azure

## ✅ Prerequisites Done
- ✅ Resource Group created: `fastazure-rg` in `eastus2`
- ✅ All resource groups cleaned up
- ✅ Template ready: `infrastructure/bicep/main.json`

---

## 🎯 Deploy Now (Choose One Method)

### Method 1: Azure Portal (RECOMMENDED - Avoids CLI Bug)

**Step 1: Open Portal Deployment**
```
https://portal.azure.com/#create/Microsoft.Template
```

**Step 2: Load Template**
1. Click "Build your own template in the editor"
2. Click "Load file"
3. Select: `infrastructure/bicep/main.json`
4. Click "Save"

**Step 3: Fill Parameters**

Copy these values exactly:

```
Subscription: (your subscription)
Resource Group: fastazure-rg
Region: East US 2

Settings:
- Environment: dev
- Location: eastus2
- Admin Object Id: f36d4365-feb7-412a-8293-87e82aea74e2
- Azure Client Id: 93aa5068-cdd5-48df-99fb-01407ae51271
- Azure Tenant Id: 79e26e89-11be-48b6-ad96-fca9c401382c
- Azure Api Scope: api://93aa5068-cdd5-48df-99fb-01407ae51271/.default
- Backend Cors Origins: ["http://localhost:3000","http://localhost:5173","http://localhost:8001"]
- Github Repository: Alkeme-Insurance/fast_azure
```

**Step 4: Deploy**
- Click "Review + create"
- Click "Create"
- Wait 10-15 minutes

---

### Method 2: Azure CLI (if the bug is fixed)

```bash
cd /home/jharris/workspace/fast_azure/infrastructure/bicep

# Try this simple deployment
az deployment group create \
  --resource-group fastazure-rg \
  --name fastazure-deployment \
  --template-file main.bicep \
  --parameters location=eastus2 \
  --parameters environment=dev \
  --parameters adminObjectId="f36d4365-feb7-412a-8293-87e82aea74e2" \
  --parameters azureClientId="93aa5068-cdd5-48df-99fb-01407ae51271" \
  --parameters azureTenantId="79e26e89-11be-48b6-ad96-fca9c401382c" \
  --parameters azureApiScope="api://93aa5068-cdd5-48df-99fb-01407ae51271/.default" \
  --parameters 'backendCorsOrigins=["http://localhost:3000","http://localhost:5173","http://localhost:8001"]' \
  --parameters githubRepository="Alkeme-Insurance/fast_azure"
```

If you get "ERROR: The content for this response was already consumed" → Use Portal (Method 1)

---

## 📊 Monitor Deployment

### Portal
- Go to: https://portal.azure.com
- Navigate to Resource Group: `fastazure-rg`
- Click "Deployments"
- Watch progress

### CLI
```bash
# List deployments
az deployment group list --resource-group fastazure-rg --output table

# Get latest deployment name
DEPLOYMENT_NAME=$(az deployment group list --resource-group fastazure-rg --query "[0].name" -o tsv)

# Watch it
watch -n 10 "az deployment group show --resource-group fastazure-rg --name \$DEPLOYMENT_NAME --query properties.provisioningState -o tsv"
```

---

## ✅ After Deployment (10-15 min)

### 1. Get GitHub Identity Client ID
```bash
# Get deployment name
DEPLOYMENT_NAME=$(az deployment group list --resource-group fastazure-rg --query "[0].name" -o tsv)

# Get outputs
az deployment group show \
  --resource-group fastazure-rg \
  --name $DEPLOYMENT_NAME \
  --query properties.outputs.githubIdentityClientId.value \
  -o tsv

# This is your NEW client ID for GitHub Actions!
```

### 2. Update GitHub Secret
```bash
# Replace <NEW_CLIENT_ID> with the value from step 1
NEW_CLIENT_ID="<paste-value-here>"

gh secret set AZURE_CLIENT_ID \
  --body "$NEW_CLIENT_ID" \
  --repo Alkeme-Insurance/fast_azure

# Verify
gh secret list --repo Alkeme-Insurance/fast_azure
```

### 3. Test GitHub Actions
```bash
git commit --allow-empty -m "Test with new managed identity"
git push origin main

# Watch it succeed!
gh run watch --repo Alkeme-Insurance/fast_azure --exit-status
```

---

## 🎉 Done!

Your infrastructure is deployed with:
- ✅ AKS with Workload Identity
- ✅ ACR for container images
- ✅ Cosmos DB for MongoDB
- ✅ Key Vault with secrets
- ✅ Managed Identity for GitHub OIDC
- ✅ All RBAC permissions configured

**GitHub Actions will now deploy automatically on every push!**

---

## 📚 More Info

- [DEPLOY_VIA_PORTAL.md](./DEPLOY_VIA_PORTAL.md) - Detailed Portal guide
- [FIXING_GITHUB_OIDC.md](./FIXING_GITHUB_OIDC.md) - Understanding the issue
- [GITHUB_ACTIONS_MONITORING.md](./GITHUB_ACTIONS_MONITORING.md) - Monitor workflows
