# Setting Up HTTPS for Azure AD Authentication

## 🔒 Why HTTPS is Required

Azure AD authentication (MSAL.js) requires the **Web Crypto API**, which is only available in **secure contexts (HTTPS)**. This is a browser security feature that cannot be bypassed.

### Current Issue

Your application is running on **HTTP** (`http://40.67.155.178`), which causes:
```
BrowserAuthError: crypto_nonexistent: The crypto object or function is not available.
```

## ✅ Solutions

### Option 1: Use Azure Application Gateway with SSL (Recommended for Production)

Azure Application Gateway provides Layer 7 load balancing with SSL termination.

**Benefits:**
- Managed SSL certificates
- Web Application Firewall (WAF)
- URL-based routing
- Auto-renewal of certificates

**Setup:**
```bash
# 1. Create Application Gateway with WAF
az network application-gateway create \
  --name fastazure-appgw \
  --resource-group fastazure-rg \
  --location eastus2 \
  --sku WAF_v2 \
  --capacity 2 \
  --vnet-name fastazure-vnet \
  --subnet appgw-subnet \
  --public-ip-address appgw-public-ip \
  --http-settings-port 80 \
  --http-settings-protocol Http \
  --frontend-port 443 \
  --servers 40.67.155.178

# 2. Add SSL certificate
az network application-gateway ssl-cert create \
  --gateway-name fastazure-appgw \
  --resource-group fastazure-rg \
  --name fastazure-ssl-cert \
  --cert-file /path/to/cert.pfx \
  --cert-password "your-password"

# 3. Create HTTPS listener
az network application-gateway http-listener create \
  --gateway-name fastazure-appgw \
  --resource-group fastazure-rg \
  --name https-listener \
  --frontend-port 443 \
  --ssl-cert fastazure-ssl-cert
```

**Cost:** ~$125-250/month depending on capacity

### Option 2: Use Azure Front Door with Managed Certificate (Easiest)

Azure Front Door provides global CDN with free managed SSL certificates.

**Benefits:**
- Free managed SSL certificate
- Global CDN for better performance
- DDoS protection
- Easy setup

**Setup via Azure Portal:**

1. Go to Azure Portal → Create Resource → Front Door
2. Configure:
   - **Name:** `fastazure-frontdoor`
   - **Backend pool:** Add `40.67.155.178:80`
   - **Routing rule:** HTTPS only
   - **Domain:** Use azurefd.net subdomain or custom domain
3. Front Door will automatically provision SSL certificate
4. Update Azure AD redirect URI to: `https://fastazure-<hash>.azurefd.net`

**Cost:** ~$35/month + data transfer

### Option 3: Use Let's Encrypt with cert-manager on AKS (Free)

Install cert-manager to automatically manage Let's Encrypt certificates.

**Prerequisites:**
- Custom domain name (e.g., `fastazure.yourdomain.com`)
- DNS control to create A record

**Setup:**

```bash
# 1. Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# 2. Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# 3. Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml

# 4. Update your Ingress with TLS
# Edit infrastructure/k8s/ingress.yaml (see below)

# 5. Point your domain DNS to the Ingress IP
kubectl get svc -n ingress-nginx ingress-nginx-controller
```

**Updated Ingress with TLS:**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fastazure-ingress
  namespace: fastazure
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - fastazure.yourdomain.com
    secretName: fastazure-tls
  rules:
  - host: fastazure.yourdomain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 8000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

**Cost:** Free (only domain registration cost)

### Option 4: Development/Testing Workaround (Not Recommended for Production)

For local development or testing ONLY, you can use ngrok or similar services:

```bash
# Install ngrok
brew install ngrok  # or download from ngrok.com

# Create tunnel to your LoadBalancer
ngrok http 40.67.155.178:80

# ngrok will provide HTTPS URL like: https://abc123.ngrok.io
# Update Azure AD redirect URI to use this URL
```

**⚠️ Warning:** Don't use this for production - ngrok free tier has limits and URLs change.

## 🔄 After Setting Up HTTPS

1. **Update Azure AD Redirect URIs:**
   ```bash
   az ad app update --id bbe33721-bc49-4e29-bb64-8ed19d3a133c \
     --web-redirect-uris "https://your-domain.com" "http://localhost:3000"
   ```

2. **Update config/azure-config.json:**
   ```json
   {
     "deployment": {
       "frontendPublicIp": "your-domain.com",
       "protocol": "https"
     }
   }
   ```

3. **Sync configuration:**
   ```bash
   ./scripts/sync-config.sh
   ```

4. **Redeploy:**
   ```bash
   git add config/azure-config.json
   git commit -m "Update to HTTPS domain"
   git push origin main
   ```

## 📊 Comparison

| Solution | Setup Complexity | Cost/Month | Best For |
|----------|-----------------|------------|----------|
| Application Gateway | Medium | $125-250 | Enterprise, WAF needed |
| Front Door | Easy | $35+ | Global apps, CDN needed |
| Let's Encrypt + cert-manager | Medium | Free | Cost-conscious, custom domain |
| ngrok | Easy | Free (limited) | Dev/testing only |

## 🎯 Recommended Approach

For your application, I recommend **Azure Front Door**:

1. ✅ Easiest setup (no certificate management)
2. ✅ Free managed SSL certificate  
3. ✅ Global CDN improves performance
4. ✅ Reasonable cost (~$35/month)
5. ✅ Integrates well with Azure AD

## 📚 Additional Resources

- [Azure Front Door Documentation](https://docs.microsoft.com/en-us/azure/frontdoor/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [MSAL.js Browser Support](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/Browser-Support)

## ❓ Need Help?

If you need assistance setting up HTTPS, refer to the Azure documentation or reach out to your Azure administrator.

