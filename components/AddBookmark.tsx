'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AddBookmark() {
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url || !title) return

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user')

            const { error } = await supabase.from('bookmarks').insert({
                title,
                url,
                user_id: user.id,
            })

            if (error) throw error

            setUrl('')
            setTitle('')
            router.refresh()
        } catch (error) {
            console.error('Error adding bookmark:', error)
            alert('Error adding bookmark')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="relative z-10 mx-auto max-w-4xl transform transition-all hover:scale-[1.01]">
            <div className="flex flex-col gap-2 rounded-2xl border border-white/50 bg-white/70 p-3 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
                <div className="flex-1">
                    <label htmlFor="title" className="sr-only">Title</label>
                    <input
                        id="title"
                        type="text"
                        placeholder="Bookmark Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-xl border-none bg-transparent px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                        required
                    />
                </div>
                <div className="hidden h-8 w-px bg-gray-200 sm:block"></div>
                <div className="flex-1">
                    <label htmlFor="url" className="sr-only">URL</label>
                    <input
                        id="url"
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full rounded-xl border-none bg-transparent px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    <span className="ml-2 hidden sm:inline">Add</span>
                </button>
            </div>
        </form>
    )
}
