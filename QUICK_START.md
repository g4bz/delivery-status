# Quick Start Guide

## ⚡ Fast Setup Instructions

### 1. Environment Variables (Already Done!)
Your `.env` file is already configured with Supabase credentials.

### 2. Run Database Migrations

Go to your Supabase project and run these SQL scripts **in order**:

#### Step 1: Create Schema
1. Open [Supabase SQL Editor](https://app.supabase.com/project/rngwmoxllrkipvdbqntf/sql)
2. Click **"New query"**
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click **"Run"**

#### Step 2: Seed Initial Data
1. Create another new query
2. Copy and paste the contents of `supabase/migrations/002_seed_data.sql`
3. Click **"Run"**

#### Step 3: Create Users Table (for Login)
1. Create another new query
2. Copy and paste the contents of `supabase/migrations/003_users_table.sql`
3. Click **"Run"**

### 3. Start the Application

```bash
npm run dev
```

### 4. Login

Use these credentials:
- **Username:** `admin`
- **Password:** `admin$`

## ✨ New Features

### 🔐 Authentication
- Secure login page
- User session management
- Logout functionality

### 🔔 Notification System
- **Orange notification banner** shows action items due today or this week
- **Pulsing bell icon** next to accounts with due actions
- **Orange left border** on table rows with notifications
- **Color-coded action items:**
  - **Red background**: Due TODAY
  - **Orange background**: Due this week
  - **White background**: Future or completed

### Visual Indicators
- Animated bell icons on accounts with pending actions
- Due date highlighting in action item lists
- User info display in header
- Easy logout button

## 📊 How It Works

### Notification Logic
The system checks for action items that are:
1. **Due today** (highest priority - shown in red)
2. **Due within the selected week** (shown in orange)
3. **Not completed**

### Color System
- 🔴 **Red** - Critical/Due Today
- 🟠 **Orange** - Attention Needed/Due This Week
- 🟢 **Green** - Healthy
- 🔵 **Blue** - Info/Actions

## 🗃️ Database Tables

After running migrations, you'll have:
- `delivery_managers` - Manager information
- `accounts` - Client accounts
- `weekly_statuses` - Weekly health tracking
- `action_items` - Tasks and action items
- `users` - Authentication credentials

## 🔧 Troubleshooting

### "Invalid username or password"
Make sure you ran migration `003_users_table.sql` which creates the admin user.

### No data showing
Make sure you ran all 3 migration files in order.

### Can't login
1. Check Supabase Table Editor
2. Verify the `users` table exists
3. Verify there's a row with username='admin' and password_hash='admin$'

## 🚀 You're All Set!

Your delivery dashboard is now running with:
- ✅ Real PostgreSQL database
- ✅ User authentication
- ✅ Action item notifications
- ✅ Visual indicators for due tasks
