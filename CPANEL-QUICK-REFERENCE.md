# 🚀 cPanel Quick Reference Card

Quick commands for managing the Guest Blog Validation Tool on cPanel.

---

## 📍 Server Paths

```bash
Backend:  /home/datausehypwave/public_html/api
Frontend: /home/datausehypwave/public_html/
Logs:     /home/datausehypwave/logs/
Backups:  /home/datausehypwave/backups/
Service:  /etc/systemd/system/datamanagement.service
```

---

## 🔧 Service Commands

### Start Service
```bash
sudo systemctl start datamanagement.service
```

### Stop Service
```bash
sudo systemctl stop datamanagement.service
```

### Restart Service
```bash
sudo systemctl restart datamanagement.service
```

### Check Status
```bash
sudo systemctl status datamanagement.service
```

### Enable Auto-start (on boot)
```bash
sudo systemctl enable datamanagement.service
```

### Disable Auto-start
```bash
sudo systemctl disable datamanagement.service
```

---

## 📋 View Logs

### Real-time Application Logs
```bash
tail -f /home/datausehypwave/logs/datamanagement.log
```

### Real-time Error Logs
```bash
tail -f /home/datausehypwave/logs/datamanagement-error.log
```

### Systemd Logs (real-time)
```bash
sudo journalctl -u datamanagement.service -f
```

### Last 50 Lines
```bash
sudo journalctl -u datamanagement.service -n 50
```

### Logs Since Today
```bash
sudo journalctl -u datamanagement.service --since today
```

### Logs from Last Hour
```bash
sudo journalctl -u datamanagement.service --since "1 hour ago"
```

---

## 🔄 Deployment

### Quick Deploy
```bash
cd /home/datausehypwave/public_html/api
sudo systemctl stop datamanagement.service
npm ci --only=production
npx prisma migrate deploy
sudo systemctl start datamanagement.service
```

### Using Deploy Script
```bash
chmod +x deploy-to-cpanel.sh
./deploy-to-cpanel.sh
```

---

## 🗄️ Database

### Connect to Database
```bash
mysql -u datausehypwave_gbuser -p datausehypwave_gbvalidation
```

### Backup Database
```bash
mysqldump -u datausehypwave_gbuser -p datausehypwave_gbvalidation > ~/backups/db-backup-$(date +%Y%m%d).sql
```

### Restore Database
```bash
mysql -u datausehypwave_gbuser -p datausehypwave_gbvalidation < ~/backups/db-backup-20241202.sql
```

### Run Migrations
```bash
cd /home/datausehypwave/public_html/api
npx prisma migrate deploy
```

### View Database in GUI
```bash
npx prisma studio
# Opens on http://localhost:5555
```

---

## 🔍 Debugging

### Check if Service is Running
```bash
sudo systemctl is-active datamanagement.service
```

### Check Port Usage
```bash
netstat -tulpn | grep 5000
```

### Test API Locally
```bash
curl http://localhost:5000/health
```

