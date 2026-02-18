'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// This action is strictly for the Sign Out button in the main page
export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

