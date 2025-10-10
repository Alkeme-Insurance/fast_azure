# Fast Azure Documentation

Complete documentation for the Fast Azure full-stack application.

## 🚀 Getting Started

- **[Quick Start](QUICK_START.md)** - Get up and running quickly
- **[Quick Deploy](QUICK_DEPLOY.md)** - Fast deployment guide
- **[Local Development](LOCAL_DEVELOPMENT.md)** - Set up your local environment
- **[Docker Setup](DOCKER_SETUP.md)** - Docker configuration and usage

## 🔐 Security & Authentication

- **[Azure AD Setup](AZURE_AD_SETUP.md)** - Configure Azure Active Directory authentication
- **[HTTPS Setup](HTTPS_SETUP.md)** - **⭐ Custom domain and SSL configuration**
- **[Workload Identity Summary](WORKLOAD_IDENTITY_SUMMARY.md)** - Azure Workload Identity for Kubernetes

## ☁️ Azure Deployment

- **[Deployment Summary](DEPLOYMENT_SUMMARY.md)** - Complete deployment overview
- **[Deploy via Portal](DEPLOY_VIA_PORTAL.md)** - Azure Portal deployment guide
- **[Key Vault Summary](KEYVAULT_SUMMARY.md)** - Azure Key Vault configuration

## 🔧 CI/CD & GitHub

- **[GitHub Setup Complete](GITHUB_SETUP_COMPLETE.md)** - GitHub Actions configuration
- **[GitHub Secrets Configured](GITHUB_SECRETS_CONFIGURED.md)** - Required secrets setup
- **[GitHub Actions Monitoring](GITHUB_ACTIONS_MONITORING.md)** - Monitor deployments
- **[Fixing GitHub OIDC](FIXING_GITHUB_OIDC.md)** - OIDC troubleshooting

## 📊 Features

- **[KPI Dashboard](KPI_DASHBOARD_README.md)** - Key Performance Indicators dashboard
- **[Ticker](TICKER_README.md)** - Real-time metrics ticker
- **[Metrics Model](METRICS_MODEL.md)** - Data models and metrics

## 🛠️ Reference

- **[Makefile Reference](MAKEFILE_REFERENCE.md)** - Available make commands
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Deployment In Progress](DEPLOYMENT_IN_PROGRESS.md)** - Deployment status

## 📁 Configuration

For centralized configuration management, see:
- [`config/README.md`](../config/README.md) - Configuration management guide
- [`config/azure-config.json`](../config/azure-config.json) - Centralized settings

## 🔧 Scripts

Available automation scripts:
- `./scripts/setup-frontdoor.sh` - Deploy Azure Front Door with SSL
- `./scripts/configure-azure-ad-spa.sh` - Configure Azure AD as SPA
- `./scripts/sync-config.sh` - Sync configuration to GitHub secrets

## 🎯 Quick Links

### Custom Domain Setup
For instructions on setting up a custom domain with HTTPS, see:
**[HTTPS_SETUP.md](HTTPS_SETUP.md)** - Complete guide with:
- Azure Front Door setup (easiest)
- Let's Encrypt + cert-manager (free)
- Azure Application Gateway (enterprise)
- Custom domain configuration

### Main README
Return to the [main README](../README.md) for project overview and quick start.

---

## Document Organization

All documentation is organized in this `docs/` folder:

```
docs/
├── INDEX.md (this file)
├── HTTPS_SETUP.md ⭐ (custom domain instructions)
├── QUICK_START.md
├── LOCAL_DEVELOPMENT.md
├── AZURE_AD_SETUP.md
├── DEPLOYMENT_SUMMARY.md
├── TROUBLESHOOTING.md
└── ... (and more)
```

**Note:** For the most up-to-date custom domain and HTTPS setup instructions, always refer to **[HTTPS_SETUP.md](HTTPS_SETUP.md)**.

