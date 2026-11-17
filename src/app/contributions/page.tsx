export const dynamic = "force-dynamic"
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Filter, ChevronDown, ChevronUp, Download, Edit, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { getContributions, getContributionStats, deleteContribution } from '@/lib/actions/contributions'
import { getUserWorkspace } from '@/lib/actions/auth'
import { toast } from '@/hooks/use-toast'
import { useUserStore } from '@/stores/user-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { demoWorkspace, demoContributions } from '@/lib/demo-data'

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

export default function ContributionsPage() {
  const { user } = useUserStore()
  const { workspace, setWorkspace } = useWorkspaceStore()
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filterType, setFilterType] = useState<'all' | 'shared' | 'personal'>('all')
  const [filterProfile, setFilterProfile] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [isDemo, setIsDemo] = useState(false)
  const limit = 20

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
      const workspaceRes = await getUserWorkspace()
      const contributionsRes = await getContributions(workspaceRes.workspace?.id || '', limit, (page - 1) * limit)

      if (workspaceRes.workspace) {
        setWorkspace(workspaceRes.workspace)
      }
      if (contributionsRes.contributions) {
        setContributions(contributionsRes.contributions)
        setTotal(contributionsRes.total)
      }
    } catch (error) {
      console.error('Failed to load contributions:', error)
      toast({ title: 'Failed to load contributions', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const loadDemoData = () => {
    setWorkspace(demoWorkspace)
    setContributions(demoContributions)
    setTotal(demoContributions.length)
    setLoading(false)
  }

  const filteredContributions = contributions.filter(c => {
    if (filterType !== 'all' && c.type !== filterType) return false
    if (filterProfile !== 'all' && c.profile.id !== filterProfile) return false
    return true
  }).sort((a, b) => {
    const dateA = new Date(a.contribution_date).getTime()
    const dateB = new Date(b.contribution_date).getTime()
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contribution?')) return
    
    if (isDemo) {
      setContributions(prev => prev.filter(c => c.id !== id))
      toast({ title: 'Contribution deleted (demo)', variant: 'success' })
      return
    }

    const result = await deleteContribution(id)
    if (result.error) {
      toast({ title: result.error, variant: 'destructive' })
    } else {
      setContributions(prev => prev.filter(c => c.id !== id))
      toast({ title: 'Contribution deleted', variant: 'success' })
    }
  }

  const profiles = workspace?.members?.map(m => m.profile).filter(Boolean) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="page-container">
          <div className="space-y-4" role="status" aria-label="Loading contributions">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton h-20 rounded-xl animate-pulse bg-charcoal/10" />
            ))}
          </div>
        </main>
      </div>
    )
  }

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
            <h1 className="font-display text-3xl font-semibold text-charcoal">Contributions</h1>
            <p className="mt-1 text-sm text-charcoal/60">Track all your savings contributions</p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <a href="/add-contribution">
              <Plus className="mr-2 h-4 w-4" />
              Add Contribution
            </a>
          </Button>
        </motion.div>

        {/* Stats Summary */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-blush/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal/60">Total Contributions</p>
                    <p className="font-display text-xl font-semibold text-charcoal">
                      {formatCurrency(
                        filteredContributions.reduce((sum, c) => sum + c.amount, 0)
                      )}
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-rose/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-blush/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal/60">Shared Savings</p>
                    <p className="font-display text-xl font-semibold text-rose">
                      {formatCurrency(
                        filteredContributions
                          .filter(c => c.type === 'shared')
                          .reduce((sum, c) => sum + c.amount, 0)
                      )}
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-rose/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-blush/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-charcoal/60">Entries</p>
                    <p className="font-display text-xl font-semibold text-charcoal">
                      {filteredContributions.length}
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-rose/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Filters */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="border-blush/50">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-charcoal/50" />
                  <span className="text-sm font-medium text-charcoal">Filters:</span>
                </div>
                
                <Select value={filterType} onValueChange={(v: string) => setFilterType(v as 'all' | 'shared' | 'personal')}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="shared">Shared</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterProfile} onValueChange={setFilterProfile}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Contributors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contributors</SelectItem>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.display_name || p.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={(v: string) => setSortOrder(v as 'desc' | 'asc')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="ghost" size="sm" className="ml-auto" asChild>
                  <a href="#" download="contributions.csv">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Contributions List */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-blush/50 overflow-hidden">
            {filteredContributions.length > 0 ? (
              <div className="divide-y divide-blush/50">
                {filteredContributions.map((contribution, index) => (
                  <motion.div
                    key={contribution.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 hover:bg-blush/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contribution.profile.avatar_url || undefined} alt={contribution.profile.display_name || ''} />
                        <AvatarFallback className="text-rose font-medium">
                          {contribution.profile.display_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-charcoal truncate">
                            {contribution.profile.display_name || 'Unknown'}
                          </p>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            contribution.type === 'shared' ? 'bg-rose/10 text-rose' : 'bg-lavender text-rose'
                          }`}>
                            {contribution.type}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-charcoal/50">
                          <span>{formatDate(contribution.contribution_date)}</span>
                          {contribution.description && (
                            <span className="truncate max-w-xs">{contribution.description}</span>
                          )}
                          {contribution.payment_reference && (
                            <span className="font-mono">Ref: {contribution.payment_reference}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-display font-semibold text-rose whitespace-nowrap">
                          +{formatCurrency(contribution.amount)}
                        </span>
                        {contribution.profile.id === user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-charcoal/40 hover:text-rose hover:bg-rose/10"
                            onClick={() => handleDelete(contribution.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Heart className="mx-auto mb-3 h-12 w-12 text-charcoal/20" />
                <h3 className="font-display text-lg font-medium text-charcoal">No contributions found</h3>
                <p className="mt-1 text-sm text-charcoal/50">
                  {contributions.length === 0 
                    ? 'Start your savings journey by adding your first contribution'
                    : 'Try adjusting your filters'}
                </p>
                {contributions.length === 0 && (
                  <Button className="mt-4" asChild>
                    <a href="/add-contribution">Add First Contribution</a>
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Pagination */}
          {total > limit && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-charcoal/60">
                Page {page} of {Math.ceil(total / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
                disabled={page >= Math.ceil(total / limit)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  )
}

import { ChevronLeft, ChevronRight } from 'lucide-react'