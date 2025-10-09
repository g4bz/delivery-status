# Supabase PostgreSQL Setup Guide

This guide will walk you through setting up Supabase PostgreSQL as the database for your Delivery Manager Dashboard.

## Prerequisites
- A Supabase account (free tier available)
- Node.js installed on your machine

---

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://app.supabase.com/)
2. Sign in or create a free account
3. Click **"New Project"**
4. Fill in the project details:
   - **Name**: Delivery Dashboard (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the region closest to your users
5. Click **"Create new project"**
6. Wait a few minutes for your project to be provisioned

---

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, navigate to **Settings** → **API**
2. You'll find two important values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: A long JWT token
3. Keep these values handy for the next step

---

## Step 3: Configure Environment Variables

1. In your project root, create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

3. **Important**: Never commit the `.env` file to version control (it's already in `.gitignore`)

---

## Step 4: Run Database Migrations

You have two options to set up your database schema:

### Option A: Using Supabase SQL Editor (Recommended for beginners)

1. In your Supabase dashboard, navigate to **SQL Editor**
2. Click **"New query"**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL Editor
5. Click **"Run"** to execute
6. Repeat for `supabase/migrations/002_seed_data.sql` to populate sample data

### Option B: Using Supabase CLI (For advanced users)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-id
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

---

## Step 5: Verify Database Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see 4 tables:
   - `delivery_managers`
   - `accounts`
   - `weekly_statuses`
   - `action_items`
3. Click on each table to verify the structure and seed data

---

## Step 6: Start Your Application

```bash
npm run dev
```

Your app should now connect to Supabase and display the seeded data!

---

## Database Structure

### Tables Overview

#### `delivery_managers`
Stores delivery manager information
```sql
- id (UUID, primary key)
- name (VARCHAR)
- email (VARCHAR, unique)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `accounts`
Stores client accounts
```sql
- id (UUID, primary key)
- name (VARCHAR)
- manager_id (UUID, foreign key → delivery_managers)
- people (INTEGER)
- satisfaction_score_q1/q2/q3/q4 (INTEGER, 1-100)
- quarterly_comment_q1/q2/q3/q4 (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `weekly_statuses`
Tracks weekly health status
```sql
- id (UUID, primary key)
- account_id (UUID, foreign key → accounts)
- week (DATE)
- status (VARCHAR: 'healthy', 'attention', 'critical')
- people (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE constraint on (account_id, week)
```

#### `action_items`
Stores tasks and action items
```sql
- id (UUID, primary key)
- account_id (UUID, foreign key → accounts)
- manager_id (UUID, foreign key → delivery_managers)
- description (TEXT)
- due_date (DATE)
- completed (BOOLEAN)
- priority (VARCHAR: 'low', 'medium', 'high')
- created_date (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## Features Implemented

### Automatic Timestamps
All tables have triggers that automatically update the `updated_at` field when records are modified.

### Foreign Key Constraints
- Accounts reference delivery managers
- Weekly statuses reference accounts
- Action items reference both accounts and managers
- `ON DELETE CASCADE` ensures related records are cleaned up

### Indexes for Performance
Strategic indexes on:
- Foreign keys
- Frequently queried columns (week, completed status, due dates)
- Composite index on (account_id, week) for fast lookups

### Row Level Security (RLS)
RLS is enabled with permissive policies for development. **You should customize these for production!**

---

## Security Considerations

### Current Setup (Development)
The current RLS policies allow all operations:
```sql
CREATE POLICY "Allow all operations" ON table_name FOR ALL USING (true);
```

### Production Recommendations

1. **Enable Authentication**: Set up Supabase Auth for user login
2. **Restrict Policies**: Update RLS policies based on user roles

Example production policy:
```sql
-- Only authenticated users can read
CREATE POLICY "Authenticated users can read"
  ON delivery_managers FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only specific users can modify
CREATE POLICY "Managers can update"
  ON accounts FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM delivery_managers WHERE email = auth.email()
  ));
```

---

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Ensure your `.env` file exists in the project root
- Variable names must start with `VITE_` for Vite to recognize them
- Restart your dev server after creating/modifying `.env`

### Error: "Failed to fetch"
- Check that your Supabase project URL is correct
- Verify your anon key is copied correctly (no extra spaces)
- Check your internet connection
- Ensure your Supabase project is active (not paused)

### No data showing in the app
- Verify you ran the seed data migration (`002_seed_data.sql`)
- Check the Table Editor in Supabase to confirm data exists
- Open browser console for any error messages
- Verify RLS policies are set correctly

### Connection timeout
- Check if your Supabase project is paused (free tier pauses after inactivity)
- Go to your Supabase dashboard to wake it up

---

## Advanced Features

### Using Supabase Realtime
To enable real-time updates when data changes:

```javascript
// In your service file
import { supabase } from './config';

// Subscribe to changes
const subscription = supabase
  .channel('accounts-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'accounts' },
    (payload) => {
      console.log('Change received!', payload);
      // Refresh your data
    }
  )
  .subscribe();
```

### Database Backups
1. Navigate to **Database** → **Backups** in Supabase
2. Free tier: Daily backups for 7 days
3. Pro tier: Point-in-time recovery available

### Monitoring Performance
1. Go to **Database** → **Query Performance**
2. Identify slow queries
3. Add indexes as needed

---

## Migration Files

The project includes SQL migration files in `/supabase/migrations/`:
- `001_initial_schema.sql` - Creates all tables, indexes, triggers, and RLS policies
- `002_seed_data.sql` - Populates initial sample data

You can create additional migrations as your schema evolves.

---

## Useful Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## Next Steps

1. **Set up Authentication** - Add user login with Supabase Auth
2. **Customize RLS Policies** - Implement proper access control
3. **Deploy Your App** - Use Vercel, Netlify, or your preferred platform
4. **Enable Realtime** - Get live updates when data changes
5. **Add More Features** - Leverage Supabase Storage, Edge Functions, etc.

---

## Support

If you encounter issues:
1. Check the Supabase [Status Page](https://status.supabase.com/)
2. Visit [Supabase Discord](https://discord.supabase.com/)
3. Review [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)
