# 🔧 Fixing GitHub OIDC Authentication

## ❌ The Problem

Your GitHub Actions workflow failed with:

```
Error: AADSTS70025: The client '93aa5068-...'(fast-azure-backend) has no configured federated identity credentials.
```

**Root Cause:** The workflow is using your **Azure AD Application** client ID instead of the **Managed Identity** client ID that needs to be created for GitHub OIDC.

---

## 🚀 The Solution

### Step 1: Deploy Infrastructure (IN PROGRESS)

I've started the infrastructure deployment which will create:

1. ✅ **Managed Identity** for GitHub Actions  
2. ✅ **Federated Credential** linking GitHub → Azure  
3. ✅ **Role Assignments** for ACR, Key Vault, AKS  
4. ✅ **AKS with Workload Identity** enabled  
5. ✅ **Key Vault** with secrets  
6. ✅ **ACR** for container images  
7. ✅ **Cosmos DB** for MongoDB  

**Status:** Deployment running in background (takes 10-15 minutes)

### Step 2: Check Deployment Status

```bash
# Check if deployment is complete
az deployment group list --resource-group fastazure-rg --output table

# Or watch the deployment
az deployment group show \
  --resource-group fastazure-rg \
  --name main \
  --query properties.provisioningState
```

### Step 3: Get the NEW Client ID

After deployment completes:

```bash
cd infrastructure/bicep

# This will show all the outputs including the NEW client ID
az deployment group show \
  --resource-group fastazure-rg \
  --name main \
  --query properties.outputs
```

Look for:
- `githubIdentityClientId` - This is the NEW client ID for GitHub Actions
- `githubIdentityName` - The identity name
- `aksOidcIssuerUrl` - The OIDC issuer URL

### Step 4: Update GitHub Secrets

**IMPORTANT:** You need to REPLACE the `AZURE_CLIENT_ID` secret with the NEW one:

```bash
# Get the new client ID from deployment output
NEW_CLIENT_ID=$(az deployment group show \
  --resource-group fastazure-rg \
  --name main \
  --query properties.outputs.githubIdentityClientId.value \
  -o tsv)

# Update GitHub secret
gh secret set AZURE_CLIENT_ID \
  --body "$NEW_CLIENT_ID" \
  --repo Alkeme-Insurance/fast_azure

# Verify
gh secret list --repo Alkeme-Insurance/fast_azure
```

---

## 🔍 Understanding the Two Client IDs

### Old Client ID (Azure AD Application)
```
93aa5068-cdd5-48df-99fb-01407ae51271
```
- **Purpose:** Azure AD authentication for the frontend/backend
- **Use:** `VITE_AZURE_CLIENT_ID` (for user login)
- **NOT for:** GitHub Actions OIDC

### New Client ID (Managed Identity)
```
<will be shown after deployment>
```
- **Purpose:** GitHub Actions authentication to Azure
- **Use:** `AZURE_CLIENT_ID` (for GitHub Actions)
- **Has:** Federated credential for GitHub OIDC

---

## 📊 Current Status

### What's Deployed
- ❓ Resource Group: `fastazure-rg` (exists)
- 🔄 **IN PROGRESS:** All infrastructure resources

### What Needs to be Updated
- ✅ GitHub Secrets: Update `AZURE_CLIENT_ID`  
- ✅ Workflow: Already configured correctly  
- ✅ Code: Already pushed to GitHub  

---

## 🎯 Next Steps (After Deployment Completes)

### 1. Verify Deployment

```bash
# Check deployment status
az deployment group show \
  --resource-group fastazure-rg \
  --name main \
  --query properties.provisioningState

# Should output: "Succeeded"
```

### 2. Get Deployment Outputs

```bash
cd infrastructure/bicep

# Run the deployment script's output section
az deployment group show \
  --resource-group fastazure-rg \
  --name main \
  --query properties.outputs \
  --output json > deployment-outputs.json

# View outputs
cat deployment-outputs.json | jq
```

