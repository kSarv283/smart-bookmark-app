# Smart Bookmark App

A real-time bookmark manager built with Next.js, Supabase, and Tailwind CSS.

## Features
- **Google OAuth Login**: Secure authentication.
- **Real-time Updates**: Bookmarks appear instantly across tabs/devices.
- **Privacy**: User-separated data using RLS (Row Level Security).
- **Responsive Design**: Styled with Tailwind CSS.

## Setup Instructions

### 1. Supabase Setup
1. Create a new project at [Supabase](https://supabase.com).
2. Go to the **SQL Editor** and run the following script to set up the database:

```sql
-- Create a table for bookmarks
create table bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table bookmarks enable row level security;

-- Create Policy: Users can only see their own bookmarks
create policy "Users can view their own bookmarks"
on bookmarks for select
using ( auth.uid() = user_id );

-- Create Policy: Users can insert their own bookmarks
create policy "Users can insert their own bookmarks"
on bookmarks for insert
with check ( auth.uid() = user_id );

-- Create Policy: Users can delete their own bookmarks
create policy "Users can delete their own bookmarks"
on bookmarks for delete
using ( auth.uid() = user_id );

-- Enable Realtime for the bookmarks table
alter publication supabase_realtime add table bookmarks;
```

3. Go to **Authentication > Providers** and enable **Google**.
   - You will need to set up a Google Cloud Project and get the Client ID and Secret.
   - Add the Redirect URL from Supabase to your Google Cloud credentials.

### 2. Environment Variables
1. Copy `.env.local.example` to `.env.local` (or use the one created).
2. Fill in your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Run Locally
```bash
npm install
npm run dev
```

## Deployment on Vercel
1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Add the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel project settings.
4. Deploy!
5. **Important**: Add your Vercel production URL to the **Redirect URLs** in your Supabase Authentication settings.

## Challenges & Solutions
- **Real-time Updates**: Used Supabase Realtime subscription in `BookmarkList` component to listen for `INSERT` and `DELETE` events.
- **Next.js App Router Auth**: Implemented middleware to manage session refreshing and used `@supabase/ssr` for cookie-based authentication.
