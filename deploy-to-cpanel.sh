#!/bin/bash

# Guest Blog Validation Tool - cPanel Deployment Script
# Usage: ./deploy-to-cpanel.sh
#
# Prerequisites:
# 1. SSH access to cPanel server
# 2. Node.js installed (v18+)
# 3. MySQL database created
# 4. Backend .env configured with production values
#
# Production Environment Variables (backend/.env):
# DATABASE_URL="mysql://datausehypwave_validation:password@localhost:3306/datausehypwave_data_validation_tool"
# JWT_SECRET="your-secure-jwt-secret"
# PORT=5000
# NODE_ENV=production
# MAIN_PROJECT_API_URL="https://links.usehypwave.com/api/api/guest-sites-api"
# MAIN_PROJECT_SERVICE_EMAIL="validation-service@usehypwave.com"
# MAIN_PROJECT_SERVICE_PASSWORD="your-service-password"
# CORS_ORIGIN="https://data.usehypwave.com"

set -e

echo "🚀 Guest Blog Validation Tool - cPanel Deployment"
echo "=================================================="
echo ""

# Configuration
BACKEND_PATH="/home/datausehypwave/public_html/api"
FRONTEND_PATH="/home/datausehypwave/public_html"
SERVICE_NAME="datamanagement.service"
BACKUP_DIR="$HOME/backups"
LOG_DIR="$HOME/logs"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running on server
if [ ! -d "$BACKEND_PATH" ]; then
    echo -e "${RED}❌ Error: Backend path not found: $BACKEND_PATH${NC}"
    echo "This script should be run on the cPanel server."
    exit 1
fi

# Create necessary directories
echo -e "${BLUE}📁 Creating directories...${NC}"
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Backup current version
echo -e "${BLUE}💾 Backing up current version...${NC}"
BACKUP_FILE="$BACKUP_DIR/api-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
cd "$BACKEND_PATH"
tar -czf "$BACKUP_FILE" . 2>/dev/null || echo "No existing files to backup"
echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"

# Stop service
echo -e "${BLUE}🛑 Stopping service...${NC}"
sudo systemctl stop $SERVICE_NAME
echo -e "${GREEN}✅ Service stopped${NC}"

# Deploy new version
echo -e "${BLUE}📦 Deploying new version...${NC}"
cd "$BACKEND_PATH"

# Check if build files exist
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: dist/ directory not found${NC}"
    echo "Please upload the built backend files first."
    sudo systemctl start $SERVICE_NAME
    exit 1
fi

# Install dependencies
echo -e "${BLUE}📥 Installing dependencies...${NC}"
npm ci --only=production

# Generate Prisma Client
echo -e "${BLUE}🔧 Generating Prisma Client...${NC}"
npx prisma generate

# Run migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
npx prisma migrate deploy

# Start service
echo -e "${BLUE}🚀 Starting service...${NC}"
sudo systemctl start $SERVICE_NAME

# Wait for service to start
sleep 3

# Check service status
echo -e "${BLUE}🔍 Checking service status...${NC}"
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo -e "${GREEN}✅ Service is running${NC}"
    
    # Test API
    echo -e "${BLUE}🧪 Testing API...${NC}"
    if curl -s http://localhost:5000/health > /dev/null; then
        echo -e "${GREEN}✅ API is responding${NC}"
    else
        echo -e "${YELLOW}⚠️  API health check failed${NC}"
    fi
else
    echo -e "${RED}❌ Service failed to start${NC}"
    echo "Check logs: sudo journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

# Show service status
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
sudo systemctl status $SERVICE_NAME --no-pager | head -n 10

# Summary
echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "📝 Next Steps:"
echo "  - View logs: tail -f $LOG_DIR/datamanagement.log"
echo "  - Check status: sudo systemctl status $SERVICE_NAME"
echo "  - Restart: sudo systemctl restart $SERVICE_NAME"
echo ""
echo "🔙 Rollback if needed:"
echo "  - Stop service: sudo systemctl stop $SERVICE_NAME"
echo "  - Restore backup: tar -xzf $BACKUP_FILE -C $BACKEND_PATH"
echo "  - Start service: sudo systemctl start $SERVICE_NAME"
echo ""
