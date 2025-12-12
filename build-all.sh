#!/bin/bash

# Guest Blog Validation Tool - Build Script
# This script builds both frontend and backend for production

set -e  # Exit on error

echo "🚀 Starting build process..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Build Backend
echo -e "${BLUE}📦 Building Backend...${NC}"
cd backend

echo "Installing dependencies..."
npm install

echo "Generating Prisma Client..."
npx prisma generate

echo "Building TypeScript..."
npm run build

echo -e "${GREEN}✅ Backend build complete!${NC}"
echo ""

# Build Frontend
echo -e "${BLUE}📦 Building Frontend...${NC}"
cd ../frontend

echo "Installing dependencies..."
npm install

echo "Building React app..."
npm run build

echo -e "${GREEN}✅ Frontend build complete!${NC}"
echo ""

# Summary
echo -e "${GREEN}🎉 Build Complete!${NC}"
echo ""
echo "📂 Build Output:"
echo "  Backend:  backend/dist/"
echo "  Frontend: frontend/build/"
echo ""
echo "📝 Next Steps:"
echo "  1. Setup database: cd backend && npx prisma migrate deploy"
echo "  2. Start backend:  cd backend && npm start"
echo "  3. Serve frontend: cd frontend && serve -s build"
echo ""
