# Database Migrations

## Running the User Presence Migration

To add user presence tracking to your database, you need to run the `003_user_presence.sql` migration.

### Option 1: Using Supabase CLI (Recommended)

```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 2: Manually in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `003_user_presence.sql`
4. Paste and execute the SQL

### What the migration does:

1. **Adds fields to users table:**
   - `profile_picture` (TEXT) - URL or path to user's profile picture
   - `initials` (VARCHAR) - User's initials for avatar fallback

2. **Creates user_presence table:**
   - Tracks which users are currently online
   - Stores user info for quick access (username, full_name, email, profile_picture, initials)
   - Includes `last_seen` timestamp and `is_online` boolean flag

3. **Creates cleanup function:**
   - `cleanup_stale_presence()` - Marks users as offline if they haven't been seen in 5 minutes

4. **Indexes and RLS policies:**
   - Indexes for fast lookups on user_id, is_online, and last_seen
   - Row Level Security enabled with permissive policy (customize as needed)

### Testing the Feature

After running the migration:

1. Log in to your dashboard
2. You should see an "Active Users" widget in the top-right corner showing "1 Online"
3. Click on it to expand and see details
4. Log in from another browser/incognito window
5. Both sessions should show "2 Online" with both users visible
6. Log out from one session - it should disappear from the active users list

### Heartbeat System

The application automatically sends a heartbeat every 2 minutes to keep the user's presence active. If a user closes the browser without logging out, they will be marked as offline after 5 minutes of inactivity.
