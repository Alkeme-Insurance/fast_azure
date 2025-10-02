# Azure Deployment Guide (ACR + AKS)

This guide walks you through deploying Fast Azure to Azure Kubernetes Service (AKS) with Azure Container Registry (ACR).

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Step 1: Deploy Infrastructure](#step-1-deploy-infrastructure-with-bicep)
- [Step 2: Build and Push Images](#step-2-build-and-push-images-to-acr)
- [Step 3: Configure Kubernetes](#step-3-configure-kubernetes-secrets)
- [Step 4: Deploy to AKS](#step-4-deploy-application-to-aks)
- [Step 5: Verify Deployment](#step-5-verify-deployment)
- [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
- [Clean Up](#clean-up)

---

## Prerequisites

### Tools Required

```bash
# Azure CLI (2.50+)
az --version

# Docker
docker --version

# kubectl
kubectl version --client

# (Optional) Bicep CLI
az bicep version
```

### Azure Account

- Active Azure subscription
- Contributor or Owner role on subscription
- Azure AD permissions to create app registrations (for authentication)

### Install Tools

```bash
# Install Azure CLI (if not installed)
# Mac:
brew install azure-cli

# Linux:
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Windows:
# Download from https://aka.ms/installazurecliwindows

# Install kubectl
az aks install-cli

# Login to Azure
az login
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Azure Cloud                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  AKS Cluster (fastazure-dev-aks)                   │    │
│  │                                                     │    │
│  │  ┌──────────────┐      ┌──────────────┐          │    │
│  │  │   Frontend   │      │   Backend    │          │    │
│  │  │   (Nginx)    │──────│   (FastAPI)  │          │    │
│  │  │   Pods: 2    │      │   Pods: 3    │          │    │
│  │  └──────────────┘      └──────────────┘          │    │
│  │         │                      │                   │    │
│  │         │                      │                   │    │
│  │  ┌──────▼──────────────────────▼────────────┐    │    │
│  │  │        Load Balancer (Public IP)          │    │    │
│  │  └────────────────────────────────────────────┘    │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                               │
│                              │                               │
│  ┌───────────────────────────▼──────────────┐              │
│  │  Cosmos DB for MongoDB (Serverless)      │              │
│  │  - Database: appdb                        │              │
│  │  - Collections: projects, boards, etc.    │              │
│  └──────────────────────────────────────────┘              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ACR (fastazuredevacr)                             │    │
│  │  - fastazure-backend:latest                        │    │
│  │  - fastazure-frontend:latest                       │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Log Analytics Workspace                           │    │
│  │  - Container Insights                              │    │
│  │  - Logs and Metrics                                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Resources Created:**
- **AKS Cluster**: Managed Kubernetes with 2-3 nodes
- **ACR**: Private container registry
- **Cosmos DB**: Managed MongoDB-compatible database
- **Virtual Network**: Network isolation for AKS
- **Log Analytics**: Monitoring and logging

---

## Step 1: Deploy Infrastructure with Bicep

### Option A: Using the Deployment Script (Recommended)

```bash
cd infrastructure/bicep

# Set environment variables (optional)
export RESOURCE_GROUP="fastazure-rg"
export LOCATION="eastus"
export ENVIRONMENT="dev"

# Run deployment script
./deploy.sh
```

The script will:
1. Check prerequisites
2. Create resource group
3. Deploy all infrastructure
4. Display next steps with credentials

**Estimated time:** 10-15 minutes

### Option B: Manual Deployment

```bash
cd infrastructure/bicep

# Get your Azure AD Object ID
ADMIN_OBJECT_ID=$(az ad signed-in-user show --query id -o tsv)
echo "Your Object ID: $ADMIN_OBJECT_ID"

# Create resource group
az group create \
  --name fastazure-rg \
  --location eastus

# Deploy infrastructure
az deployment group create \
  --resource-group fastazure-rg \
  --template-file main.bicep \
  --parameters adminObjectId=$ADMIN_OBJECT_ID \
  --parameters environment=dev \
  --parameters location=eastus
```

### Verify Deployment

```bash
# List all resources
az resource list --resource-group fastazure-rg --output table

# Get outputs
az deployment group show \
  --resource-group fastazure-rg \
  --name <deployment-name> \
  --query properties.outputs
```

---

## Step 2: Build and Push Images to ACR

### Get ACR Name

```bash
# From deployment outputs
ACR_NAME=$(az deployment group show \
  --resource-group fastazure-rg \
  --name <deployment-name> \
  --query properties.outputs.acrName.value -o tsv)

ACR_LOGIN_SERVER=$(az deployment group show \
  --resource-group fastazure-rg \
  --name <deployment-name> \
  --query properties.outputs.acrLoginServer.value -o tsv)

echo "ACR: $ACR_NAME"
echo "Login Server: $ACR_LOGIN_SERVER"
```

### Login to ACR

```bash
az acr login --name $ACR_NAME
```

### Build and Push Backend

```bash
# From project root
cd /home/jharris/workspace/fast_azure

# Build backend image
docker build \
  -t $ACR_LOGIN_SERVER/fastazure-backend:latest \
  -f backend/Dockerfile \
  .

# Push to ACR
docker push $ACR_LOGIN_SERVER/fastazure-backend:latest
```

### Build and Push Frontend

```bash
# Build frontend image with production env vars
docker build \
  -t $ACR_LOGIN_SERVER/fastazure-frontend:latest \
  -f frontend/Dockerfile \
  --build-arg VITE_API_BASE_URL=http://backend-service:8000 \
  --build-arg VITE_AZURE_CLIENT_ID=$VITE_AZURE_CLIENT_ID \
  --build-arg VITE_AZURE_TENANT_ID=$VITE_AZURE_TENANT_ID \
  --build-arg VITE_DEV_NO_AUTH=false \
  .

# Push to ACR
docker push $ACR_LOGIN_SERVER/fastazure-frontend:latest
```

### Verify Images

```bash
# List images in ACR
az acr repository list --name $ACR_NAME --output table

# Show tags
az acr repository show-tags \
  --name $ACR_NAME \
  --repository fastazure-backend \
  --output table
```

---

## Step 3: Configure Kubernetes Secrets

### Connect to AKS

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group fastazure-rg \
  --name fastazure-dev-aks

# Verify connection
kubectl get nodes
```

### Get MongoDB Connection String

```bash
# From Cosmos DB
COSMOS_CONNECTION=$(az deployment group show \
  --resource-group fastazure-rg \
  --name <deployment-name> \
  --query properties.outputs.cosmosConnectionString.value -o tsv)

echo "MongoDB URI: $COSMOS_CONNECTION"
```

### Create Kubernetes Secrets

```bash
# Create namespace first
kubectl apply -f infrastructure/k8s/namespace.yaml

# Create secrets
kubectl create secret generic fastazure-secrets \
  --namespace=fastazure \
  --from-literal=mongodb-uri="$COSMOS_CONNECTION" \
  --from-literal=azure-client-id="$VITE_AZURE_CLIENT_ID" \
  --from-literal=azure-tenant-id="$VITE_AZURE_TENANT_ID" \
  --from-literal=azure-api-scope="$VITE_AZURE_API_SCOPE"

# Verify secrets
kubectl get secrets -n fastazure
```

---

## Step 4: Deploy Application to AKS

### Update Image References

Edit Kubernetes manifests to use your ACR:

```bash
# Update backend deployment
sed -i "s|<ACR_LOGIN_SERVER>|$ACR_LOGIN_SERVER|g" \
  infrastructure/k8s/backend-deployment.yaml

# Update frontend deployment
sed -i "s|<ACR_LOGIN_SERVER>|$ACR_LOGIN_SERVER|g" \
  infrastructure/k8s/frontend-deployment.yaml
```

### Deploy All Resources

```bash
# Apply all manifests
kubectl apply -f infrastructure/k8s/

# Or apply individually:
kubectl apply -f infrastructure/k8s/namespace.yaml
kubectl apply -f infrastructure/k8s/configmap.yaml
kubectl apply -f infrastructure/k8s/backend-deployment.yaml
kubectl apply -f infrastructure/k8s/frontend-deployment.yaml
kubectl apply -f infrastructure/k8s/hpa.yaml
```

### Wait for Deployment

```bash
# Watch pods come up
kubectl get pods -n fastazure --watch

# Check deployment status
kubectl rollout status deployment/backend -n fastazure
kubectl rollout status deployment/frontend -n fastazure
```

---

## Step 5: Verify Deployment

### Check Pod Status

```bash
# List all pods
kubectl get pods -n fastazure

# Expected output:
# NAME                        READY   STATUS    RESTARTS   AGE
# backend-xxxxx-xxxxx         1/1     Running   0          2m
# backend-xxxxx-xxxxx         1/1     Running   0          2m
# backend-xxxxx-xxxxx         1/1     Running   0          2m
# frontend-xxxxx-xxxxx        1/1     Running   0          2m
# frontend-xxxxx-xxxxx        1/1     Running   0          2m
```

### Check Services

```bash
# Get services
kubectl get svc -n fastazure

# Get external IP (may take a few minutes)
kubectl get svc frontend-service -n fastazure -w
```

### Test Application

```bash
# Get frontend external IP
EXTERNAL_IP=$(kubectl get svc frontend-service -n fastazure \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "Application URL: http://$EXTERNAL_IP"

# Test backend health
BACKEND_IP=$(kubectl get svc backend-service -n fastazure \
  -o jsonpath='{.spec.clusterIP}')

kubectl run -it --rm debug \
  --image=curlimages/curl \
  --restart=Never \
  -- curl http://backend-service.fastazure:8000/health
```

### View Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n fastazure

# Frontend logs
kubectl logs -f deployment/frontend -n fastazure

# Logs from specific pod
kubectl logs -f <pod-name> -n fastazure
```

---

## Monitoring and Troubleshooting

### View Logs in Azure Portal

1. Go to Azure Portal → Your AKS cluster
2. Navigate to **Insights** → **Containers**
3. View real-time metrics and logs

### Common Issues

#### Pods in CrashLoopBackOff

```bash
# Describe pod to see error
kubectl describe pod <pod-name> -n fastazure

# Common causes:
# - Missing secrets (mongodb-uri)
# - Wrong image tag
# - Configuration errors
```

#### ImagePullBackOff

```bash
# Check if ACR authentication is working
kubectl describe pod <pod-name> -n fastazure

# Verify ACR role assignment
az role assignment list \
  --assignee $(az aks show \
    --resource-group fastazure-rg \
    --name fastazure-dev-aks \
    --query identityProfile.kubeletidentity.objectId -o tsv)
```

#### Can't Connect to MongoDB

```bash
# Verify secret exists
kubectl get secret fastazure-secrets -n fastazure -o yaml

# Check backend logs
kubectl logs deployment/backend -n fastazure | grep mongo
```

### Scale Deployment

```bash
# Manually scale
kubectl scale deployment backend --replicas=5 -n fastazure

# Auto-scaling is already configured via HPA
kubectl get hpa -n fastazure
```

### Update Deployment

```bash
# After pushing new image to ACR
kubectl rollout restart deployment/backend -n fastazure
kubectl rollout restart deployment/frontend -n fastazure

# Monitor rollout
kubectl rollout status deployment/backend -n fastazure
```

---

## Production Checklist

Before going to production:

- [ ] Enable HTTPS/TLS with cert-manager
- [ ] Configure custom domain with Azure DNS
- [ ] Set up Azure AD authentication (disable dev mode)
- [ ] Enable network policies
- [ ] Configure backup strategy for Cosmos DB
- [ ] Set up Azure Monitor alerts
- [ ] Review and adjust resource limits
- [ ] Enable pod security policies
- [ ] Configure egress firewall rules
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Enable Azure Policy for governance

---

## Clean Up

### Delete Kubernetes Resources

```bash
# Delete all resources in namespace
kubectl delete namespace fastazure
```

### Delete Azure Resources

```bash
# Delete entire resource group (WARNING: irreversible)
az group delete --name fastazure-rg --yes --no-wait

# Or delete specific resources
az aks delete \
  --resource-group fastazure-rg \
  --name fastazure-dev-aks \
  --yes --no-wait

az acr delete \
  --resource-group fastazure-rg \
  --name fastazuredevacr \
  --yes
```

---

## Cost Estimation

**Estimated Monthly Cost (Dev Environment):**

| Resource | SKU | Est. Cost |
|----------|-----|-----------|
| AKS (2 nodes) | Standard_D2s_v3 | ~$140/month |
| ACR | Standard | ~$20/month |
| Cosmos DB | Serverless | ~$25/month (with free tier) |
| Load Balancer | Standard | ~$20/month |
| Log Analytics | Pay-as-you-go | ~$10/month |
| **Total** | | **~$215/month** |

**Production (with HA):** ~$500-800/month

💡 **Cost Optimization Tips:**
- Use Azure Reserved Instances for 40% savings
- Enable auto-scaling to scale down during low usage
- Use Spot instances for non-critical workloads
- Set budget alerts in Azure Cost Management

---

## Next Steps

- [Set up CI/CD with GitHub Actions](./GITHUB_ACTIONS.md)
- [Configure custom domain and HTTPS](./CUSTOM_DOMAIN.md)
- [Set up monitoring and alerts](./MONITORING.md)
- [Implement backup and disaster recovery](./DR_PLAN.md)

---

**Need Help?** See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) for common issues and solutions.

