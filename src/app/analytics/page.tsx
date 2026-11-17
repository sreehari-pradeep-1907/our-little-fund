'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Target, Calendar, Users, DollarSign, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { getMonthlyChartData, getDashboardStats } from '@/lib/actions/dashboard'
import { getContributionHistory } from '@/lib/actions/contributions'
import { getUserWorkspace } from '@/lib/actions/auth'
import { useUserStore } from '@/stores/user-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { demoWorkspace, demoContributions } from '@/lib/demo-data'

interface MonthlyData {
  month: string
  total: number
  shared: number
  me: number
  partner: number
}

interface ContributionHistory {
  month: string
  total: number
  shared: number
  count: number
  byProfile: Record<string, number>
}

const COLORS = ['#C98798', '#EAE5F5', '#DCE8DD', '#F4E5E8']

export default function AnalyticsPage() {
  const { user } = useUserStore()
  const { workspace, setWorkspace } = useWorkspaceStore()
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [history, setHistory] = useState<ContributionHistory[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'all'>('12m')
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === 'true') {
      setIsDemo(true)
      setWorkspace(demoWorkspace)
      loadDemoData()
    } else {
      loadData()
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const months = timeRange === '6m' ? 6 : timeRange === '12m' ? 12 : 24
      
      const workspaceRes = await getUserWorkspace()
      const [monthlyRes, historyRes, statsRes] = await Promise.all([
        getMonthlyChartData(months),
        getContributionHistory(workspaceRes.workspace?.id || '', months),
        getDashboardStats(),
      ])

      if (workspaceRes.workspace) setWorkspace(workspaceRes.workspace)
      if (monthlyRes.data) setMonthlyData(monthlyRes.data)
      if (historyRes.history) setHistory(historyRes.history)
      if (statsRes.stats) setStats(statsRes.stats)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDemoData = () => {
    // Generate demo monthly data
    const months = ['Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025', 
                    'Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025']
    
    const demoMonthly = months.map((month, i) => ({
      month,
      total: Math.floor(Math.random() * 500000) + 100000,
      shared: Math.floor(Math.random() * 400000) + 50000,
      me: Math.floor(Math.random() * 300000) + 20000,
      partner: Math.floor(Math.random() * 200000) + 10000,
    }))
    
    setMonthlyData(demoMonthly)
    
    // Calculate demo stats
    const total = demoContributions.reduce((sum, c) => sum + c.amount, 0)
    const myTotal = demoContributions.filter(c => c.profile_id === 'demo-user-1').reduce((sum, c) => sum + c.amount, 0)
    const partnerTotal = demoContributions.filter(c => c.profile_id === 'demo-user-2').reduce((sum, c) => sum + c.amount, 0)
    
    setStats({
      total_saved: total,
      my_contributions: myTotal,
      partner_contributions: partnerTotal,
      my_count: demoContributions.filter(c => c.profile_id === 'demo-user-1').length,
      partner_count: demoContributions.filter(c => c.profile_id === 'demo-user-2').length,
      streak: 3,
    })
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="page-container">
          <div className="space-y-6" role="status" aria-label="Loading analytics">
            <div className="skeleton h-32 rounded-2xl animate-pulse bg-charcoal/10" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton h-24 rounded-xl animate-pulse bg-charcoal/10" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="skeleton h-96 rounded-2xl animate-pulse bg-charcoal/10" />
              <div className="skeleton h-96 rounded-2xl animate-pulse bg-charcoal/10" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  const partner = workspace?.members?.find(m => m.profile_id !== user?.id)?.profile

  // Calculate additional metrics
  const totalContributions = monthlyData.reduce((sum, m) => sum + m.total, 0)
  const avgMonthly = monthlyData.length > 0 ? totalContributions / monthlyData.length : 0
  const bestMonth = monthlyData.reduce((best, m) => m.total > best.total ? m : best, monthlyData[0] || { month: '-', total: 0 })
  const consistency = monthlyData.filter(m => m.total > 0).length / Math.max(monthlyData.length, 1) * 100

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="page-container">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-3xl font-semibold text-charcoal flex items-center gap-2">
              <BarChart className="h-8 w-8 text-rose" />
              Analytics
            </h1>
            <p className="mt-1 text-sm text-charcoal/60">Insights into your savings journey together</p>
          </div>
          <Select value={timeRange} onValueChange={(v: string) => setTimeRange(v as '6m' | '12m' | 'all')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Key Metrics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-blush/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal/60">Total Saved</p>
                    <p className="font-display text-xl font-semibold text-charcoal">
                      {formatCurrency(stats?.total_saved || monthlyData.reduce((s, m) => s + m.total, 0))}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-rose/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-blush/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal/60">Avg Monthly</p>
                    <p className="font-display text-xl font-semibold text-rose">
                      {formatCurrency(Math.round(avgMonthly))}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-rose/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-blush/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal/60">Best Month</p>
                    <p className="font-display text-xl font-semibold text-charcoal">
                      {formatCurrency(bestMonth.total)}
                    </p>
                    <p className="text-xs text-charcoal/50">{bestMonth.month}</p>
                  </div>
                  <Award className="h-8 w-8 text-rose/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-blush/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal/60">Consistency</p>
                    <p className="font-display text-xl font-semibold text-rose">
                      {consistency.toFixed(0)}%
                    </p>
                    <p className="text-xs text-charcoal/50">Months with savings</p>
                  </div>
                  <Target className="h-8 w-8 text-rose/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Charts */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Savings Bar Chart */}
            <Card className="border-blush/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-rose" />
                  Monthly Savings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F4E5E8" vertical={false} />
                    <XAxis type="number" tick={{ fill: '#6B686F', fontSize: 11 }} tickFormatter={v => formatCurrency(v)} />
                    <YAxis type="category" dataKey="month" tick={{ fill: '#6B686F', fontSize: 11 }} width={80} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FAF8F5', 
                        border: '1px solid #F4E5E8',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px -10px rgba(41, 39, 43, 0.1)'
                      }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelFormatter={(label: string) => label}
                    />
                    <Bar dataKey="me" fill="#C98798" radius={[0, 4, 4, 0]} name="Me" />
                    <Bar dataKey="partner" fill="#EAE5F5" radius={[0, 4, 4, 0]} name={partner?.display_name || 'Partner'} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Progress Line Chart */}
            <Card className="border-blush/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-rose" />
                  Cumulative Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData.map((d, i) => ({
                    ...d,
                    cumulative: monthlyData.slice(0, i + 1).reduce((sum, m) => sum + m.total, 0),
                    meCumulative: monthlyData.slice(0, i + 1).reduce((sum, m) => sum + m.me, 0),
                    partnerCumulative: monthlyData.slice(0, i + 1).reduce((sum, m) => sum + m.partner, 0),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F4E5E8" />
                    <XAxis dataKey="month" tick={{ fill: '#6B686F', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6B686F', fontSize: 11 }} tickFormatter={v => formatCurrency(v)} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FAF8F5', 
                        border: '1px solid #F4E5E8',
                        borderRadius: '12px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="#C98798" 
                      strokeWidth={3} 
                      dot={false}
                      activeDot={{ r: 6, fill: '#C98798' }}
                      name="Total"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="meCumulative" 
                      stroke="#EAE5F5" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      dot={false}
                      name="Me"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="partnerCumulative" 
                      stroke="#DCE8DD" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      dot={false}
                      name={partner?.display_name || 'Partner'}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Contribution Breakdown & Heatmap */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Contribution by Partner Pie */}
            <Card className="border-blush/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-rose" />
                  Contribution Split
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Me', value: stats?.my_contributions || monthlyData.reduce((s, m) => s + m.me, 0) },
                        { name: partner?.display_name || 'Partner', value: stats?.partner_contributions || monthlyData.reduce((s, m) => s + m.partner, 0) },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      <Cell fill="#C98798" />
                      <Cell fill="#EAE5F5" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FAF8F5', 
                        border: '1px solid #F4E5E8',
                        borderRadius: '12px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Contribution Types */}
            <Card className="border-blush/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-rose" />
                  Savings by Type
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F4E5E8" vertical={false} />
                    <XAxis type="number" tick={{ fill: '#6B686F', fontSize: 11 }} tickFormatter={v => formatCurrency(v)} />
                    <YAxis type="category" dataKey="month" tick={{ fill: '#6B686F', fontSize: 11 }} width={80} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FAF8F5', 
                        border: '1px solid #F4E5E8',
                        borderRadius: '12px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Bar dataKey="shared" fill="#C98798" radius={[0, 4, 4, 0]} name="Shared" />
                    <Bar dataKey="total" fill="#F4E5E8" radius={[0, 4, 4, 0]} name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Partner Comparison Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="font-display text-xl font-semibold text-charcoal mb-4">Partner Comparison</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-blush/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.avatar_url || undefined} alt={user?.display_name || ''} />
                    <AvatarFallback className="text-rose font-medium text-2xl">
                      {user?.display_name?.charAt(0).toUpperCase() || 'M'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-display text-lg font-semibold text-charcoal">
                      {user?.display_name || 'Me'}
                    </p>
                    <p className="text-sm text-charcoal/50">Total Contributions</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-charcoal/60">Total Amount</span>
                    <span className="font-display font-semibold text-rose">
                      {formatCurrency(stats?.my_contributions || monthlyData.reduce((s, m) => s + m.me, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/60">Contributions</span>
                    <span className="font-semibold text-charcoal">{stats?.my_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/60">Share</span>
                    <span className="font-semibold text-rose">
                      {stats?.total_saved ? Math.round((stats.my_contributions / stats.total_saved) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={stats?.total_saved ? (stats.my_contributions / stats.total_saved) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blush/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={partner?.avatar_url || undefined} alt={partner?.display_name || ''} />
                    <AvatarFallback className="text-rose font-medium text-2xl">
                      {partner?.display_name?.charAt(0).toUpperCase() || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-display text-lg font-semibold text-charcoal">
                      {partner?.display_name || 'Partner'}
                    </p>
                    <p className="text-sm text-charcoal/50">Total Contributions</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-charcoal/60">Total Amount</span>
                    <span className="font-display font-semibold text-rose">
                      {formatCurrency(stats?.partner_contributions || monthlyData.reduce((s, m) => s + m.partner, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/60">Contributions</span>
                    <span className="font-semibold text-charcoal">{stats?.partner_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/60">Share</span>
                    <span className="font-semibold text-rose">
                      {stats?.total_saved ? Math.round((stats.partner_contributions / stats.total_saved) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={stats?.total_saved ? (stats.partner_contributions / stats.total_saved) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Savings Streak */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-blush/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-rose" />
                Savings Streak
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose to-lavender">
                    <Award className="h-8 w-8 text-cream" />
                  </div>
                  <div>
                    <p className="font-display text-4xl font-bold text-charcoal">
                      {stats?.streak || 0}
                    </p>
                    <p className="text-sm text-charcoal/50">Consecutive months with savings</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-charcoal/60">Current Streak</p>
                  <p className="font-display text-2xl font-semibold text-rose">
                    {stats?.streak || 0} months
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </main>
    </div>
  )
}