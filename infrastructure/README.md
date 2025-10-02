# Fast Azure - Infrastructure

Infrastructure as Code (IaC) for deploying Fast Azure to Azure Cloud using Bicep and Kubernetes.

## 📁 Directory Structure

```
infrastructure/
├── bicep/
│   ├── main.bicep              # Main Bicep template (ACR, AKS, Cosmos DB)
│   ├── main.bicepparam         # Parameters file
│   └── deploy.sh               # Deployment script
├── k8s/
│   ├── namespace.yaml          # Kubernetes namespace
│   ├── configmap.yaml          # Configuration
│   ├── secrets.yaml            # Secrets template
│   ├── backend-deployment.yaml # Backend deployment & service
│   ├── frontend-deployment.yaml# Frontend deployment & service
│   ├── ingress.yaml            # Ingress (optional)
│   └── hpa.yaml                # Horizontal Pod Autoscaler
├── Makefile                    # Common operations
├── AZURE_DEPLOYMENT.md         # Detailed deployment guide
├── QUICK_REFERENCE.md          # Quick command reference
└── README.md                   # This file
```

## 🏗️ What Gets Deployed

### Azure Resources (Bicep)

1. **Azure Container Registry (ACR)**
   - Private Docker image registry
   - SKU: Standard (dev) / Premium (prod)
   - Images: `fastazure-backend`, `fastazure-frontend`

2. **Azure Kubernetes Service (AKS)**
   - Managed Kubernetes cluster
   - Nodes: 2-3 x Standard_D2s_v3 VMs
   - Auto-scaling enabled (min: 1-3, max: 5-10)
   - Azure AD integration for RBAC

3. **Cosmos DB for MongoDB**
   - Serverless, MongoDB-compatible database
   - API version: 7.0
   - Free tier enabled for dev

4. **Virtual Network**
   - Isolated network for AKS
   - Subnet: 10.0.1.0/24
   - Service endpoints for ACR, Storage

5. **Log Analytics Workspace**
   - Container Insights for monitoring
   - 30-day log retention

### Kubernetes Resources

1. **Backend Deployment**
   - 3 replicas (FastAPI)
   - Resource limits: 500m CPU, 1Gi memory
   - Health checks configured
   - Auto-scaling: 2-10 pods

2. **Frontend Deployment**
   - 2 replicas (Nginx)
   - Resource limits: 200m CPU, 256Mi memory
   - Health checks configured
   - Auto-scaling: 2-5 pods

3. **Services**
   - Backend: ClusterIP (internal)
   - Frontend: LoadBalancer (external)

4. **ConfigMap & Secrets**
   - Environment variables
   - MongoDB connection string
   - Azure AD credentials

## 🚀 Quick Start

### Prerequisites

```bash
# Install required tools
brew install azure-cli kubectl

# Login to Azure
az login

# Set default subscription
az account set --subscription <subscription-id>
```

### Deploy Infrastructure

```bash
cd infrastructure

# Option 1: Use Makefile (recommended)
make deploy-infra

# Option 2: Use deployment script
cd bicep
./deploy.sh

# Option 3: Manual deployment
cd bicep
az deployment group create \
  --resource-group fastazure-rg \
  --template-file main.bicep \
  --parameters adminObjectId=$(az ad signed-in-user show --query id -o tsv)
```

### Build and Push Images

```bash
# From infrastructure directory
make push-all

# Or individually
make push-backend
make push-frontend
```

### Deploy to Kubernetes

```bash
# Get AKS credentials
make aks-creds

# Create secrets (replace with your values)
kubectl create secret generic fastazure-secrets \
  --namespace=fastazure \
  --from-literal=mongodb-uri='<connection-string>' \
  --from-literal=azure-client-id='<client-id>' \
  --from-literal=azure-tenant-id='<tenant-id>' \
  --from-literal=azure-api-scope='<scope>'

# Deploy application
make k8s-deploy

# Get application URL
make get-url
```

