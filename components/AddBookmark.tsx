
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'

export default function AddBookmark() {
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

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
        } catch (error) {
            console.error('Error adding bookmark:', error)
            alert('Error adding bookmark')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mb-8 rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Add New Bookmark</h3>
            <div className="flex flex-col gap-4 sm:flex-row">
                <input
                    type="text"
                    placeholder="Title (e.g., Google)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                />
                <input
                    type="url"
                    placeholder="URL (https://...)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center rounded-md bg-indigo-600 px-6 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Plus />}
                    <span className="ml-2 hidden sm:inline">Add</span>
                </button>
            </div>
        </form>
    )
}
