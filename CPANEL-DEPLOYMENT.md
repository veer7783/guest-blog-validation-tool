# 🚀 cPanel Deployment Guide

Complete guide for deploying Guest Blog Validation Tool on cPanel with systemd service.

---

## 📋 Server Information

- **Backend Path:** `/home/datausehypwave/public_html/api`
- **Service Name:** `datamanagement.service`
- **Service Control:** `sudo systemctl start/stop/restart datamanagement.service`

---

## 🔧 Prerequisites

- cPanel/WHM access
- SSH access with sudo privileges
- Node.js installed (v18+)
- MySQL database access
- Domain/subdomain configured

---

## 📦 Step 1: Prepare Backend Files

### On Your Local Machine:

```bash
# Build backend
cd backend
npm install
npm run build

# Create deployment package
tar -czf backend-build.tar.gz dist/ package.json package-lock.json prisma/
```

### Upload to Server:

```bash
# Using SCP
scp backend-build.tar.gz datausehypwave@your-server.com:/home/datausehypwave/

# Or use cPanel File Manager to upload
```

---

## 🗄️ Step 2: Database Setup

### Via cPanel MySQL:

1. **Create Database:**
   - Go to cPanel → MySQL Databases
   - Create database: `datausehypwave_gbvalidation`
   - Create user: `datausehypwave_gbuser`
   - Set strong password
   - Add user to database with ALL PRIVILEGES

2. **Or via SSH:**

```bash
# Login to MySQL
mysql -u datausehypwave -p

# Create database
CREATE DATABASE datausehypwave_gbvalidation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit
EXIT;
```

---

## 🚀 Step 3: Deploy Backend

### SSH into Server:

```bash
ssh datausehypwave@your-server.com
```

### Extract and Setup:

```bash
# Navigate to backend directory
cd /home/datausehypwave/public_html/api

# Backup existing files (if any)
mkdir -p ~/backups
tar -czf ~/backups/api-backup-$(date +%Y%m%d-%H%M%S).tar.gz .

# Extract new build
tar -xzf ~/backend-build.tar.gz

# Install production dependencies only
npm ci --only=production

# Create .env file
nano .env
```

### Configure `.env`:

```env
# Database
DATABASE_URL="mysql://datausehypwave_gbuser:your_password@localhost:3306/datausehypwave_gbvalidation"

# JWT Secret (generate strong random string)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=5000
NODE_ENV=production

# CORS (your frontend domain)
CORS_ORIGIN="https://your-frontend-domain.com"

# Main Project API
MAIN_PROJECT_API_URL="https://main-project-domain.com/api/guest-sites-api"
MAIN_PROJECT_SERVICE_EMAIL="validation-service@usehypwave.com"
MAIN_PROJECT_SERVICE_PASSWORD="your-main-project-password"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Run Database Migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (creates admin users)
npx prisma db seed
```

---

## ⚙️ Step 4: Create Systemd Service

### Create Service File:

```bash
sudo nano /etc/systemd/system/datamanagement.service
```

### Service Configuration:

```ini
[Unit]
Description=Guest Blog Validation Tool - Data Management API
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=datausehypwave
Group=datausehypwave
WorkingDirectory=/home/datausehypwave/public_html/api
Environment="NODE_ENV=production"
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=append:/home/datausehypwave/logs/datamanagement.log
StandardError=append:/home/datausehypwave/logs/datamanagement-error.log
SyslogIdentifier=datamanagement

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/home/datausehypwave/public_html/api

[Install]
WantedBy=multi-user.target
```

### Create Log Directory:

```bash
mkdir -p /home/datausehypwave/logs
chmod 755 /home/datausehypwave/logs
```

### Enable and Start Service:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service (start on boot)
sudo systemctl enable datamanagement.service

# Start service
sudo systemctl start datamanagement.service

# Check status
sudo systemctl status datamanagement.service
```

---

## 🔍 Step 5: Verify Backend

### Check Service Status:

```bash
# Service status
sudo systemctl status datamanagement.service

# View logs
sudo journalctl -u datamanagement.service -f

# Or check log files
tail -f /home/datausehypwave/logs/datamanagement.log
tail -f /home/datausehypwave/logs/datamanagement-error.log
```

### Test API:

```bash
# Health check
curl http://localhost:5000/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}'
```

---

## 🌐 Step 6: Configure Reverse Proxy

### Option A: Apache (cPanel Default)

Create `.htaccess` in `/home/datausehypwave/public_html/api`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Proxy API requests to Node.js
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
</IfModule>

# CORS Headers
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://your-frontend-domain.com"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>
```

### Option B: Nginx (if available)

```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🎨 Step 7: Deploy Frontend

### Build Frontend Locally:

```bash
cd frontend

# Update API URL
echo "REACT_APP_API_URL=https://api.your-domain.com" > .env.production

