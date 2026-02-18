
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((bookmark) => (
                <div
                    key={bookmark.id}
                    className="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                    {editingId === bookmark.id ? (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500">Title</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">URL</label>
                                <input
                                    type="url"
                                    value={editUrl}
                                    onChange={(e) => setEditUrl(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <button
                                    onClick={cancelEditing}
                                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
                                    title="Cancel"
                                    disabled={loading}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    className="rounded-md bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 disabled:opacity-50"
                                    title="Save"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <h3 className="mb-2 text-lg font-semibold text-gray-900 truncate" title={bookmark.title}>
                                    {bookmark.title}
                                </h3>
                                <a
                                    href={bookmark.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mb-4 flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                                >
                                    <ExternalLink className="mr-1 h-3 w-3" />
                                    <span className="truncate">{bookmark.url}</span>
                                </a>
                            </div>
                            <div className="mt-4 flex justify-end space-x-2">
                                <button
                                    onClick={() => startEditing(bookmark)}
                                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                                    title="Edit bookmark"
                                >
                                    <Pencil className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(bookmark.id)}
                                    className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                    title="Delete bookmark"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ))}
            {bookmarks.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-10">
                    No bookmarks yet. Add one above!
                </div>
            )}
        </div>
    )
}
