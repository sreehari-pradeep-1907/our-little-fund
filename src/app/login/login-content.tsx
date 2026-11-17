'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Heart, Mail, UserPlus, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { signInWithEmail } from '@/lib/actions/auth'

export default function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'signin'
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast({ title: 'Please enter your email', variant: 'destructive' })
      return
    }

    setLoading(true)
    const result = await signInWithEmail(email.trim())
    setLoading(false)

    if (result.error) {
      toast({ title: result.error, variant: 'destructive' })
    } else {
      toast({ 
        title: 'Check your email', 
        description: 'We\'ve sent you a magic link to sign in.',
        variant: 'success' 
      })
    }
  }

  const switchMode = (newMode: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('mode', newMode)
    router.push(`/login?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 180, damping: 15 }}
          className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose to-lavender"
        >
          <Heart className="h-9 w-9 text-cream" />
        </motion.div>

        {/* Title */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl font-semibold text-charcoal"
          >
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-sm text-charcoal/60"
          >
            {mode === 'signup' 
              ? 'Start your savings journey together'
              : 'Sign in to continue building your future'}
          </motion.p>
        </div>

        {/* Form Card */}
        <Card className="border-blush/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Magic Link Sign In</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a secure link to sign in.
              No passwords needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-charcoal/40" />
                <Input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11"
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                {loading ? 'Sending...' : `Send magic link to ${email || 'your email'}`}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            {/* Demo Mode */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-blush/50" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-cream px-2 text-charcoal/50">Or continue with demo</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full" 
              size="lg"
              onClick={() => router.push('/dashboard?demo=true')}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Try Demo Mode
            </Button>

            {/* Switch Mode */}
            <AnimatePresence mode="wait">
              <motion.p
                key={mode}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 text-center text-sm text-charcoal/60"
              >
                {mode === 'signin' ? (
                  <>
                    New here?{' '}
                    <button
                      onClick={() => switchMode('signup')}
                      className="text-rose font-medium hover:underline"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => switchMode('signin')}
                      className="text-rose font-medium hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </motion.p>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Features hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-xs text-charcoal/40"
        >
          <p>Private & secure · No passwords · Made for two</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

import { Sparkles } from 'lucide-react'