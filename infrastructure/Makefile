# ============================================
# Fast Azure - Infrastructure Makefile
# ============================================

# Variables
RESOURCE_GROUP ?= fastazure-rg
LOCATION ?= eastus
ENVIRONMENT ?= dev
PROJECT_NAME ?= fastazure
ACR_NAME ?= $(shell az deployment group show --resource-group $(RESOURCE_GROUP) --name $(DEPLOYMENT_NAME) --query properties.outputs.acrName.value -o tsv 2>/dev/null)
AKS_NAME ?= $(shell az deployment group show --resource-group $(RESOURCE_GROUP) --name $(DEPLOYMENT_NAME) --query properties.outputs.aksName.value -o tsv 2>/dev/null)
DEPLOYMENT_NAME ?= fastazure-deployment

# Colors
GREEN = \033[0;32m
YELLOW = \033[1;33m
NC = \033[0m # No Color

.PHONY: help
help: ## Show this help message
	@echo "Fast Azure Infrastructure Commands"
	@echo "===================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# ============================================
# Azure Infrastructure
# ============================================

.PHONY: deploy-infra
deploy-infra: ## Deploy Azure infrastructure (ACR, AKS, Cosmos DB)
	@echo "$(GREEN)Deploying infrastructure...$(NC)"
	cd bicep && ./deploy.sh

.PHONY: destroy-infra
destroy-infra: ## Delete all Azure resources (WARNING: irreversible)
	@echo "$(YELLOW)WARNING: This will delete all resources in $(RESOURCE_GROUP)$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		az group delete --name $(RESOURCE_GROUP) --yes --no-wait; \
		echo "$(GREEN)Deletion initiated$(NC)"; \
	fi

.PHONY: infra-status
infra-status: ## Show status of Azure resources
	@echo "$(GREEN)Resource Group: $(RESOURCE_GROUP)$(NC)"
	@az resource list --resource-group $(RESOURCE_GROUP) --output table

.PHONY: infra-costs
infra-costs: ## Show current month's costs
	@az consumption usage list --output table

# ============================================
# Container Registry (ACR)
# ============================================

.PHONY: acr-login
acr-login: ## Login to Azure Container Registry
	@echo "$(GREEN)Logging into ACR...$(NC)"
	az acr login --name $(ACR_NAME)

.PHONY: acr-list
acr-list: ## List images in ACR
	@echo "$(GREEN)Images in $(ACR_NAME):$(NC)"
	@az acr repository list --name $(ACR_NAME) --output table

.PHONY: acr-tags
acr-tags: ## Show image tags
	@echo "Backend tags:"
	@az acr repository show-tags --name $(ACR_NAME) --repository fastazure-backend --output table
	@echo "\nFrontend tags:"
	@az acr repository show-tags --name $(ACR_NAME) --repository fastazure-frontend --output table

# ============================================
# Build and Push Images
# ============================================

.PHONY: build-backend
build-backend: ## Build backend Docker image
	@echo "$(GREEN)Building backend image...$(NC)"
	docker build -t $(ACR_NAME).azurecr.io/fastazure-backend:latest -f ../backend/Dockerfile ..

.PHONY: build-frontend
build-frontend: ## Build frontend Docker image
	@echo "$(GREEN)Building frontend image...$(NC)"
	docker build -t $(ACR_NAME).azurecr.io/fastazure-frontend:latest -f ../frontend/Dockerfile ..

.PHONY: push-backend
push-backend: acr-login build-backend ## Build and push backend image to ACR
	@echo "$(GREEN)Pushing backend image...$(NC)"
	docker push $(ACR_NAME).azurecr.io/fastazure-backend:latest

.PHONY: push-frontend
push-frontend: acr-login build-frontend ## Build and push frontend image to ACR
	@echo "$(GREEN)Pushing frontend image...$(NC)"
	docker push $(ACR_NAME).azurecr.io/fastazure-frontend:latest

.PHONY: push-all
push-all: push-backend push-frontend ## Build and push all images to ACR

# ============================================
# Kubernetes (AKS)
# ============================================

.PHONY: aks-creds
aks-creds: ## Get AKS credentials
	@echo "$(GREEN)Getting AKS credentials...$(NC)"
	az aks get-credentials --resource-group $(RESOURCE_GROUP) --name $(AKS_NAME) --overwrite-existing

.PHONY: k8s-deploy
k8s-deploy: ## Deploy application to Kubernetes
	@echo "$(GREEN)Deploying to Kubernetes...$(NC)"
	kubectl apply -f k8s/

.PHONY: k8s-status
k8s-status: ## Show Kubernetes deployment status
	@echo "$(GREEN)Pods:$(NC)"
	@kubectl get pods -n fastazure
	@echo "\n$(GREEN)Services:$(NC)"
	@kubectl get svc -n fastazure
	@echo "\n$(GREEN)Deployments:$(NC)"
	@kubectl get deployments -n fastazure

.PHONY: k8s-logs-backend
k8s-logs-backend: ## Show backend logs
	kubectl logs -f deployment/backend -n fastazure

.PHONY: k8s-logs-frontend
k8s-logs-frontend: ## Show frontend logs
	kubectl logs -f deployment/frontend -n fastazure

.PHONY: k8s-restart
k8s-restart: ## Restart all deployments
	@echo "$(GREEN)Restarting deployments...$(NC)"
	kubectl rollout restart deployment/backend -n fastazure
	kubectl rollout restart deployment/frontend -n fastazure

.PHONY: k8s-scale-backend
k8s-scale-backend: ## Scale backend (usage: make k8s-scale-backend REPLICAS=5)
	@REPLICAS=${REPLICAS:-3}; \
	echo "$(GREEN)Scaling backend to $$REPLICAS replicas...$(NC)"; \
	kubectl scale deployment backend --replicas=$$REPLICAS -n fastazure

.PHONY: k8s-delete
k8s-delete: ## Delete Kubernetes resources
	@echo "$(YELLOW)Deleting Kubernetes resources...$(NC)"
	kubectl delete namespace fastazure

# ============================================
# Database (Cosmos DB)
# ============================================

.PHONY: db-connection
db-connection: ## Show MongoDB connection string
	@az deployment group show \
		--resource-group $(RESOURCE_GROUP) \
		--name $(DEPLOYMENT_NAME) \
		--query properties.outputs.cosmosConnectionString.value -o tsv

.PHONY: db-info
db-info: ## Show Cosmos DB information
	@echo "$(GREEN)Cosmos DB Endpoint:$(NC)"
	@az deployment group show \
		--resource-group $(RESOURCE_GROUP) \
		--name $(DEPLOYMENT_NAME) \
		--query properties.outputs.cosmosEndpoint.value -o tsv

# ============================================
# Monitoring
# ============================================

.PHONY: logs-container
logs-container: ## Open Container Insights in browser
	@echo "$(GREEN)Opening Container Insights...$(NC)"
	@AKS_ID=$$(az aks show --resource-group $(RESOURCE_GROUP) --name $(AKS_NAME) --query id -o tsv); \
	az monitor log-analytics workspace show --ids $$AKS_ID

.PHONY: metrics
metrics: ## Show cluster metrics
	@echo "$(GREEN)Node metrics:$(NC)"
	@kubectl top nodes
	@echo "\n$(GREEN)Pod metrics:$(NC)"
	@kubectl top pods -n fastazure

# ============================================
# Complete Workflows
# ============================================

.PHONY: full-deploy
full-deploy: deploy-infra aks-creds push-all k8s-deploy ## Complete deployment (infrastructure + images + k8s)
	@echo "$(GREEN)Full deployment complete!$(NC)"
	@echo "Run 'make get-url' to get the application URL"

.PHONY: update-app
update-app: push-all k8s-restart ## Update application (rebuild images and restart pods)
	@echo "$(GREEN)Application updated!$(NC)"

.PHONY: get-url
get-url: ## Get application URL
	@echo "$(GREEN)Waiting for external IP...$(NC)"
	@kubectl get svc frontend-service -n fastazure -o jsonpath='{.status.loadBalancer.ingress[0].ip}' | \
	xargs -I {} echo "Application URL: http://{}"

# ============================================
# Development
# ============================================

.PHONY: shell-backend
shell-backend: ## Open shell in backend pod
	@kubectl exec -it deployment/backend -n fastazure -- /bin/bash

.PHONY: shell-frontend
shell-frontend: ## Open shell in frontend pod
	@kubectl exec -it deployment/frontend -n fastazure -- /bin/sh

.PHONY: port-forward-backend
port-forward-backend: ## Port forward backend to localhost:8000
	@echo "$(GREEN)Forwarding backend to localhost:8000$(NC)"
	@kubectl port-forward -n fastazure svc/backend-service 8000:8000

.PHONY: port-forward-frontend
port-forward-frontend: ## Port forward frontend to localhost:3000
	@echo "$(GREEN)Forwarding frontend to localhost:3000$(NC)"
	@kubectl port-forward -n fastazure svc/frontend-service 3000:80