### 3. Update GitHub Secrets

```bash
# Extract the new client ID
NEW_CLIENT_ID=$(cat deployment-outputs.json | jq -r '.githubIdentityClientId.value')

echo "New Client ID for GitHub Actions: $NEW_CLIENT_ID"

# Update GitHub secret
gh secret set AZURE_CLIENT_ID \
  --body "$NEW_CLIENT_ID" \
  --repo Alkeme-Insurance/fast_azure

echo "✅ GitHub secret updated!"
```

### 4. Trigger GitHub Actions

```bash
# Make a small change and push
git add .
git commit -m "Update infrastructure deployment" --allow-empty
git push origin main

# Watch the workflow
gh run watch --repo Alkeme-Insurance/fast_azure
```

---

## 🔐 Secret Configuration Summary

After everything is configured:

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `AZURE_CLIENT_ID` | **NEW** Managed Identity ID | GitHub Actions → Azure |
| `AZURE_TENANT_ID` | `79e26e89-...` | Azure AD Tenant |
| `AZURE_SUBSCRIPTION_ID` | `d109d600-...` | Azure Subscription |
| `VITE_AZURE_CLIENT_ID` | `93aa5068-...` (**OLD**) | Frontend user login |
| `VITE_AZURE_TENANT_ID` | `79e26e89-...` | Frontend tenant |
| `VITE_AZURE_API_SCOPE` | `api://93aa...` | Frontend API scope |

**Key Point:** `AZURE_CLIENT_ID` ≠ `VITE_AZURE_CLIENT_ID`  
- One is for **GitHub Actions** (Managed Identity)  
- One is for **Frontend Users** (Azure AD App)

---

## 🐛 Troubleshooting

### Deployment Taking Too Long

```bash
# Check deployment progress
az deployment group show \
  --resource-group fastazure-rg \
  --name main \
  --query properties.{status:provisioningState,progress:properties.outputs}

# Check resource creation
az resource list --resource-group fastazure-rg --output table
```

### Deployment Failed

```bash
# Get error details
az deployment group show \
  --resource-group fastazure-rg \
  --name main \
  --query properties.error

# Delete and retry
az group delete --name fastazure-rg --yes --no-wait

# Wait a few minutes, then redeploy
cd infrastructure/bicep
export GITHUB_REPOSITORY="Alkeme-Insurance/fast_azure"
./deploy.sh
```

### GitHub Actions Still Failing

1. **Verify federated credential exists:**
   ```bash
   az identity federated-credential list \
     --identity-name fastazure-dev-github-identity \
     --resource-group fastazure-rg
   ```

2. **Verify role assignments:**
   ```bash
   IDENTITY_PRINCIPAL_ID=$(az identity show \
     --name fastazure-dev-github-identity \
     --resource-group fastazure-rg \
     --query principalId -o tsv)
   
   az role assignment list --assignee $IDENTITY_PRINCIPAL_ID
   ```

3. **Verify GitHub secret is updated:**
   ```bash
   gh secret list --repo Alkeme-Insurance/fast_azure | grep AZURE_CLIENT_ID
   ```

---

## 📚 Related Documentation

- **[GITHUB_SECRETS_CONFIGURED.md](./GITHUB_SECRETS_CONFIGURED.md)** - GitHub secrets guide
- **[infrastructure/GITHUB_OIDC_GUIDE.md](./infrastructure/GITHUB_OIDC_GUIDE.md)** - Complete OIDC guide
- **[infrastructure/AZURE_DEPLOYMENT.md](./infrastructure/AZURE_DEPLOYMENT.md)** - Deployment guide

---

## ⏱️ Timeline

1. **Now:** Infrastructure deployment running (10-15 min)
2. **After deployment:** Get new client ID and update GitHub secret
3. **Trigger workflow:** Push code or manually trigger
4. **Success:** GitHub Actions deploys to Azure! 🎉

---

**Check back in 10-15 minutes to complete the setup!**
