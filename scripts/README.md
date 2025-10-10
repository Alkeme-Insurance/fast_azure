# Fast Azure Scripts

Automation scripts for setup, deployment, and configuration.

## 🚀 Deployment & Infrastructure

### `setup-frontdoor.sh`
Deploy Azure Front Door with managed SSL certificate.

```bash
./scripts/setup-frontdoor.sh
```

**What it does:**
- Creates Azure Front Door profile (Standard tier)
- Sets up endpoint with auto-generated hostname
- Configures origin group and backend
- Creates route with HTTPS redirect
- Provides managed SSL certificate (free)

**Output:** `https://fastazure-endpoint-<hash>.azurefd.net`

---

### `setup-github-oidc.sh`
Set up GitHub OIDC (OpenID Connect) authentication for Azure.

```bash
./scripts/setup-github-oidc.sh
```

**What it does:**
- Creates Azure Managed Identity
- Configures federated identity credentials
- Grants necessary permissions
- Updates GitHub secrets

**Use case:** Enable passwordless authentication from GitHub Actions to Azure

---

## 🔐 Azure AD Configuration

### `configure-azure-ad-spa.sh`
Configure Azure AD app registration as Single-Page Application.

```bash
./scripts/configure-azure-ad-spa.sh
```

**What it does:**
- Reads configuration from `config/azure-config.json`
- Updates Azure AD app to SPA type
- Sets proper redirect URIs
- Verifies configuration

**Required for:** MSAL.js authentication (fixes AADSTS9002326 error)

---

## ⚙️ Configuration Management

### `sync-config.sh`
Sync centralized configuration to GitHub secrets.

```bash
./scripts/sync-config.sh
```

**What it does:**
- Reads from `config/azure-config.json`
- Displays current configuration
- Prompts for confirmation
- Updates GitHub repository secrets

**Use case:** Keep GitHub secrets in sync with centralized config

---

## 🛠️ Local Development

### `setup-env.sh`
Interactive environment setup for local development.

```bash
./scripts/setup-env.sh
```

**What it does:**
- Creates `.env` file from template
- Prompts for configuration values
- Sets up local environment variables
- Validates configuration

**Use case:** First-time local setup

---

### `test-local-setup.sh`
Test local development environment.

```bash
./scripts/test-local-setup.sh
```

**What it does:**
- Checks Docker installation
- Validates environment variables
- Tests service connectivity
- Verifies configuration

**Use case:** Troubleshoot local setup issues

---

## 📊 Monitoring

### `monitor-deployment.sh`
Monitor GitHub Actions deployment progress.

```bash
./scripts/monitor-deployment.sh
```

**What it does:**
- Watches GitHub Actions workflow runs
- Displays real-time status
- Shows logs and errors
- Alerts on completion

**Use case:** Track deployment progress from CLI

---

## 📁 Script Organization

```
scripts/
├── README.md (this file)
│
├── Deployment & Infrastructure
│   ├── setup-frontdoor.sh
│   └── setup-github-oidc.sh
│
├── Azure AD Configuration
│   └── configure-azure-ad-spa.sh
│
├── Configuration Management
│   └── sync-config.sh
│
├── Local Development
│   ├── setup-env.sh
│   └── test-local-setup.sh
│
└── Monitoring
    └── monitor-deployment.sh
```

---

## 🎯 Common Workflows

### First-Time Setup
```bash
# 1. Set up local environment
./scripts/setup-env.sh

# 2. Set up GitHub OIDC for Azure
./scripts/setup-github-oidc.sh

# 3. Configure Azure AD as SPA
./scripts/configure-azure-ad-spa.sh

# 4. Deploy Azure Front Door for HTTPS
./scripts/setup-frontdoor.sh

# 5. Sync configuration to GitHub
./scripts/sync-config.sh
```

### Updating Configuration
```bash
# 1. Edit config/azure-config.json
nano config/azure-config.json

# 2. Sync to GitHub secrets
./scripts/sync-config.sh

# 3. Trigger deployment (via git push or manual)
```

### Troubleshooting
```bash
# Test local setup
./scripts/test-local-setup.sh

# Monitor deployment
./scripts/monitor-deployment.sh

# Reconfigure Azure AD if auth issues
./scripts/configure-azure-ad-spa.sh
```

---

## 📚 Related Documentation

- **Configuration:** [`config/README.md`](../config/README.md)
- **HTTPS Setup:** [`docs/HTTPS_SETUP.md`](../docs/HTTPS_SETUP.md)
- **Azure AD Setup:** [`docs/AZURE_AD_SETUP.md`](../docs/AZURE_AD_SETUP.md)
- **Deployment:** [`docs/DEPLOYMENT_SUMMARY.md`](../docs/DEPLOYMENT_SUMMARY.md)

---

## 🔧 Script Requirements

Most scripts require:
- Azure CLI (`az`) installed and authenticated
- GitHub CLI (`gh`) for GitHub-related scripts
- `jq` for JSON processing
- Bash shell

Install requirements:
```bash
# Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# GitHub CLI
sudo apt install gh

# jq
sudo apt install jq
```

---

## 🆘 Need Help?

For detailed instructions and troubleshooting:
- Browse documentation: [`docs/INDEX.md`](../docs/INDEX.md)
- View troubleshooting guide: [`docs/TROUBLESHOOTING.md`](../docs/TROUBLESHOOTING.md)
- Check main README: [`README.md`](../README.md)