### Test Login Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}'
```

### Check File Permissions
```bash
ls -la /home/datausehypwave/public_html/api
```

### Fix Permissions
```bash
sudo chown -R datausehypwave:datausehypwave /home/datausehypwave/public_html/api
chmod 755 /home/datausehypwave/public_html/api
```

---

## 📦 Backup & Restore

### Create Backup
```bash
cd /home/datausehypwave/public_html/api
tar -czf ~/backups/api-backup-$(date +%Y%m%d-%H%M%S).tar.gz .
```

### Restore from Backup
```bash
sudo systemctl stop datamanagement.service
cd /home/datausehypwave/public_html/api
tar -xzf ~/backups/api-backup-20241202-120000.tar.gz
sudo systemctl start datamanagement.service
```

---

## 🔄 Update Process

### 1. Stop Service
```bash
sudo systemctl stop datamanagement.service
```

### 2. Backup Current Version
```bash
cd /home/datausehypwave/public_html/api
tar -czf ~/backups/api-backup-$(date +%Y%m%d-%H%M%S).tar.gz .
```

### 3. Upload New Files
```bash
# Upload via SCP or cPanel File Manager
```

### 4. Install & Deploy
```bash
cd /home/datausehypwave/public_html/api
npm ci --only=production
npx prisma generate
npx prisma migrate deploy
```

### 5. Start Service
```bash
sudo systemctl start datamanagement.service
```

### 6. Verify
```bash
sudo systemctl status datamanagement.service
curl http://localhost:5000/health
```

---

## 🚨 Emergency Commands

### Force Stop Service
```bash
sudo systemctl kill datamanagement.service
```

### Kill Process by Port
```bash
sudo lsof -ti:5000 | xargs sudo kill -9
```

### Restart MySQL
```bash
sudo systemctl restart mysql
```

### Clear Logs
```bash
> /home/datausehypwave/logs/datamanagement.log
> /home/datausehypwave/logs/datamanagement-error.log
```

---

## 📊 Monitoring

### Service Uptime
```bash
systemctl show datamanagement.service --property=ActiveEnterTimestamp
```

### Memory Usage
```bash
systemctl status datamanagement.service | grep Memory
```

### CPU Usage
```bash
top -p $(systemctl show -p MainPID datamanagement.service | cut -d= -f2)
```

### Disk Usage
```bash
du -sh /home/datausehypwave/public_html/api
du -sh /home/datausehypwave/logs
```

---

## 🔐 Security

### Change Admin Password
```bash
# Login to app and change via UI
# Or reset via database:
mysql -u datausehypwave_gbuser -p datausehypwave_gbvalidation
UPDATE users SET password='$2b$10$...' WHERE email='admin@example.com';
```

### View Active Sessions
```bash
mysql -u datausehypwave_gbuser -p datausehypwave_gbvalidation
SELECT * FROM sessions WHERE expiresAt > NOW();
```

### Check Failed Login Attempts
```bash
grep "Failed login" /home/datausehypwave/logs/datamanagement.log
```

---

## 📞 Common Issues

### Service Won't Start
```bash
# Check logs
sudo journalctl -u datamanagement.service -n 50

# Check if port is in use
netstat -tulpn | grep 5000

# Verify .env file exists
ls -la /home/datausehypwave/public_html/api/.env
```

### Database Connection Error
```bash
# Test connection
mysql -u datausehypwave_gbuser -p datausehypwave_gbvalidation

# Check DATABASE_URL
cat /home/datausehypwave/public_html/api/.env | grep DATABASE_URL
```

### Permission Denied
```bash
# Fix ownership
sudo chown -R datausehypwave:datausehypwave /home/datausehypwave/public_html/api

# Fix permissions
chmod 755 /home/datausehypwave/public_html/api
chmod 644 /home/datausehypwave/public_html/api/.env
```

---

## 📚 Documentation

- **Full cPanel Guide:** [CPANEL-DEPLOYMENT.md](CPANEL-DEPLOYMENT.md)
- **General Deployment:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Database Schema:** [DATABASE-SCHEMA.md](DATABASE-SCHEMA.md)
- **Build Instructions:** [BUILD-INSTRUCTIONS.md](BUILD-INSTRUCTIONS.md)

---

## 🎯 Quick Health Check

Run this to check everything:

```bash
echo "=== Service Status ==="
sudo systemctl status datamanagement.service --no-pager | head -5

echo -e "\n=== API Health ==="
curl -s http://localhost:5000/health

echo -e "\n=== Database Connection ==="
mysql -u datausehypwave_gbuser -p datausehypwave_gbvalidation -e "SELECT COUNT(*) as total_users FROM users;"

echo -e "\n=== Disk Usage ==="
df -h | grep datausehypwave

echo -e "\n=== Recent Logs ==="
tail -n 5 /home/datausehypwave/logs/datamanagement.log
```

---

**Keep this handy for quick reference! 📌**
