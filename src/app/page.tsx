export const dynamic = "force-dynamic"
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ArrowRight, Sparkles, Shield, Users, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: 'spring', stiffness: 180, damping: 15 }}
              className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-rose to-lavender"
            >
              <Heart className="h-12 w-12 text-cream" />
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-display text-4xl font-semibold text-charcoal sm:text-5xl lg:text-6xl"
            >
              Two hearts. One goal.{' '}
              <span className="gradient-text">A future we&apos;re building together.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 text-lg text-charcoal/60 max-w-2xl mx-auto sm:text-xl"
            >
              Our Little Fund helps you save together toward your shared dreams.
              Beautiful, private, and made just for the two of you.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
            >
              <Button size="xl" asChild>
                <Link href="/login">
                  <span className="flex items-center gap-2">
                    Get Started
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/login?mode=signup">
                  Create an Account
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Decorative Elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute inset-0 -z-10 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-blush/30 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-64 w-64 rounded-full bg-lavender/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-sage/20 blur-3xl" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28 bg-blush/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl font-semibold text-charcoal sm:text-4xl"
            >
              Built for your journey together
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-4 text-lg text-charcoal/60 max-w-2xl mx-auto"
            >
              Every feature designed to make saving together simple, beautiful, and meaningful.
            </motion.p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-blush/50 hover:border-rose/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose to-lavender">
                      <feature.icon className="h-7 w-7 text-cream" aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-charcoal">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-charcoal/60">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl font-semibold text-charcoal sm:text-4xl"
            >
              How it works
            </motion.h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative text-center"
              >
                <div className="mb-6 flex justify-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-cream border border-blush/50">
                    <span className="font-display text-2xl font-bold text-rose">
                      {index + 1}
                    </span>
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-rose to-lavender opacity-20 blur" />
                  </div>
                </div>
                <h3 className="font-display text-xl font-semibold text-charcoal">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-charcoal/60">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-charcoal">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Heart className="mx-auto mb-6 h-12 w-12 text-rose" />
            <h2 className="font-display text-3xl font-semibold text-cream sm:text-4xl">
              Ready to start your journey?
            </h2>
            <p className="mt-4 text-lg text-charcoal/60 sm:text-xl">
              Join thousands of couples building their future together, one contribution at a time.
            </p>
            <Button size="xl" variant="secondary" className="mt-8" asChild>
              <Link href="/login">
                <span className="flex items-center gap-2">
                  Start Saving Together
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blush/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-rose" />
              <span className="font-display text-lg font-semibold text-charcoal">
                Our Little Fund
              </span>
            </div>
            <p className="text-sm text-charcoal/50">
              Little by little, together. &copy; {new Date().getFullYear()}
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-charcoal/50 hover:text-rose transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-charcoal/50 hover:text-rose transition-colors">
                Terms
              </a>
              <a href="#" className="text-sm text-charcoal/50 hover:text-rose transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    title: 'Shared Savings',
    description: 'Track your combined savings with beautiful progress visualizations. See how every contribution brings you closer to your goals.',
    icon: Target,
  },
  {
    title: 'Monthly Reminders',
    description: 'Two automatic reminders each month - beginning and end. Never miss a savings day with push notifications.',
    icon: Users,
  },
  {
    title: 'UPI Payments',
    description: 'Scan your QR code directly from the app. Record contributions instantly after making payments.',
    icon: Shield,
  },
  {
    title: 'Savings Goals',
    description: 'Create multiple goals for different dreams - travel, home, emergencies, and more. Track each one separately.',
    icon: Target,
  },
  {
    title: 'Analytics',
    description: 'Beautiful charts showing your savings journey. Monthly trends, contribution breakdowns, and streak tracking.',
    icon: Shield,
  },
  {
    title: 'Private & Secure',
    description: 'Your data stays yours. Supabase authentication, row-level security, and encrypted storage.',
    icon: Shield,
  },
]

const steps = [
  {
    title: 'Create your fund',
    description: 'Set up your shared workspace, invite your partner, and set your savings target.',
  },
  {
    title: 'Set reminders',
    description: 'Configure your two monthly savings days. We will remind you both automatically.',
  },
  {
    title: 'Save together',
    description: 'Make contributions, track progress, and celebrate milestones on your journey.',
  },
]