import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AddBookmark from '@/components/AddBookmark'
import BookmarkList from '@/components/BookmarkList'
import UserProfile from '@/components/UserProfile'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch initial bookmarks serverside
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-gray-50 to-gray-50 py-10 text-gray-800">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-200 opacity-30 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-200 opacity-30 blur-[100px] animate-pulse"></div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between rounded-2xl bg-white/60 p-6 shadow-xl backdrop-blur-xl border border-white/50 relative z-20">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Bookmarks</h1>
            <p className="text-sm text-gray-500 mt-1">Managed & Secured</p>
          </div>

          <UserProfile user={user} />
        </div>

        <div className="space-y-8">
          <AddBookmark />
          <BookmarkList initialBookmarks={bookmarks || []} />
        </div>
      </div>
    </div>
  )
}
