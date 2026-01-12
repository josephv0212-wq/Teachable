# Deployment Guide — Stay Ready Training Academy

This guide deploys the app to an Ubuntu 22.04 DigitalOcean VPS, using pm2 for process management, Nginx for reverse proxy/SSL, and Squarespace DNS for the domain `stayreadyinstitute.com`.

## Overview
- Stack: Express API (port 5000), Next.js frontend (port 3000), SQLite database `data.sqlite`.
- Process manager: pm2 (with systemd integration).
- Reverse proxy + SSL: Nginx + Let’s Encrypt.
- Domain/DNS: Squarespace A/CNAME records pointing to the Droplet IP.

## 0) Prepare the server
1) SSH in as root, create deploy user, harden basics:
```bash
adduser deploy && usermod -aG sudo deploy
rsync -a ~/.ssh /home/deploy && chown -R deploy:deploy /home/deploy/.ssh
su - deploy
```
2) Update and install essentials:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git ufw curl nginx
sudo ufw allow OpenSSH && sudo ufw allow http && sudo ufw allow https && sudo ufw enable
```
3) Install Node.js 20 + pm2:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

## 1) Get the code and install dependencies
```bash
cd /var/www
git clone <your-repo-url> Teachable
cd Teachable
npm run install:all   # installs root + client deps
```

## 2) Configure environment
Create `/var/www/Teachable/.env` (production values):
```
PORT=5000
NODE_ENV=production

# Teachable (if used)
TEACHABLE_API_KEY=...
TEACHABLE_SCHOOL_ID=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...

# School info
SCHOOL_NAME=Stay Ready Training Academy
SCHOOL_LICENSE_NUMBER=...
INSTRUCTOR_NAME=...
INSTRUCTOR_SIGNATURE_PATH=./server/uploads/signatures/signature.png

# Frontend
NEXT_PUBLIC_API_URL=https://stayreadyinstitute.com/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```
Notes:
- SQLite lives at `/var/www/Teachable/data.sqlite`; back it up.
- Ensure `server/uploads/{certificates,logos,signatures,course-materials}` exist and are writable by `deploy`.

## 3) Build the frontend
```bash
cd /var/www/Teachable
cd client && npm run build && cd ..
```

## 4) Seed baseline data (optional)
Run from project root as needed:
```bash
node server/scripts/initSchool.js
node server/scripts/initMembershipPlans.js
node server/scripts/setAdminUser.js
```

## 5) Run with pm2 (API + Next.js)
Create/edit `/var/www/Teachable/ecosystem.config.js`:
```js
module.exports = {
  apps: [
    {
      name: 'stayready-api',
      cwd: '/var/www/Teachable',
      script: 'node',
      args: 'server/index.js',
      env: { PORT: 5000, NODE_ENV: 'production' }
    },
    {
      name: 'stayready-web',
      cwd: '/var/www/Teachable/client',
      script: 'npm',
      args: 'run start',
      env: { NODE_ENV: 'production', PORT: 3000 }
    }
  ]
};
```
Start and persist:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd   # run the printed sudo command
```
Check status/logs:
```bash
pm2 status
pm2 logs stayready-api
pm2 logs stayready-web
```

## 6) Nginx reverse proxy + SSL
Create `/etc/nginx/sites-available/stayreadyinstitute`:
```
server {
    listen 80;
    server_name stayreadyinstitute.com www.stayreadyinstitute.com;

    client_max_body_size 20m;

    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /var/www/Teachable/server/uploads/;
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable and test:
```bash
sudo ln -s /etc/nginx/sites-available/stayreadyinstitute /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### SSL via Let’s Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d stayreadyinstitute.com -d www.stayreadyinstitute.com
sudo systemctl reload nginx
```

## 7) Squarespace DNS
In Squarespace DNS settings:
- A record: `@` → your Droplet public IP
- CNAME: `www` → `@` (or A → same IP)
Remove any parking/default Squarespace records that conflict. Wait for propagation; verify with:
```bash
dig stayreadyinstitute.com +short
```

## 8) Validate
- API health: `curl -I http://stayreadyinstitute.com/api/health`
- Site: `https://stayreadyinstitute.com` should load the Next.js app.
- File serving: upload a file (if applicable) and hit `/uploads/...`.
- Stripe: test mode first (test keys + cards).

## 9) Updates and restarts
```bash
cd /var/www/Teachable
git pull
npm ci && cd client && npm ci && npm run build && cd ..
pm2 restart stayready-api stayready-web
pm2 save
```

## 10) Backups and ops
- Backup `data.sqlite` and `server/uploads/` regularly.
- Logs: `pm2 logs <name>`, `journalctl -u nginx`.
- Security: keep SSH hardened; run `sudo apt update && sudo apt upgrade -y` periodically.

## Quick reference
- Start/stop/restart: `pm2 start|stop|restart stayready-api stayready-web`
- View pm2 status: `pm2 status`
- Nginx config: `/etc/nginx/sites-available/stayreadyinstitute`
- Env file: `/var/www/Teachable/.env`
- App paths: API on port 5000, Web on port 3000 (both bound to localhost)
