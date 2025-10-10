#!/bin/bash
set -e

echo "🧪 Testing Local Development Setup..."
echo ""

# Check .env file
echo "✅ Checking .env file..."
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "✅ Checking VITE_DEV_NO_AUTH setting..."
if grep -q "VITE_DEV_NO_AUTH=true" .env; then
    echo "✅ Dev mode enabled (Azure AD bypassed)"
else
    echo "⚠️  Dev mode not enabled. Set VITE_DEV_NO_AUTH=true in .env"
fi

echo ""
echo "✅ Checking MongoDB URI..."
if grep -q "mongodb://localhost:27017" .env; then
    echo "✅ MongoDB URI configured for local development"
else
    echo "⚠️  MongoDB URI may not be correct. Should be: mongodb://localhost:27017"
fi

echo ""
echo "✅ Checking redirect URIs..."
if grep -q "VITE_AZURE_REDIRECT_URI=http://localhost:5173" .env; then
    echo "✅ Redirect URI configured for Vite dev server"
else
    echo "⚠️  Redirect URI should be: http://localhost:5173"
fi

echo ""
echo "🎉 Configuration looks good!"
echo ""
echo "📝 Next steps:"
echo "  1. Start MongoDB:  docker-compose up mongo"
echo "  2. Start Backend:  cd backend && uv run uvicorn backend.main:app --reload"
echo "  3. Start Frontend: cd frontend && npm run dev"
echo "  4. Open:          http://localhost:5173"
echo ""
echo "📖 See LOCAL_DEVELOPMENT.md for detailed instructions"