## 📖 Documentation

- **[AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)** - Complete deployment guide with detailed steps
- **[KEY_VAULT_GUIDE.md](./KEY_VAULT_GUIDE.md)** - Azure Key Vault secret management guide
- **[GITHUB_OIDC_GUIDE.md](./GITHUB_OIDC_GUIDE.md)** - GitHub Actions with Azure OIDC (passwordless CI/CD)
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick command reference for common tasks
- **[Bicep main.bicep](./bicep/main.bicep)** - Infrastructure template with inline documentation

## 🛠️ Common Operations

All commands assume you're in the `infrastructure/` directory.

### Infrastructure Management

```bash
make help                  # Show all available commands
make deploy-infra          # Deploy Azure resources
make infra-status          # Show resource status
make infra-costs           # Show current costs
make destroy-infra         # Delete all resources (WARNING)
```

### Container Registry

```bash
make acr-login            # Login to ACR
make acr-list             # List images
make acr-tags             # Show image tags
```

### Build & Deploy

```bash
make build-backend        # Build backend image
make build-frontend       # Build frontend image
make push-all             # Build and push all images
make update-app           # Update running application
```

### Kubernetes Operations

```bash
make k8s-deploy           # Deploy to AKS
make k8s-status           # Show deployment status
make k8s-logs-backend     # Show backend logs
make k8s-logs-frontend    # Show frontend logs
make k8s-restart          # Restart all pods
make k8s-scale-backend REPLICAS=5  # Scale backend
make k8s-delete           # Delete K8s resources
```

### Monitoring & Debugging

```bash
make metrics              # Show cluster metrics
make shell-backend        # Shell into backend pod
make shell-frontend       # Shell into frontend pod
make port-forward-backend # Forward backend to localhost:8000
make port-forward-frontend# Forward frontend to localhost:3000
```

### Database

```bash
make db-connection        # Show MongoDB connection string
make db-info              # Show Cosmos DB info
```

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Azure Cloud                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  AKS Cluster                                       │    │
│  │                                                     │    │
│  │  ┌──────────────┐      ┌──────────────┐          │    │
│  │  │   Frontend   │──────│   Backend    │          │    │
│  │  │   (2 pods)   │      │   (3 pods)   │          │    │
│  │  └──────┬───────┘      └──────┬───────┘          │    │
│  │         │                      │                   │    │
│  │         └──────────┬───────────┘                  │    │
│  │                    │                               │    │
│  │         ┌──────────▼──────────┐                   │    │
│  │         │   Load Balancer     │                   │    │
│  │         │   (Public IP)       │                   │    │
│  │         └─────────────────────┘                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                               │
│  ┌───────────────────────────▼──────────────┐              │
│  │  Cosmos DB for MongoDB                   │              │
│  └──────────────────────────────────────────┘              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ACR (Container Registry)                          │    │
│  │  - fastazure-backend:latest                        │    │
│  │  - fastazure-frontend:latest                       │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔒 Security Considerations

### Implemented

- ✅ Azure AD integration for AKS RBAC
- ✅ Private ACR with role-based access
- ✅ Network isolation via VNet
- ✅ Kubernetes secrets for sensitive data
- ✅ Resource limits on pods
- ✅ Health checks and liveness probes

### Recommended for Production

- [ ] Enable HTTPS/TLS with cert-manager
- [ ] Configure network policies
- [ ] Enable Azure Policy for governance
- [ ] Set up Azure Key Vault for secrets
- [ ] Enable pod security policies
- [ ] Configure egress firewall rules
- [ ] Enable Azure Defender for Kubernetes
- [ ] Set up backup strategy

## 💰 Cost Optimization

### Dev Environment (~$215/month)

