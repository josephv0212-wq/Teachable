# DigitalOcean Deployment Guide

Complete guide for deploying the Stay Ready Training Academy platform on DigitalOcean.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Creating a DigitalOcean Droplet](#creating-a-digitalocean-droplet)
3. [Initial Server Setup](#initial-server-setup)
4. [Installing Node.js and Dependencies](#installing-nodejs-and-dependencies)
5. [Setting Up the Application](#setting-up-the-application)
6. [Configuring Environment Variables](#configuring-environment-variables)
7. [Setting Up Process Management (PM2)](#setting-up-process-management-pm2)
8. [Configuring Nginx as Reverse Proxy](#configuring-nginx-as-reverse-proxy)
9. [Setting Up SSL with Let's Encrypt](#setting-up-ssl-with-lets-encrypt)
10. [Database and File Persistence](#database-and-file-persistence)
11. [Frontend Deployment Options](#frontend-deployment-options)
12. [Post-Deployment Configuration](#post-deployment-configuration)
13. [Monitoring and Maintenance](#monitoring-and-maintenance)
14. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- A DigitalOcean account ([Sign up here](https://www.digitalocean.com/))
- A domain name (optional but recommended)
- SSH access to your local machine
- Your application code ready to deploy
- All API keys and credentials ready:
  - Teachable API Key and School ID
  - Stripe Secret Key, Publishable Key, and Webhook Secret
  - School information (name, license number, instructor details)

---

## Creating a DigitalOcean Droplet

### Step 1: Create a New Droplet

1. Log in to your DigitalOcean dashboard
2. Click **"Create"** → **"Droplets"**
3. Choose configuration:
   - **Image**: Ubuntu 22.04 (LTS) x64
   - **Plan**: 
     - Minimum: **Basic** plan, **Regular Intel** with **$12/month** (2GB RAM, 1 vCPU) - suitable for small traffic
     - Recommended: **$24/month** (4GB RAM, 2 vCPU) - better performance
     - For production: **$48/month** (8GB RAM, 4 vCPU) - high traffic
   - **Datacenter region**: Choose closest to your users
   - **Authentication**: 
     - **SSH keys** (recommended) - Add your public SSH key
     - Or **Password** - Set a strong password
   - **Hostname**: `ubuntu-s-teachable-sys` (or your preferred name)
4. Click **"Create Droplet"**

### Step 2: Note Your Server Details

After creation, note:
- **IP Address**: Your server's public IP (e.g., `165.245.136.166`)
- **Root password** KhvbUE%KetRMfv5R

---

## Initial Server Setup

### Step 1: Connect to Your Server

```bash
# Using SSH key
ssh root@165.245.136.166

# Or using password
ssh root@165.245.136.166
# Enter password when prompted
```

### Step 2: Update System Packages

```bash
apt update && apt upgrade -y
```

### Step 3: Create a Non-Root User (Recommended)

```bash
# Create a new user
adduser deploy

# Add user to sudo group
usermod -aG sudo deploy

# Switch to the new user
su - deploy
```

### Step 4: Set Up Firewall

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow your backend port (if not using Nginx reverse proxy)
sudo ufw allow 5000/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Installing Node.js and Dependencies

### Step 1: Install Node.js 18.x

```bash
# Install Node.js using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version
```

### Step 2: Install Additional Tools

```bash
# Install Git
sudo apt-get install git -y

# Install build tools (needed for native modules like sqlite3)
sudo apt-get install build-essential -y

# Install PM2 globally (process manager)
sudo npm install -g pm2
```

---

## Setting Up the Application

### Step 1: Clone Your Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository (replace with your repo URL)
git clone https://github.com/YOUR_USERNAME/Teachable.git

# Or if using SSH
git clone git@github.com:YOUR_USERNAME/Teachable.git

# Navigate to project directory
cd Teachable
```

**Alternative: Upload Files via SCP**

If your repository is private or you prefer manual upload:

```bash
# From your local machine
scp -r /path/to/Teachable root@165.245.136.166:/home/deploy/
```

### Step 2: Install Application Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### Step 3: Create Required Directories

```bash
# Create upload directories
mkdir -p server/uploads/certificates
mkdir -p server/uploads/course-materials
mkdir -p server/uploads/logos
mkdir -p server/uploads/signatures

# Set proper permissions
chmod -R 755 server/uploads
```

---

## Configuring Environment Variables

### Step 1: Create Production Environment File

```bash
# Create .env file in root directory
nano .env
```

### Step 2: Add Environment Variables

Add the following content (replace with your actual values):

```env
# Server Configuration
PORT=5000
NODE_ENV=production
HOST=0.0.0.0

# Teachable API
TEACHABLE_API_KEY=your_teachable_api_key_here
TEACHABLE_SCHOOL_ID=your_teachable_school_id_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# School Information
SCHOOL_NAME=Stay Ready Training Academy
SCHOOL_LICENSE_NUMBER=YOUR_DPS_LICENSE_NUMBER
INSTRUCTOR_NAME=Your Full Name
INSTRUCTOR_SIGNATURE_PATH=./server/uploads/signatures/signature.png

# Frontend API URL (update after setting up domain)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

**Important Notes:**
- Use **production** Stripe keys (`sk_live_` and `pk_live_`)
- Update `NEXT_PUBLIC_API_URL` after setting up your domain
- Keep this file secure and never commit it to Git

### Step 3: Create Frontend Environment File

```bash
# Create .env.local in client directory
cd client
nano .env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

### Step 4: Upload Required Files

```bash
# Upload signature image (from your local machine)
# From local machine:
scp /path/to/signature.png deploy@165.245.136.166:/home/deploy/Teachable/server/uploads/signatures/

# Upload logo if needed
scp /path/to/logo.png deploy@165.245.136.166:/home/deploy/Teachable/server/uploads/logos/
```

### Step 5: Initialize School Configuration

```bash
# Run initialization script
node server/scripts/initSchool.js
```

---

## Setting Up Process Management (PM2)

PM2 will keep your application running and restart it if it crashes.

### Step 1: Create PM2 Ecosystem File

```bash
# Create ecosystem file
nano ecosystem.config.js
```

Add the following:

```javascript
module.exports = {
  apps: [
    {
      name: 'stay-ready-api',
      script: 'server/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G'
    }
  ]
};
```

### Step 2: Create Logs Directory

```bash
mkdir -p logs
```

### Step 3: Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions shown (usually run a sudo command)
```

### Step 4: PM2 Useful Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs stay-ready-api

# Restart application
pm2 restart stay-ready-api

# Stop application
pm2 stop stay-ready-api

# Monitor
pm2 monit
```

---

## Configuring Nginx as Reverse Proxy

Nginx will handle incoming requests and forward them to your Node.js application.

### Step 1: Install Nginx

```bash
sudo apt-get install nginx -y
```

### Step 2: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/stay-ready-api
```

Add the following configuration (replace `yourdomain.com` with your domain or IP):

```nginx
server {
    listen 80;
    server_name api.yourdomain.com 165.245.136.166;

    # Increase body size limit for file uploads
    client_max_body_size 50M;

    # Backend API
    location /api {
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

    # Serve uploaded files
    location /uploads {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Health check
    location /api/health {
        proxy_pass http://localhost:5000;
        access_log off;
    }
}
```

### Step 3: Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/stay-ready-api /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 4: Configure Frontend (If Deploying on Same Server)

If you want to serve the Next.js frontend from the same server:

```bash
# Build the frontend
cd ~/Teachable/client
npm run build

# Create Nginx configuration for frontend
sudo nano /etc/nginx/sites-available/stay-ready-frontend
```

Add:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /home/deploy/Teachable/client/.next;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
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

    # Static files
    location /_next/static {
        alias /home/deploy/Teachable/client/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Note:** For Next.js, it's recommended to run it as a separate Node.js process with PM2 instead of serving static files. See [Frontend Deployment Options](#frontend-deployment-options).

---

## Setting Up SSL with Let's Encrypt

### Step 1: Install Certbot

```bash
sudo apt-get install certbot python3-certbot-nginx -y
```

### Step 2: Obtain SSL Certificate

```bash
# Replace with your domain
sudo certbot --nginx -d api.yourdomain.com

# If you have frontend on same server
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### Step 3: Auto-Renewal

Certbot automatically sets up auto-renewal. Test it:

```bash
sudo certbot renew --dry-run
```

### Step 4: Update Environment Variables

After SSL is set up, update your `.env` file:

```bash
nano .env
```

Update:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

And update `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

Restart the application:
```bash
pm2 restart stay-ready-api
```

---

## Database and File Persistence

### SQLite Database

Your SQLite database (`data.sqlite`) is stored in the project root. Ensure it persists:

```bash
# The database file is already in the project directory
# Make sure it's backed up regularly

# Create backup script
nano ~/backup-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /home/deploy/Teachable/data.sqlite $BACKUP_DIR/data.sqlite.$DATE
# Keep only last 7 days of backups
find $BACKUP_DIR -name "data.sqlite.*" -mtime +7 -delete
```

Make executable:
```bash
chmod +x ~/backup-db.sh
```

### Set Up Automated Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/deploy/backup-db.sh
```

### File Uploads

The `server/uploads` directory contains:
- Certificates
- Course materials
- Logos
- Signatures

Ensure these are backed up as well. Consider using DigitalOcean Spaces (object storage) for production.

---

## Frontend Deployment Options

### Option 1: Deploy Frontend on Same Server (PM2)

```bash
# Build the frontend
cd ~/Teachable/client
npm run build

# Create PM2 config for frontend
nano ecosystem.config.js
```

Update to include frontend:

```javascript
module.exports = {
  apps: [
    {
      name: 'stay-ready-api',
      script: 'server/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G'
    },
    {
      name: 'stay-ready-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/home/deploy/Teachable/client',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-frontend-error.log',
      out_file: './logs/pm2-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true
    }
  ]
};
```

Update Nginx to proxy frontend:

```nginx
# Add to your frontend Nginx config
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

### Option 2: Deploy Frontend on Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Set root directory to `client`
5. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com/api`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
6. Deploy

### Option 3: Deploy Frontend on Netlify

1. Build the frontend: `cd client && npm run build`
2. Deploy the `.next` folder to Netlify
3. Set environment variables in Netlify dashboard

---

## Post-Deployment Configuration

### Step 1: Update Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://api.yourdomain.com/api/payments/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook secret
5. Update `.env` file:
   ```bash
   nano .env
   # Update STRIPE_WEBHOOK_SECRET
   ```
6. Restart application:
   ```bash
   pm2 restart stay-ready-api
   ```

### Step 2: Initialize School Data

```bash
# Run initialization scripts
node server/scripts/initSchool.js
node server/scripts/initMembershipPlans.js
node server/scripts/setAdminUser.js
```

### Step 3: Test the Deployment

```bash
# Test API health
curl https://api.yourdomain.com/api/health

# Should return: {"status":"ok","message":"Stay Ready Training Academy API is running"}
```

### Step 4: Create Your First Course

Use the API or admin interface to create courses.

---

## Monitoring and Maintenance

### Set Up Log Rotation

```bash
# Install logrotate config for PM2
sudo nano /etc/logrotate.d/pm2
```

Add:

```
/home/deploy/Teachable/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
    create 0640 deploy deploy
}
```

### Monitor Server Resources

```bash
# Install htop for monitoring
sudo apt-get install htop -y

# Use it
htop
```

### Set Up Uptime Monitoring

Consider using:
- **UptimeRobot** (free): https://uptimerobot.com
- **Pingdom**: https://www.pingdom.com
- **StatusCake**: https://www.statuscake.com

### Regular Updates

```bash
# Update system packages monthly
sudo apt update && sudo apt upgrade -y

# Update Node.js packages (check for security updates)
npm audit
npm audit fix

# Update PM2
sudo npm install -g pm2@latest
pm2 update
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs stay-ready-api

# Check if port is in use
sudo netstat -tulpn | grep 5000

# Check environment variables
pm2 env stay-ready-api
```

### Nginx 502 Bad Gateway

```bash
# Check if Node.js app is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx configuration
sudo nginx -t
```

### Database Issues

```bash
# Check database file permissions
ls -la data.sqlite

# Check database file size
du -h data.sqlite

# Verify database integrity (if needed, install sqlite3)
sudo apt-get install sqlite3 -y
sqlite3 data.sqlite "PRAGMA integrity_check;"
```

### File Upload Issues

```bash
# Check upload directory permissions
ls -la server/uploads/

# Fix permissions if needed
chmod -R 755 server/uploads/
chown -R deploy:deploy server/uploads/
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

### High Memory Usage

```bash
# Check memory usage
free -h

# Check PM2 memory usage
pm2 monit

# Restart application if needed
pm2 restart stay-ready-api
```

### Can't Connect via SSH

1. Check DigitalOcean console access
2. Verify firewall rules: `sudo ufw status`
3. Check SSH service: `sudo systemctl status ssh`

---

## Security Best Practices

1. **Keep system updated**: `sudo apt update && sudo apt upgrade -y`
2. **Use SSH keys** instead of passwords
3. **Disable root login**: Edit `/etc/ssh/sshd_config`
4. **Set up fail2ban**: `sudo apt-get install fail2ban -y`
5. **Regular backups**: Automate database and file backups
6. **Monitor logs**: Regularly check application and system logs
7. **Use strong passwords**: For all services and databases
8. **Enable firewall**: Already configured with UFW
9. **Keep dependencies updated**: Run `npm audit` regularly
10. **Use environment variables**: Never commit secrets to Git

---

## Scaling Considerations

As your application grows:

1. **Upgrade Droplet**: Increase RAM and CPU
2. **Use Load Balancer**: For multiple instances
3. **Database**: Consider migrating to PostgreSQL or MySQL
4. **File Storage**: Use DigitalOcean Spaces for uploads
5. **CDN**: Use Cloudflare for static assets
6. **Caching**: Implement Redis for session management
7. **Monitoring**: Set up comprehensive monitoring (Datadog, New Relic)

---

## Quick Reference Commands

```bash
# Application management
pm2 status
pm2 logs stay-ready-api
pm2 restart stay-ready-api
pm2 stop stay-ready-api

# Nginx management
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t

# View logs
pm2 logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Database backup
cp data.sqlite backups/data.sqlite.$(date +%Y%m%d_%H%M%S)

# Update application
cd ~/Teachable
git pull
npm install
cd client && npm install && npm run build
pm2 restart stay-ready-api
```

---

## Support and Resources

- **DigitalOcean Documentation**: https://docs.digitalocean.com
- **PM2 Documentation**: https://pm2.keymetrics.io/docs
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/docs/

---

## Checklist

Before going live, ensure:

- [ ] All environment variables are set correctly
- [ ] SSL certificate is installed and working
- [ ] Stripe webhook is configured with production URL
- [ ] Database is initialized with school data
- [ ] Admin user is created
- [ ] File upload directories have correct permissions
- [ ] Backups are configured
- [ ] Monitoring is set up
- [ ] Firewall is configured
- [ ] Application is running with PM2
- [ ] Nginx is configured and running
- [ ] Frontend is deployed and connected to backend
- [ ] All API endpoints are tested
- [ ] Payment flow is tested
- [ ] Certificate generation is tested

---

**Congratulations!** Your application should now be running on DigitalOcean. 🚀

For issues or questions, refer to the troubleshooting section or check the application logs.
