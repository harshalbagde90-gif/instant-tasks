# Supabase Database Setup

## IMPORTANT: Run the SQL Migration First! ⚠️

Before using the app with cloud storage, you **MUST** create the required database tables in Supabase.

### Steps to Create Tables:

#### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `instant-tasks`

2. **Navigate to SQL Editor**
   - Click on `SQL Editor` in the left sidebar
   - Click `New Query`

3. **Copy & Paste Migration SQL**
   - Open the file: `supabase/migrations/20260215_create_task_tables.sql`
   - Copy ALL the SQL content
   - Paste it into the Supabase SQL Editor

4. **Run the Migration**
   - Click `Run` or press `Ctrl+Enter`
   - Wait for "Success: no rows returned" message

5. **Verify Tables Created**
   - Click on `Table Editor` in sidebar
   - You should see 4 new tables:
     - ✅ `tasks`
     - ✅ `categories`
     - ✅ `tags`
     - ✅ `big_data_sheets`

#### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migration
supabase db push
```

---

## What the Migration Creates:

### Tables:
1. **tasks** - Stores user tasks (basic & advanced mode)
2. **categories** - User's custom categories
3. **tags** - User's custom tags
4. **big_data_sheets** - Big Data mode sheets

### Security:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own data
- ✅ Automatic `created_at` and `updated_at` timestamps

### Features:
- ✅ Foreign key constraints
- ✅ Indexes for fast queries
- ✅ Cascading deletes (delete user = delete all data)

---

## After Running Migration:

Once the migration is complete:

1. **Restart your app**: `npm run dev`
2. **Login to the app**: Your data will now sync to Supabase
3. **Access from any device**: Your tasks are now in the cloud!

---

## Troubleshooting:

### Error: "relation tasks does not exist"
- **Solution**: You haven't run the migration yet. Follow steps above.

### Error: "permission denied for table tasks"
- **Solution**: RLS policies may not be applied. Re-run the migration.

### Migration fails with errors
- **Solution**: 
  1. Check if tables already exist (Table Editor)
  2. If they exist, drop them first:
     ```sql
     DROP TABLE IF EXISTS tasks CASCADE;
     DROP TABLE IF EXISTS categories CASCADE;
     DROP TABLE IF EXISTS tags CASCADE;
     DROP TABLE IF EXISTS big_data_sheets CASCADE;
     ```
  3. Re-run the migration

---

## Need Help?

1. Check Supabase Logs: Dashboard > Logs
2. Check Browser Console: F12 > Console tab
3. Verify API Key is set in `.env`:
   ```
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
