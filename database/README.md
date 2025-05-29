# Supabase Setup Guide for NextAuth.js

This guide will help you set up Supabase as your cloud database for NextAuth.js authentication.

## 🌟 Why Supabase?

- ✅ **Global Access**: Works from anywhere in the world
- ✅ **Always Online**: Cloud-hosted, no need to keep your computer running
- ✅ **Free Tier**: Generous free tier for development and small projects
- ✅ **Built-in Auth**: Additional authentication features if needed
- ✅ **Real-time**: Built-in real-time subscriptions
- ✅ **Easy Setup**: No local database installation required

## 🚀 Step-by-Step Setup

### 1. Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Verify your email if required

### 2. Create a New Project

1. Click "New Project"
2. Choose your organization (or create one)
3. Fill in project details:
   - **Name**: `perplexed-ai` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., US East, Europe West)
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

### 3. Get Your Project Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **Project API keys** → **anon public** key
   - **Project API keys** → **service_role secret** key

### 4. Set Up NextAuth Tables

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New query"
3. Copy and paste this SQL to create NextAuth tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT UNIQUE,
    email_verified TIMESTAMPTZ,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(provider, provider_account_id)
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification tokens table
CREATE TABLE verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(identifier, token)
);

-- Indexes for performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);
CREATE INDEX idx_users_email ON users(email);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for NextAuth (allows service role to manage all data)
CREATE POLICY "Allow service role full access" ON users FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow service role full access" ON verification_tokens FOR ALL USING (true);
```

4. Click "Run" to execute the SQL

### 5. Update Environment Variables

Update your `.env.local` file with your Supabase credentials:

```bash
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="nAykRdqTZeTwCzLqeL+dlSnUWXSNKeAFIWm8tQTgErQ="

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🧪 Test Your Setup

1. **Test Supabase Connection:**
   ```bash
   npm run db:test
   ```

2. **Start your development server:**
   ```bash
   npm run dev
   ```

3. **Check health endpoint:**
   ```bash
   npm run db:health
   ```
   Or visit: `http://localhost:3000/api/health/db`

4. **Test authentication:**
   - Go to your account page
   - Try signing in with Google
   - Check if user data appears in Supabase dashboard

## 🔍 Verify in Supabase Dashboard

After testing authentication:

1. Go to **Table Editor** in Supabase
2. Check the `users` table - you should see your user data
3. Check the `accounts` table - you should see OAuth account links
4. Check the `sessions` table - you should see active sessions

## 🚀 Production Deployment

For production (Vercel, Netlify, etc.):

1. Add the same environment variables to your hosting platform
2. Update `NEXTAUTH_URL` to your production domain
3. Update Google OAuth redirect URLs to include your production domain
4. Consider upgrading your Supabase plan for higher limits

## 💡 Supabase Features You Can Use

- **Real-time subscriptions**: Listen to database changes
- **Storage**: File uploads and management
- **Edge Functions**: Serverless functions
- **Auth**: Additional authentication methods
- **Dashboard**: Visual database management

## 🔧 Troubleshooting

### Common Issues:

1. **"relation does not exist" error**: Make sure you ran the SQL setup script
2. **RLS policy error**: Ensure Row Level Security policies are created
3. **Connection error**: Check your environment variables
4. **CORS error**: Ensure your domain is added to Supabase settings

### Getting Help:

- [Supabase Documentation](https://supabase.com/docs)
- [NextAuth.js Supabase Adapter](https://authjs.dev/getting-started/adapters/supabase)
- [Supabase Discord Community](https://discord.supabase.com/)

## 📊 Free Tier Limits

Supabase free tier includes:
- 500MB database space
- 2GB bandwidth per month
- 50,000 monthly active users
- Unlimited API requests

Perfect for development and small to medium projects! 