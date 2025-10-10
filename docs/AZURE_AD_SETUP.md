# Azure AD Authentication Setup Guide

This guide explains how to set up Azure Active Directory (Azure AD) authentication for the Fast Azure application.

## Prerequisites

- Azure subscription with permissions to create App Registrations
- Access to Azure Portal (https://portal.azure.com)

## Step 1: Create Azure AD App Registration

### 1.1 Navigate to App Registrations

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Azure Active Directory" or "Microsoft Entra ID"
3. Click on **App registrations** in the left menu
4. Click **+ New registration**

### 1.2 Register the Application

Fill in the registration form:

- **Name**: `Fast Azure App` (or your preferred name)
- **Supported account types**: 
  - Choose "Accounts in this organizational directory only" for single tenant
  - OR "Accounts in any organizational directory" for multi-tenant
- **Redirect URI**: 
  - Platform: **Single-page application (SPA)**
  - URI: `http://localhost:3000` (for local development)
  - For production, add your production URL (e.g., `https://yourdomain.com`)

Click **Register**

### 1.3 Note Your IDs

After registration, you'll see the **Overview** page. Copy these values:

- **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

Save these values - you'll need them for the `.env` file.

## Step 2: Configure Authentication

### 2.1 Add Redirect URIs

1. Go to **Authentication** in the left menu
2. Under **Single-page application**, add additional redirect URIs:
   - `http://localhost:3000` (local development)
   - `http://localhost:5173` (Vite dev server)
   - Your production URL(s)

3. Under **Logout URL**, add:
   - `http://localhost:3000`
   - Your production URL(s)

4. Under **Implicit grant and hybrid flows**, ensure these are **UNCHECKED** (SPA uses PKCE):
   - ❌ Access tokens
   - ❌ ID tokens

5. Click **Save**

### 2.2 Enable Public Client Flow (Optional)

1. Go to **Authentication**
2. Scroll to **Advanced settings**
3. Under "Allow public client flows", select **Yes** if you need mobile/desktop support
4. Click **Save**

## Step 3: Configure API Permissions

### 3.1 Add Microsoft Graph Permissions

1. Go to **API permissions** in the left menu
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - ✅ `User.Read` (should be added by default)
   - ✅ `openid`
   - ✅ `profile`
   - ✅ `email`
6. Click **Add permissions**

### 3.2 Grant Admin Consent (if required)

If your organization requires admin consent:

1. Click **Grant admin consent for [Your Organization]**
2. Confirm by clicking **Yes**

## Step 4: Expose an API (Optional - for Backend Access)

If you want the frontend to access a protected backend API:

### 4.1 Create App ID URI

1. Go to **Expose an API** in the left menu
2. Click **Set** next to "Application ID URI"
3. Accept the default (`api://[client-id]`) or customize it
4. Click **Save**

### 4.2 Add a Scope

1. Click **+ Add a scope**
2. Fill in:
   - **Scope name**: `access_as_user`
   - **Who can consent**: Admins and users
   - **Admin consent display name**: `Access Fast Azure as a user`
   - **Admin consent description**: `Allows the app to access Fast Azure API as the signed-in user`
   - **User consent display name**: `Access Fast Azure as a user`
   - **User consent description**: `Allows the app to access Fast Azure API on your behalf`
   - **State**: Enabled
3. Click **Add scope**

4. Copy the full scope URI: `api://[client-id]/access_as_user`

## Step 5: Configure Environment Variables

### 5.1 Create `.env` File

Copy the `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 5.2 Fill in Azure AD Values

Edit the `.env` file and add your Azure AD values:

```env
# Azure AD Configuration
VITE_AZURE_CLIENT_ID=your-application-client-id-here
VITE_AZURE_TENANT_ID=your-directory-tenant-id-here
VITE_AZURE_REDIRECT_URI=http://localhost:3000
VITE_AZURE_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
VITE_AZURE_API_SCOPE=api://your-client-id-here/access_as_user

# Disable dev mode to enable real authentication
VITE_DEV_NO_AUTH=false
```

**Important**: Replace the placeholder values with your actual Azure AD values from Step 1.3 and Step 4.2.

### 5.3 Production Environment Variables

For production, update the redirect URIs:

```env
VITE_AZURE_REDIRECT_URI=https://yourdomain.com
VITE_AZURE_POST_LOGOUT_REDIRECT_URI=https://yourdomain.com
```

And make sure to add these URLs to your Azure AD App Registration (Step 2.1).

## Step 6: Test Authentication

### 6.1 Local Development (without Docker)

```bash
# Terminal 1: Start MongoDB
docker-compose up mongo

# Terminal 2: Start Backend
cd backend
uv run uvicorn backend.main:app --reload

# Terminal 3: Start Frontend with env vars
cd frontend
npm run dev
```

### 6.2 Docker Development

```bash
# Rebuild with new env vars
docker-compose down
docker-compose up --build

# Or use make
make clean
make build
make up
```

### 6.3 Verify Authentication

1. Open http://localhost:3000 (or http://localhost:5173 for Vite dev)
2. You should see a **"Sign In"** button
3. Click "Sign In"
4. You'll be redirected to Microsoft login
5. Sign in with your Azure AD account
6. Grant consent if prompted
7. You'll be redirected back to the app, now authenticated

## Step 7: Troubleshooting

### Error: "AADSTS900144: The request body must contain the following parameter: 'client_id'"

**Cause**: `VITE_AZURE_CLIENT_ID` is not set or empty.

**Solution**: 
- Check your `.env` file has the correct `VITE_AZURE_CLIENT_ID` value
- Rebuild the Docker image: `docker-compose up --build frontend`

### Error: "AADSTS50011: Reply URL mismatch"

**Cause**: The redirect URI in your app doesn't match Azure AD configuration.

**Solution**:
- Verify `VITE_AZURE_REDIRECT_URI` in `.env` matches the URL you're accessing
- Add the redirect URI to Azure AD App Registration (Step 2.1)
- Include both `http://localhost:3000` and `http://localhost:5173`

### Error: "AADSTS65001: User or administrator has not consented"

**Cause**: Required permissions haven't been granted.

**Solution**:
- Grant admin consent (Step 3.2)
- OR have users consent when they first sign in
- Check API permissions are added correctly (Step 3.1)

### Dev Mode Not Disabling

**Cause**: `VITE_DEV_NO_AUTH` is still `true` or `VITE_AZURE_CLIENT_ID` is empty.

**Solution**:
```env
VITE_DEV_NO_AUTH=false
VITE_AZURE_CLIENT_ID=your-actual-client-id
```

Rebuild: `docker-compose up --build frontend`

### Token Acquisition Fails

**Cause**: Incorrect API scope or missing permissions.

**Solution**:
- Verify `VITE_AZURE_API_SCOPE` format: `api://[client-id]/access_as_user`
- Ensure the scope is added in "Expose an API" (Step 4)
- Check API permissions include the custom scope

## Step 8: Production Deployment

### 8.1 Update Azure AD App Registration

1. Add production redirect URIs:
   - `https://yourdomain.com`
   - `https://yourdomain.com/auth/callback` (if using a callback route)

2. Update logout URIs to production URLs

### 8.2 Update Environment Variables

Create a `.env.production` file:

```env
# Production Azure AD
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_AZURE_REDIRECT_URI=https://yourdomain.com
VITE_AZURE_POST_LOGOUT_REDIRECT_URI=https://yourdomain.com
VITE_AZURE_API_SCOPE=api://your-client-id/access_as_user
VITE_DEV_NO_AUTH=false

# Production API URL
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_BASE=wss://api.yourdomain.com
```

### 8.3 Build for Production

```bash
# Build with production env
docker-compose --env-file .env.production build

# Or pass env vars directly
docker-compose build \
  --build-arg VITE_AZURE_CLIENT_ID=xxx \
  --build-arg VITE_AZURE_TENANT_ID=xxx \
  --build-arg VITE_DEV_NO_AUTH=false
```

### 8.4 Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use Azure Key Vault** for production secrets
3. **Enable MFA** for admin accounts
4. **Rotate client secrets** regularly (if using confidential client)
5. **Monitor sign-ins** in Azure AD logs
6. **Implement token refresh** in your app (already handled by MSAL)
7. **Use HTTPS** in production (required for Azure AD)

## Step 9: Advanced Configuration

### 9.1 Multi-Tenant Support

For multi-tenant apps:

```env
VITE_AZURE_TENANT_ID=common
```

In Azure AD:
- Set "Supported account types" to "Accounts in any organizational directory"

### 9.2 Custom Claims

To request additional user claims:

1. Go to **Token configuration** in Azure AD
2. Click **+ Add optional claim**
3. Select **ID**, **Access**, or **SAML** token
4. Choose claims to include (e.g., `email`, `family_name`, `given_name`)

### 9.3 Conditional Access

Set up Conditional Access policies in Azure AD:

1. Go to Azure AD > Security > Conditional Access
2. Create policies for:
   - MFA requirements
   - Trusted locations
   - Device compliance
   - Sign-in risk

### 9.4 App Roles (Authorization)

To implement role-based access control:

1. Go to **App roles** in Azure AD
2. Click **+ Create app role**
3. Define roles (e.g., `Admin`, `User`, `Viewer`)
4. Assign users to roles in Enterprise Applications
5. Access roles in the app via `user.claims` or token

## Reference Links

- [Azure AD Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Azure AD App Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [MSAL React Tutorial](https://docs.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-react)

## Support

For issues with:
- **Azure AD setup**: Check Azure AD logs in Azure Portal
- **MSAL errors**: Enable debug logging (see `msalConfig.ts`)
- **Docker builds**: Ensure env vars are passed correctly in `docker-compose.yml`
- **Application errors**: Check browser console and network tab

For development questions, refer to:
- `/DOCKER_SETUP.md` - Docker configuration
- `/TICKER_README.md` - Ticker feature
- `/KPI_DASHBOARD_README.md` - KPI Dashboard