# Build
npm install
npm run build
```

### Upload to cPanel:

1. **Via File Manager:**
   - Zip the `build/` folder
   - Upload to `/home/datausehypwave/public_html/`
   - Extract files

2. **Via SCP:**

```bash
# From local machine
cd frontend
scp -r build/* datausehypwave@your-server.com:/home/datausehypwave/public_html/
```

### Configure Frontend `.htaccess`:

Create `/home/datausehypwave/public_html/.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Don't rewrite files or directories
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    
    # Rewrite everything else to index.html for React Router
    RewriteRule ^ index.html [L]
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

## 🔄 Service Management Commands

### Start Service:
```bash
sudo systemctl start datamanagement.service
```

### Stop Service:
```bash
sudo systemctl stop datamanagement.service
```

### Restart Service:
```bash
sudo systemctl restart datamanagement.service
```

### Check Status:
```bash
sudo systemctl status datamanagement.service
```

### View Logs:
```bash
# Real-time logs
sudo journalctl -u datamanagement.service -f

# Last 100 lines
sudo journalctl -u datamanagement.service -n 100

# Logs since today
sudo journalctl -u datamanagement.service --since today

# Custom log files
tail -f /home/datausehypwave/logs/datamanagement.log
```

### Enable/Disable Auto-start:
```bash
# Enable (start on boot)
sudo systemctl enable datamanagement.service

# Disable
sudo systemctl disable datamanagement.service
```

---

## 🔄 Update/Redeploy Process

### 1. Build New Version Locally:

```bash
cd backend
npm install
npm run build
tar -czf backend-build-v2.tar.gz dist/ package.json package-lock.json prisma/
```

### 2. Upload and Deploy:

```bash
# SSH to server
ssh datausehypwave@your-server.com

# Stop service
sudo systemctl stop datamanagement.service

# Backup current version
cd /home/datausehypwave/public_html/api
tar -czf ~/backups/api-backup-$(date +%Y%m%d-%H%M%S).tar.gz .

# Extract new version
tar -xzf ~/backend-build-v2.tar.gz

# Install dependencies
npm ci --only=production

# Run migrations
npx prisma migrate deploy

# Start service
sudo systemctl start datamanagement.service

# Check status
sudo systemctl status datamanagement.service
```

---

## 🔒 SSL/HTTPS Setup

### Via cPanel:

1. Go to cPanel → SSL/TLS Status
2. Run AutoSSL for your domains
3. Or install Let's Encrypt certificate

### Via Command Line:

```bash
# Install Certbot
sudo yum install certbot python3-certbot-apache

# Get certificate
sudo certbot --apache -d api.your-domain.com

# Auto-renewal (add to crontab)
0 0 * * * certbot renew --quiet
```

---

## 🐛 Troubleshooting

### Service Won't Start:

```bash
# Check service status
sudo systemctl status datamanagement.service

# Check logs
sudo journalctl -u datamanagement.service -n 50

# Check if port is in use
netstat -tulpn | grep 5000

# Check file permissions
ls -la /home/datausehypwave/public_html/api
```

### Database Connection Issues:

```bash
# Test database connection
mysql -u datausehypwave_gbuser -p datausehypwave_gbvalidation

# Check DATABASE_URL in .env
cat /home/datausehypwave/public_html/api/.env | grep DATABASE_URL
```

### Permission Issues:

```bash
# Fix ownership
sudo chown -R datausehypwave:datausehypwave /home/datausehypwave/public_html/api

# Fix permissions
chmod 755 /home/datausehypwave/public_html/api
chmod 644 /home/datausehypwave/public_html/api/.env
```

### Port Already in Use:

```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>

# Or change PORT in .env
```

---

## 📊 Monitoring

### Check Service Health:

```bash
# Service uptime
systemctl show datamanagement.service --property=ActiveEnterTimestamp

# Memory usage
systemctl status datamanagement.service | grep Memory

# CPU usage
top -p $(systemctl show -p MainPID datamanagement.service | cut -d= -f2)
```

### Log Rotation:

Create `/etc/logrotate.d/datamanagement`:

```
/home/datausehypwave/logs/datamanagement*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 datausehypwave datausehypwave
    sharedscripts
    postrotate
        systemctl reload datamanagement.service > /dev/null 2>&1 || true
    endscript
}
```

---

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (allow only necessary ports)
- [ ] Set proper file permissions
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Regular database backups
- [ ] Keep Node.js and dependencies updated
- [ ] Monitor logs for suspicious activity

---

## 📞 Quick Reference

### Service Commands:
```bash
sudo systemctl start datamanagement.service    # Start
sudo systemctl stop datamanagement.service     # Stop
sudo systemctl restart datamanagement.service  # Restart
sudo systemctl status datamanagement.service   # Status
```

### Logs:
```bash
tail -f /home/datausehypwave/logs/datamanagement.log        # App logs
tail -f /home/datausehypwave/logs/datamanagement-error.log  # Error logs
sudo journalctl -u datamanagement.service -f                # Systemd logs
```

### Paths:
- Backend: `/home/datausehypwave/public_html/api`
- Logs: `/home/datausehypwave/logs/`
- Service: `/etc/systemd/system/datamanagement.service`

---

## 📚 Additional Resources

- [Main Deployment Guide](DEPLOYMENT.md)
- [Database Schema](DATABASE-SCHEMA.md)
- [Build Instructions](BUILD-INSTRUCTIONS.md)

---

**Deployment Complete! 🎉**
