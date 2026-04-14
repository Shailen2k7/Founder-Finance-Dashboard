# 📊 Founder Finance Dashboard

Personal financial dashboard for Shailen (Nutrolis · Migrizo · Assignment).

## Stack
- **Frontend:** React 18 + Recharts
- **Database:** Supabase (Postgres)
- **Hosting:** Netlify (auto-deploy from GitHub)
- **AI:** Claude Sonnet via Anthropic API

## Features
- Smart bank statement import (CSV / Excel) with auto-categorisation
- Claude AI strategic analysis — health score, burn rate, runway, 90-day plan
- 3 bank accounts: LiveRightFit LLP (INR), Grownmind (INR), Jeet UK (GBP)
- Income channels: Amazon, Flipkart, Migrizo, Assignment
- Mobile-first with bottom tab navigation

## Local Development
```bash
npm install
npm run dev
```

## Deploy
Pushes to `main` branch auto-deploy to Netlify via `netlify.toml`.
