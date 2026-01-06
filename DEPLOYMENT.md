# Deployment Guide

This guide covers deploying the Stay Ready Training Academy platform to production.

## Backend Deployment

### Option 1: Heroku

1. **Install Heroku CLI** and login:
   ```bash
   heroku login
   ```

2. **Create a Heroku app**:
   ```bash
    heroku create stay-ready-training-academy-api
   ```

3. **Add MongoDB Atlas**:
   - Create a MongoDB Atlas account
   - Create a cluster and get connection string
   - Add to Heroku config:
     ```bash
     heroku config:set MONGODB_URI="your_mongodb_atlas_connection_string"
     ```

4. **Set environment variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PORT=5000
   heroku config:set TEACHABLE_API_KEY="your_key"
   heroku config:set STRIPE_SECRET_KEY="your_key"
   # ... add all other env variables
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

### Option 2: Railway

1. **Connect your repository** to Railway
2. **Add MongoDB** service or use MongoDB Atlas
3. **Set environment variables** in Railway dashboard
4. **Deploy** automatically on push

### Option 3: AWS/DigitalOcean

Similar process - set up a Node.js server, configure environment variables, and deploy.

## Frontend Deployment

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd client
   vercel
   ```

3. **Set environment variables** in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` - Your backend API URL
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe key

4. **Configure custom domain** (optional)

### Option 2: Netlify

1. **Build the app**:
   ```bash
   cd client
   npm run build
   ```

2. **Deploy** via Netlify dashboard or CLI
3. **Set environment variables** in Netlify dashboard

## Environment Variables Checklist

### Backend (.env)
- [ ] `MONGODB_URI`
- [ ] `TEACHABLE_API_KEY`
- [ ] `TEACHABLE_SCHOOL_ID`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `SCHOOL_NAME`
- [ ] `SCHOOL_LICENSE_NUMBER`
- [ ] `INSTRUCTOR_NAME`
- [ ] `INSTRUCTOR_SIGNATURE_PATH`

### Frontend (.env.local)
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Stripe Webhook Setup

1. **Create webhook endpoint** in Stripe dashboard
2. **Set endpoint URL** to: `https://your-backend-url.com/api/payments/webhook`
3. **Copy webhook secret** and add to environment variables
4. **Select events**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

## Post-Deployment Checklist

- [ ] Test course enrollment flow
- [ ] Test payment processing
- [ ] Test certificate generation
- [ ] Verify Teachable integration
- [ ] Set up SSL certificate (HTTPS)
- [ ] Configure CORS for your frontend domain
- [ ] Set up monitoring/logging
- [ ] Test exam submission
- [ ] Verify certificate downloads work

## Custom Domain Setup

### Backend
1. Point your domain to your hosting provider
2. Configure DNS records
3. Update CORS settings to allow your domain

### Frontend
1. Add custom domain in Vercel/Netlify
2. Update DNS records as instructed
3. SSL certificate is automatically provisioned

## Monitoring

Consider setting up:
- **Error tracking**: Sentry, Rollbar
- **Analytics**: Google Analytics, Mixpanel
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Log aggregation**: Loggly, Papertrail

## Security Considerations

1. **Use environment variables** for all secrets
2. **Enable HTTPS** everywhere
3. **Set up rate limiting** on API endpoints
4. **Validate all user inputs**
5. **Use secure session management**
6. **Regular security updates** for dependencies
7. **Backup database** regularly

## Scaling Considerations

- Use a CDN for static assets
- Consider Redis for session storage
- Use MongoDB Atlas for managed database
- Set up load balancing for high traffic
- Implement caching where appropriate

