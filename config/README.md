# Configuration Management

This directory contains centralized configuration for the Fast Azure application.

## Files

### `azure-config.json`

Central configuration file containing:

- **Azure Settings**: Tenant ID, subscription, resource group, location
- **Azure AD Apps**: Frontend and backend app client IDs and scopes
- **Deployment**: Frontend IP, CORS origins
- **Resources**: ACR name, AKS cluster name

## Usage

### 1. View Current Configuration

```bash
cat config/azure-config.json | jq .
```

### 2. Sync to GitHub Secrets

```bash
./scripts/sync-config.sh
```

This will:
- Read `azure-config.json`
- Display current configuration
- Prompt to sync to GitHub repository secrets
- Update the secrets used by CI/CD pipeline

### 3. Update Configuration

1. Edit `config/azure-config.json` with new values
2. Run `./scripts/sync-config.sh` to sync to GitHub
3. Commit and push changes

```bash
git add config/azure-config.json
git commit -m "Update Azure AD configuration"
git push origin main
```

## Configuration Values

### Azure AD App IDs

**Frontend App:** `fast-azure-frontend`
- Used for user authentication in the React app
- Configured with redirect URIs for the frontend

**Backend App:** `fast-azure-backend`
- Exposes API scope: `user_impersonation`
- Backend validates tokens issued for this app

### Deployment

The `deployment.frontendPublicIp` is automatically retrieved during GitHub Actions workflow and used to configure:
- Azure AD redirect URIs
- CORS origins
- Frontend API base URL

## Security Notes

⚠️ **This file contains non-sensitive configuration only:**
- Client IDs (public)
- Tenant IDs (public)
- Resource names (public)

🔒 **Sensitive values are stored in:**
- **GitHub Secrets**: Used during CI/CD
- **Azure Key Vault**: Used by deployed applications
- **Never commit**: Connection strings, passwords, keys

## Integration with CI/CD

The GitHub Actions workflow (`.github/workflows/deploy.yml`) uses these values:

```yaml
VITE_AZURE_CLIENT_ID: ${{ secrets.VITE_AZURE_CLIENT_ID }}
VITE_AZURE_TENANT_ID: ${{ secrets.VITE_AZURE_TENANT_ID }}
VITE_AZURE_API_SCOPE: ${{ secrets.VITE_AZURE_API_SCOPE }}
```

These secrets are synced from `azure-config.json` using the sync script.

## Troubleshooting

### Config file not found
```bash
# Verify the file exists
ls -la config/azure-config.json
```

### jq not installed
```bash
# Install jq
sudo apt-get update && sudo apt-get install -y jq
```

### GitHub CLI not authenticated
```bash
# Login to GitHub CLI
gh auth login
```

## Example Configuration

```json
{
  "azure": {
    "tenantId": "your-tenant-id",
    "subscriptionId": "your-subscription-id",
    "resourceGroup": "fastazure-rg",
    "location": "eastus2"
  },
  "azureAd": {
    "frontend": {
      "clientId": "your-frontend-client-id"
    },
    "backend": {
      "clientId": "your-backend-client-id",
      "apiScope": "api://your-backend-client-id/user_impersonation"
    }
  }
}
```

