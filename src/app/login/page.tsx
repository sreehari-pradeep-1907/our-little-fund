'use client'

import { useState } from 'react'
import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Mail, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { signInWithEmail } from '@/lib/actions/auth'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center"><div className="text-charcoal/50">Loading...</div></Suspense}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

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
      toast({ title: 'Check your email', description: 'Magic link sent!', variant: 'success' })
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md border-blush/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose to-lavender">
            <Heart className="h-7 w-7 text-cream" />
          </div>
          <CardTitle className="text-xl">Magic Link Sign In</CardTitle>
          <CardDescription>Enter your email to sign in</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-charcoal/40" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? 'Sending...' : 'Send Magic Link'}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard?demo=true')}>
              <Sparkles className="mr-2 h-4 w-4" /> Try Demo
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
