# Quick Reference - Azure Deployment

Fast commands for common operations.

## 🚀 Initial Deployment

```bash
# 1. Deploy all infrastructure
cd infrastructure
make deploy-infra

# 2. Get AKS credentials
make aks-creds

# 3. Build and push images
make push-all

# 4. Deploy to Kubernetes
make k8s-deploy

# 5. Get application URL
make get-url
```

## 🔄 Update Application

```bash
# After code changes
make update-app

# Or manually:
make push-backend      # Rebuild and push backend
make push-frontend     # Rebuild and push frontend
make k8s-restart       # Restart pods
```

## 📊 Check Status

```bash
# Infrastructure
make infra-status

# Kubernetes
make k8s-status

# Logs
make k8s-logs-backend
make k8s-logs-frontend

# Metrics
make metrics
```

## 🔧 Common Tasks

### Scale Application

```bash
# Scale backend to 5 replicas
make k8s-scale-backend REPLICAS=5

# Auto-scaling is enabled via HPA (2-10 replicas)
kubectl get hpa -n fastazure
```

### View Connection Strings

```bash
# MongoDB connection string
make db-connection

# Application URL
make get-url
```

### Access Pods

```bash
# Shell into backend
make shell-backend

# Shell into frontend
make shell-frontend

# Port forward for local testing
make port-forward-backend   # localhost:8000
make port-forward-frontend  # localhost:3000
```

### Container Registry

```bash
# List images
make acr-list

# Show tags
make acr-tags

# Login to ACR
make acr-login
```

## 🐛 Troubleshooting

### Pods not starting

```bash
# Check pod status
kubectl get pods -n fastazure

# Describe problematic pod
kubectl describe pod <pod-name> -n fastazure

# View logs
kubectl logs <pod-name> -n fastazure

# Common fixes:
# - Check secrets exist: kubectl get secrets -n fastazure
# - Verify image exists: make acr-list
# - Check resource limits: kubectl describe node
```

### Can't pull images

```bash
# Verify ACR integration
az aks check-acr \
  --resource-group fastazure-rg \
  --name fastazure-dev-aks \
  --acr $(make acr-name)

# Re-attach ACR
az aks update \
  --resource-group fastazure-rg \
  --name fastazure-dev-aks \
  --attach-acr $(make acr-name)
```

### Application not accessible

```bash
# Check service has external IP
kubectl get svc frontend-service -n fastazure

# If pending, check quota:
az vm list-usage --location eastus -o table

# Check load balancer:
kubectl describe svc frontend-service -n fastazure
```

## 🧹 Clean Up

```bash
# Delete Kubernetes resources only
make k8s-delete

# Delete all Azure resources (WARNING: irreversible)
make destroy-infra
```

## 💰 Cost Management

```bash
# View current costs
make infra-costs

# Stop cluster (keeps data)
az aks stop \
  --resource-group fastazure-rg \
  --name fastazure-dev-aks

# Start cluster
az aks start \
  --resource-group fastazure-rg \
  --name fastazure-dev-aks

# Scale down to save costs (dev only)
make k8s-scale-backend REPLICAS=1
kubectl scale deployment frontend --replicas=1 -n fastazure
```

## 📝 Useful Commands

### Kubectl Shortcuts

```bash
# Alias for faster typing
alias k="kubectl"
alias kn="kubectl -n fastazure"

# Watch pods
kn get pods -w

# Exec into pod
kn exec -it <pod-name> -- /bin/bash

# Copy files
kn cp <pod-name>:/path/to/file ./local-file

# Apply manifest
kn apply -f deployment.yaml

# Delete pod (will recreate)
kn delete pod <pod-name>
```

### Azure CLI Shortcuts

```bash
# List all resource groups
az group list -o table

# Show AKS cluster info
az aks show \
  --resource-group fastazure-rg \
  --name fastazure-dev-aks

# Get node resource group
az aks show \
  --resource-group fastazure-rg \
  --name fastazure-dev-aks \
  --query nodeResourceGroup -o tsv

# List all resources in RG
az resource list \
  --resource-group fastazure-rg \
  -o table
```

### Docker Commands

```bash
# List local images
docker images | grep fastazure

# Remove unused images
docker image prune -a

# Build without cache
docker build --no-cache -t image:tag .

# Tag image for ACR
docker tag local-image:tag $ACR_LOGIN_SERVER/image:tag
```

## 🔗 Important URLs

```bash
# Azure Portal
echo "https://portal.azure.com"

# AKS Dashboard (if enabled)
az aks browse \
  --resource-group fastazure-rg \
  --name fastazure-dev-aks

# Container Insights
echo "Azure Portal → AKS Cluster → Insights"

# Cosmos DB Data Explorer
echo "Azure Portal → Cosmos DB → Data Explorer"
```

## 📚 Documentation

- [Full Deployment Guide](./AZURE_DEPLOYMENT.md)
- [Troubleshooting](../TROUBLESHOOTING.md)
- [Main README](../README.md)

---

**Tip:** Run `make help` in the `infrastructure/` directory to see all available commands.

