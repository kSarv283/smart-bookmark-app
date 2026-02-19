'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Loader2, Sparkles, LogIn, ArrowRight } from 'lucide-react'

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(false)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleAuth = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                    queryParams: isLogin ? undefined : {
                        prompt: 'select_account consent', // Force selection for signup feel
                    }
                },
            })
            if (error) throw error
        } catch (error) {
            console.error('Error logging in:', error)
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200 via-gray-100 to-gray-100 text-gray-800">
            {/* Abstract Background Shapes */}
            <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-300 opacity-30 blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-300 opacity-30 blur-[100px] animate-pulse"></div>

            <div className="relative w-full max-w-md p-6">
                <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/60 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:shadow-indigo-500/10">

                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg">
                            <Sparkles className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                            {isLogin ? 'Welcome Back!' : 'Create Account'}
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            {isLogin
                                ? 'Access your bookmarks from anywhere.'
                                : 'Start organizing your web life today.'}
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="space-y-6">
                        <button
                            onClick={handleAuth}
                            disabled={loading}
                            className="group relative flex w-full items-center justify-center space-x-3 rounded-xl bg-gray-900 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                            ) : (
                                <>
                                    <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="#fff" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                                    <span>{isLogin ? 'Sign In with Google' : 'Sign Up with Google'}</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Toggle */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline transition-colors"
                            >
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    )
}
