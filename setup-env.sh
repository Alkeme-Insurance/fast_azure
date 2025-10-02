#!/bin/bash

# Fast Azure - Environment Setup Script
# This script helps you create a .env file with proper Azure AD configuration

set -e

echo "========================================="
echo "Fast Azure - Environment Setup"
echo "========================================="
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  Warning: .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. Existing .env file preserved."
        exit 0
    fi
fi

# Copy example file
if [ -f .env.example ]; then
    cp .env.example .env
    echo "✓ Created .env from .env.example"
else
    echo "❌ Error: .env.example not found!"
    exit 1
fi

echo ""
echo "========================================="
echo "Azure AD Configuration"
echo "========================================="
echo ""
echo "Do you want to configure Azure AD authentication now?"
echo "If you skip this, dev mode (no auth) will be enabled."
echo ""
read -p "Configure Azure AD? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please provide your Azure AD values:"
    echo "(Press Enter to skip a value)"
    echo ""
    
    # Client ID
    read -p "Azure AD Client ID: " CLIENT_ID
    if [ ! -z "$CLIENT_ID" ]; then
        sed -i.bak "s/^VITE_AZURE_CLIENT_ID=.*/VITE_AZURE_CLIENT_ID=$CLIENT_ID/" .env
        echo "  ✓ Client ID set"
    fi
    
    # Tenant ID
    read -p "Azure AD Tenant ID: " TENANT_ID
    if [ ! -z "$TENANT_ID" ]; then
        sed -i.bak "s/^VITE_AZURE_TENANT_ID=.*/VITE_AZURE_TENANT_ID=$TENANT_ID/" .env
        echo "  ✓ Tenant ID set"
    fi
    
    # API Scope
    read -p "Azure AD API Scope (e.g., api://xxx/access_as_user): " API_SCOPE
    if [ ! -z "$API_SCOPE" ]; then
        sed -i.bak "s|^VITE_AZURE_API_SCOPE=.*|VITE_AZURE_API_SCOPE=$API_SCOPE|" .env
        echo "  ✓ API Scope set"
    fi
    
    # Disable dev mode if credentials provided
    if [ ! -z "$CLIENT_ID" ]; then
        sed -i.bak "s/^VITE_DEV_NO_AUTH=.*/VITE_DEV_NO_AUTH=false/" .env
        echo "  ✓ Dev mode disabled (Azure AD enabled)"
    fi
    
    # Clean up backup files
    rm -f .env.bak
    
    echo ""
    echo "✓ Azure AD configuration complete!"
    echo ""
    echo "📖 For detailed Azure AD setup instructions, see:"
    echo "   AZURE_AD_SETUP.md"
else
    echo ""
    echo "Skipped Azure AD configuration."
    echo "Dev mode is enabled (VITE_DEV_NO_AUTH=true)"
    echo ""
    echo "To configure Azure AD later:"
    echo "  1. Edit .env file manually"
    echo "  2. See AZURE_AD_SETUP.md for instructions"
fi

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Your .env file has been created."
echo ""
echo "Next steps:"
echo "  1. Review/edit .env file if needed"
echo "  2. Start the application:"
echo "     docker-compose up --build"
echo "  OR"
echo "     make build && make up"
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "For more information, see:"
echo "  - DOCKER_SETUP.md (Docker configuration)"
echo "  - AZURE_AD_SETUP.md (Azure AD setup)"
echo ""

