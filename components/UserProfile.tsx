'use client'

import { useState, useRef, useEffect } from 'react'
import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type UserProfileProps = {
    user: {
        email?: string
        user_metadata: {
            avatar_url?: string
            full_name?: string
            name?: string
        }
    }
}

export default function UserProfile({ user }: UserProfileProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const router = useRouter()

    const toggleOpen = () => setIsOpen(!isOpen)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    const avatarUrl = user.user_metadata.avatar_url
    const name = user.user_metadata.full_name || user.user_metadata.name || user.email

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleOpen}
                className="flex items-center space-x-3 rounded-full bg-white/50 py-1.5 pl-2 pr-4 shadow-sm ring-1 ring-white/60 backdrop-blur-md transition-all hover:bg-white/80 hover:shadow-md"
            >
                <div className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-white">
                    {avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={avatarUrl}
                            alt="Profile"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-600">
                            <UserIcon className="h-4 w-4" />
                        </div>
                    )}
                </div>
                <span className="hidden text-sm font-medium text-gray-700 sm:block max-w-[100px] truncate">
                    {name?.split(' ')[0]}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <div
                className={`absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-xl bg-white p-1 shadow-xl ring-1 ring-black/5 backdrop-blur-xl transition-all duration-200 z-50 ${isOpen
                    ? 'transform opacity-100 scale-100 translate-y-0'
                    : 'transform opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
            >
                <div className="px-4 py-3">
                    <p className="truncate text-sm font-medium text-gray-900">{name}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="p-1">
                    <button
                        onClick={handleSignOut}
                        className="flex w-full items-center rounded-lg px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    )
}
