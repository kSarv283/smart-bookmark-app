
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Trash2, ExternalLink, Pencil, X, Check, Loader2 } from 'lucide-react'

type Bookmark = {
    id: string
    title: string
    url: string
    created_at: string
}

export default function BookmarkList({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editUrl, setEditUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        setBookmarks(initialBookmarks)
    }, [initialBookmarks])

    useEffect(() => {
        const channel = supabase
            .channel('realtime-bookmarks')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookmarks',
                },
                (payload) => {
                    console.log('Change received!', payload)
                    if (payload.eventType === 'INSERT') {
                        setBookmarks((prev) => [payload.new as Bookmark, ...prev])
                    } else if (payload.eventType === 'DELETE') {
                        setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
                    } else if (payload.eventType === 'UPDATE') {
                        setBookmarks((prev) => prev.map(b => b.id === payload.new.id ? payload.new as Bookmark : b))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this bookmark?')) return
        try {
            const { error } = await supabase.from('bookmarks').delete().eq('id', id)
            if (error) throw error
        } catch (error) {
            console.error('Error deleting bookmark:', error)
            alert('Error deleting bookmark')
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
        setLoading(true)
        try {
            const { error } = await supabase
                .from('bookmarks')
                .update({ title: editTitle, url: editUrl })
                .eq('id', editingId)

            if (error) throw error
            setEditingId(null)
        } catch (error) {
            console.error('Error updating bookmark:', error)
            alert('Error updating bookmark')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((bookmark) => (
                <div
                    key={bookmark.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-white/50 bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
                >
                    {editingId === bookmark.id ? (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            {/* ... editing mode inputs ... */}
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
                                    disabled={loading}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                                    title="Save"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
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
            {bookmarks.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white/30 py-20 text-center">
                    <p className="text-lg font-medium text-gray-500">No bookmarks yet</p>
                    <p className="text-sm text-gray-400">Add your first one above!</p>
                </div>
            )}
        </div>
    )
}
