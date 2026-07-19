# Deployment Guide

## Prerequisites
- Node.js 14+
- PostgreSQL database
- GitHub account
- Hosting provider (Heroku, Railway, Render, or similar)

## Backend Deployment (Heroku)

1. Create a Heroku app
```bash
heroku create your-app-name
```

2. Add PostgreSQL addon
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

3. Set environment variables
```bash
heroku config:set JWT_SECRET=your_secret_key
heroku config:set STRIPE_SECRET_KEY=your_stripe_key
```

4. Deploy
```bash
git push heroku main
```

## Frontend Deployment (Vercel or Netlify)

### Vercel
1. Install Vercel CLI
```bash
npm i -g vercel
```

2. Deploy
```bash
cd frontend
vercel
```

### Netlify
1. Build the app
```bash
cd frontend
npm run build
```

2. Deploy to Netlify
```bash
netlify deploy --prod --dir=build
```

## Environment Variables

Make sure to set these in your hosting provider:
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Stripe public key

## Database Setup

Run the SQL schema on your production database:
```bash
psql -U your_username -d your_database -f backend/src/database/schema.sql
```
