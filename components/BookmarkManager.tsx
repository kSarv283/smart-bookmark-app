'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useMemo } from 'react'
import { Plus, Loader2, Trash2, ExternalLink, Pencil, X, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Bookmark = {
    id: string
    title: string
    url: string
    created_at: string
}

export default function BookmarkManager({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)

    // Add Bookmark State
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    // Edit Bookmark State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editUrl, setEditUrl] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

    // Use useMemo to ensure the client is only created once and has a stable reference
    const supabase = useMemo(() => createClient(), [])
    const router = useRouter()


    // Sync with initialBookmarks when they change (e.g. on soft navigation/revalidate)
    useEffect(() => {
        setBookmarks(initialBookmarks)
    }, [initialBookmarks])

    // Window Focus Revalidation
    useEffect(() => {
        const refreshBookmarks = async () => {
            const { data } = await supabase
                .from('bookmarks')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) {
                setBookmarks(data)
                router.refresh() // Sync server components too
            }
        }

        const onFocus = () => {
            refreshBookmarks()
        }

        window.addEventListener('focus', onFocus)
        return () => window.removeEventListener('focus', onFocus)
    }, [supabase, router])

    // Subscribe to realtime changes as a backup/sync mechanism
    useEffect(() => {
        const channel = supabase
            .channel('realtime-bookmarks')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'bookmarks' },
                (payload: any) => {
                    console.log('Realtime change received:', payload)
                    if (payload.eventType === 'INSERT') {
                        // Avoid duplicate insert if we already added it optimistically
                        setBookmarks((prev) => {
                            if (prev.some(b => b.id === payload.new.id)) return prev
                            return [payload.new as Bookmark, ...prev]
                        })
                    } else if (payload.eventType === 'DELETE') {
                        setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
                    } else if (payload.eventType === 'UPDATE') {
                        setBookmarks((prev) => prev.map(b => b.id === payload.new.id ? payload.new as Bookmark : b))
                    }
                }
            )
            .subscribe((status: string) => {
                console.log('Realtime subscription status:', status)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url || !title) return

        setIsAdding(true)

        // Optimistic Update
        const optimisticId = crypto.randomUUID()
        const newBookmark: Bookmark = {
            id: optimisticId,
            title,
            url,
            created_at: new Date().toISOString()
        }

        setBookmarks(prev => [newBookmark, ...prev])
        setTitle('')
        setUrl('')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user')

            const { data, error } = await supabase.from('bookmarks').insert({
                title: newBookmark.title,
                url: newBookmark.url,
                user_id: user.id,
            }).select().single()

            if (error) throw error

            // Replace optimistic item with real one (mostly for ID sync)
            setBookmarks(prev => prev.map(b => b.id === optimisticId ? data : b))
            router.refresh()

        } catch (error) {
            console.error('Error adding bookmark:', error)
            alert('Error adding bookmark, rolling back.')
            // Rollback
            setBookmarks(prev => prev.filter(b => b.id !== optimisticId))
            setTitle(newBookmark.title)
            setUrl(newBookmark.url) // Restore input
        } finally {
            setIsAdding(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this bookmark?')) return

        // Optimistic Delete
        const previousBookmarks = [...bookmarks]
        setBookmarks(prev => prev.filter(b => b.id !== id))

        try {
            const { error } = await supabase.from('bookmarks').delete().eq('id', id)
            if (error) throw error
        } catch (error) {
            console.error('Error deleting bookmark:', error)
            alert('Error deleting bookmark')
            // Rollback
            setBookmarks(previousBookmarks)
        }
    }

    const startEditing = (bookmark: Bookmark) => {
        setEditingId(bookmark.id)
        setEditTitle(bookmark.title)
        setEditUrl(bookmark.url)
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditTitle('')
        setEditUrl('')
    }

    const handleUpdate = async () => {
        if (!editingId || !editTitle || !editUrl) return

        setIsUpdating(true)

        // Optimistic Update
        const previousBookmarks = [...bookmarks]
        setBookmarks(prev => prev.map(b => b.id === editingId ? { ...b, title: editTitle, url: editUrl } : b))

        const idToUpdate = editingId
        setEditingId(null) // Close edit mode immediately

        try {
            const { error } = await supabase
                .from('bookmarks')
                .update({ title: editTitle, url: editUrl })
                .eq('id', idToUpdate)

            if (error) throw error
        } catch (error) {
            console.error('Error updating bookmark:', error)
            alert('Error updating bookmark')
            // Rollback
            setBookmarks(previousBookmarks)
            setEditingId(idToUpdate) // Re-open edit mode
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="space-y-8">


            {/* Add Bookmark Form */}
            <form onSubmit={handleAdd} className="relative z-10 mx-auto max-w-4xl transform transition-all hover:scale-[1.01]">
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
                        disabled={isAdding}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {isAdding ? <Loader2 className="animate-spin h-5 w-5" /> : <Plus className="h-5 w-5" />}
                        <span className="ml-2 hidden sm:inline">Add</span>
                    </button>
                </div>
            </form>

            {/* Bookmark List */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {bookmarks.map((bookmark) => (
                    <div
                        key={bookmark.id}
                        className="group relative flex flex-col justify-between rounded-2xl border border-white/50 bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
                    >
                        {editingId === bookmark.id ? (
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="mt-1 w-full rounded-lg border-gray-200 bg-white/50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">URL</label>
                                    <input
                                        type="url"
                                        value={editUrl}
                                        onChange={(e) => setEditUrl(e.target.value)}
                                        className="mt-1 w-full rounded-lg border-gray-200 bg-white/50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex justify-end space-x-2 pt-2">
                                    <button
                                        onClick={cancelEditing}
                                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                                        title="Cancel"
                                        disabled={isUpdating}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                                        title="Save"
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <div className="flex items-start justify-between">
                                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1 w-full mr-2" title={bookmark.title}>
                                            {bookmark.title}
                                        </h3>
                                    </div>
                                    <a
                                        href={bookmark.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                                    >
                                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                        <span className="truncate">{new URL(bookmark.url).hostname}</span>
                                    </a>
                                </div>

                                <div className="mt-auto flex items-center justify-end space-x-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    <button
                                        onClick={() => startEditing(bookmark)}
                                        className="rounded-full p-2 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                        title="Edit bookmark"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(bookmark.id)}
                                        className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        title="Delete bookmark"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
            {bookmarks.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white/30 py-20 text-center">
                    <p className="text-lg font-medium text-gray-500">No bookmarks yet</p>
                    <p className="text-sm text-gray-400">Add your first one above!</p>
                </div>
            )}
        </div>
    )
}
