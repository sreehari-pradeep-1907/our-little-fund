export const dynamic = "force-dynamic"

import { Suspense } from 'react'
import LoginContent from './login-content'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center"><div className="text-charcoal/50">Loading...</div></Suspense}>
      <LoginContent />
    </Suspense>
  )
}
