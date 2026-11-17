# Our Little Fund 💕

A beautiful, private savings app for couples to build their future together.

![Our Little Fund](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel)

## ✨ Features

- 💑 **Shared Savings Workspace** - Private space for two people with invite codes
- 📊 **Beautiful Dashboard** - Animated progress rings, contribution tracking, streaks
- 🔔 **Two Monthly Reminders** - Automatic push notifications (1st week & month-end)
- 📱 **PWA Support** - Installable on mobile, works offline
- 💳 **UPI QR Code Payments** - Upload your QR code, scan to pay
- 🎯 **Savings Goals** - Create multiple goals with progress tracking
- 📈 **Analytics** - Monthly charts, partner comparisons, savings streaks
- 🔐 **Secure** - Supabase Auth, Row Level Security, encrypted storage
- 🌙 **Dark Mode** - Beautiful light/dark themes

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### 1. Clone & Install

```bash
cd "savings for me and ammu"
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_storage_setup.sql`
3. Go to Authentication → Settings and enable **Email** provider
4. Go to Storage and create buckets: `qr-codes`, `avatars`, `goal-covers` (or run migration 002)
5. Get your project URL and anon key from Settings → API

### 3. Generate VAPID Keys (for Push Notifications)

```bash
npx web-push generate-vapid-keys
```

Save the public and private keys.

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your-project-id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Our Little Fund"

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# Cron Security (generate a random 32+ char string)
CRON_SECRET=your-super-secure-random-string-here
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📱 PWA Installation

The app is a Progressive Web App. Users can:
- **Chrome/Edge**: Click install icon in address bar
- **Safari iOS**: Share → Add to Home Screen
- **Android**: Menu → Install App

## 🔔 Push Notifications Setup

### Development
1. Run `npm run dev`
2. Open browser dev tools → Application → Service Workers
3. Check "Update on reload" 
4. Allow notifications when prompted

### Production (Vercel)
1. Deploy to Vercel (see below)
2. Cron job runs daily at 03:30 UTC (9:00 AM IST)
3. Checks for due reminders and sends push notifications
4. Requires `CRON_SECRET` and VAPID keys in Vercel environment variables

## 🚀 Deploy to Vercel

### Option 1: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel
```

### Option 2: GitHub Integration
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Required Vercel Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_PROJECT_ID
NEXT_PUBLIC_APP_URL (your production URL)
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
CRON_SECRET
```

### Cron Job Configuration
The `vercel.json` includes a cron job that runs daily at 03:30 UTC (9:00 AM IST):
```json
"crons": [
  {
    "path": "/api/cron/reminders",
    "schedule": "30 3 * * *"
  }
]
```

The cron endpoint is protected by `CRON_SECRET` header.

## 🗄️ Database Schema

Key tables:
- `profiles` - User profiles (extends auth.users)
- `savings_workspaces` - Couple's shared workspace
- `workspace_members` - Links users to workspaces (owner/member)
- `savings_goals` - Savings targets with progress
- `contributions` - Individual savings entries
- `reminder_settings` - Monthly reminder tracking
- `notification_subscriptions` - Push notification endpoints
- `notification_deliveries` - Audit log

All tables have **Row Level Security (RLS)** policies ensuring users only access their workspace data.

## 🎨 Design System

### Colors
- **Cream**: `#FAF8F5` (background)
- **Blush**: `#F4E5E8` (secondary)
- **Rose**: `#C98798` (primary/accent)
- **Lavender**: `#EAE5F5` (tertiary)
- **Sage**: `#DCE8DD` (success)
- **Charcoal**: `#29272B` (text)

### Fonts
- **Display**: Playfair Display (headings)
- **Body**: DM Sans (UI text)

### Components
Built with shadcn/ui + Radix UI primitives:
- Button, Card, Input, Select, Switch, Avatar
- Dialog, Toast, Dropdown, Tooltip
- Progress, ScrollArea, Tabs

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/cron/          # Cron job endpoints
│   ├── auth/              # Auth callbacks
│   ├── dashboard/         # Main dashboard
│   ├── contributions/     # Contribution history
│   ├── add-contribution/  # Add new contribution
│   ├── goals/             # Savings goals
│   ├── analytics/         # Charts & insights
│   ├── pay/               # UPI QR payment page
│   ├── reminders/         # Calendar & reminders
│   └── settings/          # User & workspace settings
├── components/
│   ├── ui/                # Reusable UI components
│   └── layout/            # Header, navigation
├── lib/
│   ├── actions/           # Server Actions
│   ├── supabase/          # Supabase clients
│   └── utils.ts           # Helper functions
├── hooks/                 # Custom React hooks
├── stores/                # Zustand state stores
└── types/                 # TypeScript types
```

## 🔒 Security

- **Authentication**: Supabase Auth with magic links
- **Authorization**: RLS policies on all tables
- **API Protection**: Cron endpoint secured with secret
- **Data Privacy**: No banking credentials stored
- **HTTPS Only**: Enforced in production

## 🛠️ Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
npm run db:generate  # Generate Supabase types
npm run db:push      # Push migrations to Supabase
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and type checks
5. Submit a pull request

## 📄 License

MIT License - feel free to use for your own savings journey!

## 💕 Made with Love

Built for couples who believe that **little by little, together** builds something beautiful.

---

### Need Help?

- Check the [Supabase Docs](https://supabase.com/docs)
- Check the [Next.js Docs](https://nextjs.org/docs)
- Check the [Vercel Docs](https://vercel.com/docs)

For issues with this project, please open a GitHub issue.