```bash
# Stop cluster when not in use
az aks stop --resource-group fastazure-rg --name fastazure-dev-aks

# Scale down replicas
make k8s-scale-backend REPLICAS=1
kubectl scale deployment frontend --replicas=1 -n fastazure

# Use Azure Dev/Test pricing
# Enable Cosmos DB free tier (first 1000 RU/s free)
```

### Production Recommendations

- Use Azure Reserved Instances (40% savings)
- Enable auto-scaling to scale down during low usage
- Use Spot instances for non-critical workloads
- Set budget alerts in Azure Cost Management
- Monitor with Cost Analysis dashboard

## 🔄 CI/CD Integration

The infrastructure supports GitHub Actions for automated deployments. See:

- `.github/workflows/deploy-backend.yml`
- `.github/workflows/deploy-frontend.yml`

**Required Secrets in GitHub:**
- `AZURE_CREDENTIALS` - Service principal credentials
- `ACR_LOGIN_SERVER` - ACR login server URL
- `AKS_RESOURCE_GROUP` - Resource group name
- `AKS_CLUSTER_NAME` - AKS cluster name
- `MONGODB_URI` - MongoDB connection string
- `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_API_SCOPE` - Azure AD credentials

## 📊 Monitoring

### Azure Monitor

```bash
# View Container Insights
# Azure Portal → AKS → Insights

# Query logs
az monitor log-analytics query \
  --workspace <workspace-id> \
  --analytics-query "ContainerLog | where PodName contains 'backend' | take 100"
```

### Kubectl

```bash
# View metrics
kubectl top nodes
kubectl top pods -n fastazure

# View logs
kubectl logs -f deployment/backend -n fastazure --tail=100

# View events
kubectl get events -n fastazure --sort-by='.lastTimestamp'
```

## 🐛 Troubleshooting

### Common Issues

1. **Pods stuck in ImagePullBackOff**
   ```bash
   # Check ACR authentication
   kubectl describe pod <pod-name> -n fastazure
   
   # Re-attach ACR to AKS
   az aks update --resource-group fastazure-rg \
     --name fastazure-dev-aks \
     --attach-acr <acr-name>
   ```

2. **MongoDB connection errors**
   ```bash
   # Verify secret exists
   kubectl get secret fastazure-secrets -n fastazure -o yaml
   
   # Check connection string
   make db-connection
   ```

3. **Can't access application**
   ```bash
   # Check service status
   kubectl get svc -n fastazure
   
   # Check load balancer
   kubectl describe svc frontend-service -n fastazure
   ```

See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) for more solutions.

## 📝 Notes

### Bicep vs Terraform

We use **Bicep** because:
- Native Azure support (no state file management)
- Simpler syntax than ARM templates
- Better IDE support
- Automatic dependency resolution

If you prefer Terraform, the architecture is easily portable.

### Kubernetes vs App Service

We use **AKS** because:
- Full control over orchestration
- Better for microservices
- Cost-effective at scale
- Portability (can move to any K8s)

For simpler workloads, consider Azure App Service or Container Instances.

### Cosmos DB vs Managed MongoDB

We use **Cosmos DB** because:
- Serverless option (pay per request)
- Automatic scaling
- Global distribution ready
- 99.999% SLA

For cost-sensitive workloads, consider Azure Database for MongoDB or self-hosted MongoDB in AKS.

## 🔗 Useful Links

- [Azure Bicep Documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- [AKS Best Practices](https://docs.microsoft.com/en-us/azure/aks/best-practices)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Azure Container Registry](https://docs.microsoft.com/en-us/azure/container-registry/)
- [Cosmos DB for MongoDB](https://docs.microsoft.com/en-us/azure/cosmos-db/mongodb/introduction)

## 🤝 Contributing

When adding infrastructure changes:

1. Update Bicep templates
2. Test deployment in dev environment
3. Update documentation
4. Add cost estimates
5. Update Makefile commands if needed

---

**Need Help?** See [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) for detailed instructions or [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for quick commands.

