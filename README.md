# Smart Bookmark App

## About The Project
A modern, real-time bookmark manager that allows users to save, organize, and access their favorite links securely. Built with a focus on privacy, real-time synchronization, and a premium user experience.

## Features
- **Google OAuth Authentication**: Seamless sign-up and login experience.
- **Real-time Updates**: Bookmarks sync instantly across all devices without refreshing.
-   **Privacy Focused**: Strict data isolation ensuring users only see their own bookmarks.
-   **Premium UI**: Glassmorphism design, smooth animations, and responsive layout.
-   **User Profile**: Dedicated profile section with avatar and sign-out functionality.

## Tech Stack
-   **Frontend**: Next.js 15 (App Router), React, Tailwind CSS
-   **Backend**: Supabase (Database, Auth, Realtime)
-   **Icons**: Lucide React

## Challenges & Solutions

During development, we encountered several key challenges:

### 1. UI Element Overlapping
*   **Problem**: The User Profile dropdown menu was overlapping with the "Add Bookmark" input field below it, making the UI cluttered and functional elements inaccessible.
*   **Solution**: Implemented a strict **Z-Index hierarchy**. The Header container was assigned `z-20` and the Dropdown menu `z-50`, ensuring the dropdown always floats above the main content layer.

### 2. Confusing Authentication Flow
*   **Problem**: The requirement asked for distinct "Sign Up" and "Log In" buttons, but OAuth technically handles both with a single action.
*   **Solution**: Created a togglable UI on the login page. The "Sign Up" mode forces the Google account selection prompt (`prompt: 'select_account'`), providing a distinct "registration" feel compared to the standard login.

### 3. Real-time Data Sync
*   **Problem**: Users needed to see new bookmarks immediately without manually refreshing the page.
*   **Solution**: Leveraged **Supabase Realtime subscriptions** (`postgres_changes`) to listen for database `INSERT` and `DELETE` events, automatically updating the local state.

## Basic Setup Guide

Follow these steps to run the project locally on your machine.

### Prerequisites
- Node.js installed
- A Supabase account

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/smart-bookmark-app.git
    cd smart-bookmark-app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup**:
    Run the following SQL in your Supabase SQL Editor to set up the table and security policies:
    ```sql
    -- Create table
    create table bookmarks (
      id uuid default uuid_generate_v4() primary key,
      user_id uuid references auth.users not null,
      title text not null,
      url text not null,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- Enable Security & Realtime
    alter table bookmarks enable row level security;
    alter publication supabase_realtime add table bookmarks;

    -- Create Policy
    create policy "Users can see own data" on bookmarks for select using (auth.uid() = user_id);
    create policy "Users can insert own data" on bookmarks for insert with check (auth.uid() = user_id);
    create policy "Users can delete own data" on bookmarks for delete using (auth.uid() = user_id);
    ```

5.  **Run the App**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.
