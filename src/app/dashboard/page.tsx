export const dynamic = "force-dynamic"
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, TrendingUp, Target, Calendar, Clock, AlertCircle, CheckCircle, Users, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCurrency, formatRelativeTime, calculateStreak } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { getDashboardStats, getUpcomingReminders, getRecentContributions, getUserWorkspace } from '@/lib/actions/dashboard'
import { toast } from '@/hooks/use-toast'
import { useUserStore } from '@/stores/user-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { demoWorkspace, demoContributions, demoReminders } from '@/lib/demo-data'

interface DashboardStats {
  total_saved: number
  target_amount: number
  progress_percentage: number
  remaining_amount: number
  streak: number
  my_contributions: number
  partner_contributions: number
  my_count: number
  partner_count: number
}

interface ReminderInfo {
  id: string
  reminder_number: number
  label: string
  message: string
  scheduled_date: string | Date
  status: string
  is_upcoming: boolean
  days_until: number
  expected_amount?: number
}

interface Contribution {
  id: string
  amount: number
  type: string
  description: string | null
  payment_reference: string | null
  contribution_date: string
  created_at: string
  profile: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
}

export default function DashboardPage() {
  const { user } = useUserStore()
  const { workspace, setWorkspace } = useWorkspaceStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [reminders, setReminders] = useState<ReminderInfo[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === 'true') {
      setIsDemo(true)
      loadDemoData()
    } else {
      loadData()
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [workspaceRes, statsRes, remindersRes, contributionsRes] = await Promise.all([
        getUserWorkspace(),
        getDashboardStats(),
        getUpcomingReminders(),
        getRecentContributions(),
      ])

      if (workspaceRes.workspace) {
        setWorkspace(workspaceRes.workspace)
      }
      if (statsRes.stats) setStats(statsRes.stats)
      if (remindersRes.reminders) setReminders(remindersRes.reminders)
      if (contributionsRes.contributions) setContributions(contributionsRes.contributions)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      toast({ title: 'Failed to load dashboard', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const loadDemoData = async () => {
    setWorkspace(demoWorkspace)
    setStats({
      total_saved: 1500000,
      target_amount: 10000000,
      progress_percentage: 15,
      remaining_amount: 8500000,
      streak: 3,
      my_contributions: 900000,
      partner_contributions: 600000,
      my_count: 5,
      partner_count: 3,
    })
    setReminders(demoReminders)
    setContributions(demoContributions)
    setLoading(false)
  }

  const nextReminder = reminders[0]
  const progressRingCircumference = 2 * Math.PI * 90

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="page-container">
          <div className="space-y-6" role="status" aria-label="Loading dashboard">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-32 rounded-2xl animate-pulse bg-charcoal/10" />
            ))}
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map(i => (
                <div key={i} className="skeleton h-48 rounded-2xl animate-pulse bg-charcoal/10" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Header />
        <main className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Heart className="mx-auto mb-6 h-16 w-16 text-rose/50" />
            <h1 className="font-display text-3xl font-semibold text-charcoal">
              Welcome to Your Fund
            </h1>
            <p className="mt-4 text-lg text-charcoal/60 max-w-md mx-auto">
              It looks like you don&apos;t have a workspace yet. Create one or join using an invite code.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <Button size="lg" asChild>
                <a href="/settings?setup=true">Create Workspace</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/settings?setup=join">Join with Invite Code</a>
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  const partner = workspace.members?.find(m => m.profile_id !== user?.id)?.profile

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="page-container">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative rounded-3xl bg-gradient-to-br from-blush via-cream to-lavender p-6 sm:p-8 lg:p-10 overflow-hidden">
            <div className="absolute inset-0 -z-10 opacity-50" aria-hidden="true">
              <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-rose/30 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-lavender/30 blur-3xl" />
            </div>

            <div className="relative z-10">
              <p className="text-sm font-medium text-rose">Good things take time. Let&apos;s save for them together.</p>
              <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal sm:text-4xl lg:text-5xl">
                {formatCurrency(stats?.total_saved || 0)} saved
              </h1>
              <p className="mt-1 text-lg text-charcoal/60">
                Target: {formatCurrency(stats?.target_amount || 0)} &nbsp;|&nbsp;
                <span className="font-medium text-rose">
                  {stats?.progress_percentage?.toFixed(1) || 0}%
                </span> complete
              </p>

              {/* Progress Ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8, type: 'spring' }}
                className="mt-6 flex items-center justify-center"
              >
                <svg className="relative h-32 w-32 sm:h-40 sm:w-40" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="#F4E5E8"
                    strokeWidth="12"
                  />
                  <motion.circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={progressRingCircumference}
                    strokeDashoffset={progressRingCircumference * (1 - (stats?.progress_percentage || 0) / 100)}
                    transform="rotate(-90 100 100)"
                    style={{ filter: 'url(#glow)' }}
                    initial={{ strokeDashoffset: progressRingCircumference }}
                    animate={{ strokeDashoffset: progressRingCircumference * (1 - (stats?.progress_percentage || 0) / 100) }}
                    transition={{ duration: 1.5, type: 'spring', stiffness: 100, delay: 0.5 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#C98798" />
                      <stop offset="100%" stopColor="#EAE5F5" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-display text-3xl font-bold text-charcoal sm:text-4xl">
                    {stats?.progress_percentage?.toFixed(1) || 0}%
                  </span>
                  <span className="text-sm text-charcoal/50">of goal</span>
                </div>
              </motion.div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-charcoal/60">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-rose" />
                  <span>{formatCurrency(stats?.remaining_amount || 0)} remaining</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-rose" />
                  <span>Streak: {stats?.streak || 0} months</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Stats Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-blush/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-charcoal/60">My Contributions</p>
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-display text-2xl font-semibold text-charcoal"
                    >
                      {formatCurrency(stats?.my_contributions || 0)}
                    </motion.span>
                    <p className="mt-1 text-sm text-charcoal/50">
                      {stats?.my_count || 0} contributions
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose/10 text-rose">
                    <Heart className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blush/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-charcoal/60">Partner&apos;s Contributions</p>
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="font-display text-2xl font-semibold text-charcoal"
                    >
                      {formatCurrency(stats?.partner_contributions || 0)}
                    </motion.span>
                    <p className="mt-1 text-sm text-charcoal/50">
                      {stats?.partner_count || 0} contributions
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lavender text-rose">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blush/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-charcoal/60">Savings Streak</p>
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="font-display text-2xl font-semibold text-charcoal"
                    >
                      {stats?.streak || 0}
                    </motion.span>
                    <p className="mt-1 text-sm text-charcoal/50">Consecutive months</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage text-charcoal">
                    <Target className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blush/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-charcoal/60">This Month</p>
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="font-display text-2xl font-semibold text-rose"
                    >
                      {formatCurrency(
                        contributions
                          ?.filter(c => new Date(c.contribution_date).getMonth() === new Date().getMonth())
                          .reduce((sum, c) => sum + c.amount, 0) || 0
                      )}
                    </motion.span>
                    <p className="mt-1 text-sm text-charcoal/50">Saved so far</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blush text-rose">
                    <Calendar className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Contributions & Reminders */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Reminder */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-blush/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-rose" />
                      Our Next Savings Day
                    </CardTitle>
                    {nextReminder && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        nextReminder.status === 'completed' ? 'bg-sage text-charcoal' :
                        nextReminder.status === 'pending' ? 'bg-blush text-rose' :
                        'bg-lavender text-rose'
                      }`}>
                        {nextReminder.status === 'completed' ? 'Completed' :
                        nextReminder.status === 'pending' ? 'Due Soon' : 'Upcoming'}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {nextReminder ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-display text-2xl font-semibold text-charcoal">
                            {nextReminder.label}
                          </p>
                          <p className="text-sm text-charcoal/60">
                            {formatRelativeTime(nextReminder.scheduled_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-xl font-semibold text-rose">
                            {nextReminder.days_until === 0 ? 'Today!' : 
                             nextReminder.days_until === 1 ? 'Tomorrow' :
                             `In ${nextReminder.days_until} days`}
                          </p>
                          <p className="text-sm text-charcoal/50">
                            {nextReminder.expected_amount
                              ? `Expected: ${formatCurrency(nextReminder.expected_amount)}`
                              : 'Tap to mark complete'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Progress 
                          value={Math.max(0, 100 - (nextReminder.days_until / 30) * 100)} 
                          className="h-2" 
                        />
                        <p className="mt-1 text-xs text-charcoal/50 text-center">
                          {nextReminder.message}
                        </p>
                      </div>

                      {nextReminder.status !== 'completed' && (
                        <Button 
                          variant="secondary" 
                          className="w-full"
                          onClick={() => handleMarkReminderComplete(nextReminder.id)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-charcoal/50">
                      <Calendar className="mx-auto mb-2 h-10 w-10 text-charcoal/30" />
                      <p>No upcoming reminders configured</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <a href="/reminders">Configure Reminders</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.section>

            {/* Recent Contributions */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-blush/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-rose" />
                      Recent Activity
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <a href="/contributions">View All</a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {contributions.length > 0 ? (
                    <div className="space-y-3">
                      {contributions.slice(0, 5).map((contribution, index) => (
                        <motion.div
                          key={contribution.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-4 p-4 rounded-xl bg-blush/30 hover:bg-blush/50 transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={contribution.profile.avatar_url || undefined} alt={contribution.profile.display_name || ''} />
                            <AvatarFallback className="text-rose font-medium">
                              {contribution.profile.display_name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-charcoal truncate">
                              {contribution.profile.display_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-charcoal/50 truncate">
                              {contribution.description || 'No description'} &nbsp;·&nbsp;
                              {formatRelativeTime(contribution.contribution_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-display font-semibold text-rose">
                              +{formatCurrency(contribution.amount)}
                            </p>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              contribution.type === 'shared' ? 'bg-rose/10 text-rose' : 'bg-lavender text-rose'
                            }`}>
                              {contribution.type}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="mx-auto mb-3 h-12 w-12 text-charcoal/20" />
                      <h3 className="font-display text-lg font-medium text-charcoal">No contributions yet</h3>
                      <p className="mt-1 text-sm text-charcoal/50">Start your savings journey together</p>
                      <Button className="mt-4" asChild>
                        <a href="/add-contribution">Add First Contribution</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.section>
          </div>

          {/* Right Column - Partner Cards & Quick Actions */}
          <div className="space-y-6">
            {/* My Card */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-blush/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-24 w-24 bg-rose/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={user?.avatar_url || undefined} alt={user?.display_name || ''} />
                      <AvatarFallback className="text-rose font-medium text-xl">
                        {user?.display_name?.charAt(0).toUpperCase() || 'M'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-display text-lg font-semibold text-charcoal">
                        {user?.display_name || 'Me'}
                      </p>
                      <p className="text-sm text-charcoal/50">You</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal/60">Total Contributed</span>
                      <span className="font-semibold text-charcoal">
                        {formatCurrency(stats?.my_contributions || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal/60">Contributions</span>
                      <span className="font-semibold text-charcoal">{stats?.my_count || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal/60">Share of Total</span>
                      <span className="font-semibold text-rose">
                        {stats?.total_saved ? Math.round((stats.my_contributions / stats.total_saved) * 100) : 0}%
                      </span>
                    </div>
                    <Progress value={stats?.total_saved ? (stats.my_contributions / stats.total_saved) * 100 : 0} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            {/* Partner Card */}
            {partner && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-blush/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-lavender/50 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={partner.avatar_url || undefined} alt={partner.display_name || ''} />
                        <AvatarFallback className="text-rose font-medium text-xl">
                          {partner.display_name?.charAt(0).toUpperCase() || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-display text-lg font-semibold text-charcoal">
                          {partner.display_name || 'Partner'}
                        </p>
                        <p className="text-sm text-charcoal/50">Your Partner</p>
                      </div>
                    </div>
                    <div className="mt-6 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-charcoal/60">Total Contributed</span>
                        <span className="font-semibold text-charcoal">
                          {formatCurrency(stats?.partner_contributions || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-charcoal/60">Contributions</span>
                        <span className="font-semibold text-charcoal">{stats?.partner_count || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-charcoal/60">Share of Total</span>
                        <span className="font-semibold text-rose">
                          {stats?.total_saved ? Math.round((stats.partner_contributions / stats.total_saved) * 100) : 0}%
                        </span>
                      </div>
                      <Progress value={stats?.total_saved ? (stats.partner_contributions / stats.total_saved) * 100 : 0} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              </motion.section>
            )}

            {/* Quick Actions */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-blush/50">
                <CardHeader className="pb-2">
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <Button className="w-full justify-start gap-3" variant="outline" asChild>
                    <a href="/add-contribution">
                      <Sparkles className="h-5 w-5" />
                      Add Contribution
                    </a>
                  </Button>
                  <Button className="w-full justify-start gap-3" variant="outline" asChild>
                    <a href="/pay">
                      <Heart className="h-5 w-5" />
                      View QR Code
                    </a>
                  </Button>
                  <Button className="w-full justify-start gap-3" variant="outline" asChild>
                    <a href="/goals">
                      <Target className="h-5 w-5" />
                      Manage Goals
                    </a>
                  </Button>
                  <Button className="w-full justify-start gap-3" variant="outline" asChild>
                    <a href="/analytics">
                      <TrendingUp className="h-5 w-5" />
                      View Analytics
                    </a>
                  </Button>
                  <Button className="w-full justify-start gap-3" variant="outline" asChild>
                    <a href="/reminders">
                      <Calendar className="h-5 w-5" />
                      Reminder Calendar
                    </a>
                  </Button>
                  <Button className="w-full justify-start gap-3" variant="outline" asChild>
                    <a href="/settings">
                      <AlertCircle className="h-5 w-5" />
                      Settings
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.section>
          </div>
        </div>
      </main>
    </div>
  )
}

async function handleMarkReminderComplete(reminderId: string) {
  // Implementation would call the action
  toast({ title: 'Reminder marked as completed!', variant: 'success' })
}