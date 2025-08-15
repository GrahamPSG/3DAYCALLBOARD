# 3-Day Minimum Call Board

A responsive web application for tracking HVAC and Plumbing team performance at Paris Service Group. Features automatic daily shifts, weather integration, SMS alerts, and real-time data entry.

## 🚀 Features

- **5-day rolling window** (Yesterday, Today, +1, +2, +3 days)
- **Automatic daily shift** at 6 AM PST
- **Weather integration** for North Vancouver
- **SMS alerts** at 2 PM PST for performance thresholds
- **Real-time calculations** (Min Goal = Tech Count × 3)
- **Conditional formatting** with color-coded performance indicators
- **Day locking** (Yesterday locked, admin unlock for 10 minutes)
- **Responsive design** for desktop, tablet, and mobile
- **Auto-refresh** every 2 minutes

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS, React Query
- **Backend**: Node.js 20, Prisma ORM, PostgreSQL
- **External APIs**: OpenWeather API, Twilio SMS
- **Hosting**: Vercel with serverless functions and cron jobs

## 📋 Prerequisites

Before setting up the application, you'll need:

1. **Neon Postgres Database**
   - Sign up at [https://neon.tech](https://neon.tech)
   - Create a new database
   - Copy the connection string

2. **Weather Data**
   - No API key required! Weather data is automatically scraped from wttr.in
   - Provides real-time weather for North Vancouver

3. **Twilio Account** (for SMS alerts)
   - Sign up at [https://www.twilio.com](https://www.twilio.com)
   - Get Account SID, Auth Token, and phone number

## 🔧 Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your actual values:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:5432/callboard?sslmode=require"
   
   # Weather (No API key needed - uses web scraping)
   # Weather data is automatically fetched from wttr.in for North Vancouver
   
   # Twilio SMS
   TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   TWILIO_FROM_PHONE="+16045551234"
   ALERT_PHONE_NUMBERS="+16045555678,+17785555678"
   
   # Security
   SECRET_URL_KEY="your-secret-url-key-minimum-32-chars"
   CRON_SECRET="your-cron-secret-key"
   ADMIN_KEY="your-admin-secret-key"
   
   # Application
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

3. **Database setup:**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed with initial data
   npm run db:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   ```
   http://localhost:3000?key=your-secret-url-key-minimum-32-chars
   ```

## 🌐 Production Deployment

1. **Push to GitHub and deploy to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Configure custom domain** (e.g., `board.parisservice.ca`)
4. **Verify cron jobs** are scheduled correctly

## 📱 Usage

### Daily Operations
1. **View current status**: Access the main board URL
2. **Update data**: Click on any editable day cell to enter technician count, actual jobs, and aged opportunities
3. **Monitor alerts**: SMS alerts sent at 2 PM PST if targets not met

### Calculations
- **Minimum Goal** = Tech Count × 3
- **Variance** = Actual Jobs - Minimum Goal
- **Aged Percentage** = (Aged Opportunities ÷ Actual Jobs) × 100

### Targets
- Yesterday/Today: 100%, Tomorrow: 66%, +2 Days: 33%, +3 Days: 15%

## 🎨 Color Coding
- **Green**: On or above target
- **Red**: Below target
- **Yellow**: Locked day
- **Gray**: Future day (+3, greyed out)

## 📝 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with initial data
npm run db:studio    # Open Prisma Studio
```
