export const dynamic = "force-dynamic"
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Target, Plus, Edit, Trash2, CheckCircle, Calendar, TrendingUp, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { getGoals, createGoal, updateGoal, deleteGoal, getGoalProgress } from '@/lib/actions/goals'
import { getUserWorkspace } from '@/lib/actions/auth'
import { toast } from '@/hooks/use-toast'
import { useUserStore } from '@/stores/user-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { demoWorkspace, demoGoals } from '@/lib/demo-data'

interface Goal {
  id: string
  name: string
  description: string | null
  target_amount: number
  current_amount: number
  target_date: string | null
  category: string
  cover_image_path: string | null
  is_completed: boolean
  completed_at: string | null
  created_by: string
  created_at: string
}

const categories = [
  { value: 'emergency', label: 'Emergency Fund', icon: '🛡️' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'home', label: 'Home', icon: '🏠' },
  { value: 'occasion', label: 'Special Occasion', icon: '🎉' },
  { value: 'dream', label: 'Dream Project', icon: '✨' },
  { value: 'other', label: 'Other', icon: '📦' },
]

export default function GoalsPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const { workspace, setWorkspace } = useWorkspaceStore()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({ total_target: 0, total_current: 0, completed_count: 0, total_count: 0 })
  const [isDemo, setIsDemo] = useState(false)
  
  // Form states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_amount: '',
    target_date: '',
    category: 'emergency' as string,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === 'true') {
      setIsDemo(true)
      setWorkspace(demoWorkspace)
      setGoals(demoGoals)
      setProgress({
        total_target: demoGoals.reduce((sum, g) => sum + g.target_amount, 0),
        total_current: demoGoals.reduce((sum, g) => sum + g.current_amount, 0),
        completed_count: demoGoals.filter(g => g.is_completed).length,
        total_count: demoGoals.length,
      })
      setLoading(false)
    } else {
      loadData()
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const workspaceRes = await getUserWorkspace()
      const [goalsRes, progressRes] = await Promise.all([
        getGoals(workspaceRes.workspace?.id || ''),
        getGoalProgress(workspaceRes.workspace?.id || ''),
      ])

      if (workspaceRes.workspace) setWorkspace(workspaceRes.workspace)
      if (goalsRes.goals) setGoals(goalsRes.goals)
      if (progressRes.progress) setProgress(progressRes.progress)
    } catch (error) {
      console.error('Failed to load goals:', error)
      toast({ title: 'Failed to load goals', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = 'Goal name is required'
    if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) {
      errors.target_amount = 'Target amount must be greater than 0'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setSubmitting(true)

    const targetAmount = Math.round(parseFloat(formData.target_amount) * 100)

    if (isDemo) {
      setTimeout(() => {
        setSubmitting(false)
        toast({ title: 'Goal created! (Demo)', variant: 'success' })
        setShowCreateDialog(false)
        resetForm()
      }, 500)
      return
    }

    const workspaceId = workspace?.id
    if (!workspaceId) {
      toast({ title: 'No workspace found', variant: 'destructive' })
      setSubmitting(false)
      return
    }

    let result
    if (editingGoal) {
      result = await updateGoal(editingGoal.id, {
        name: formData.name,
        description: formData.description || undefined,
        target_amount: targetAmount,
        target_date: formData.target_date || undefined,
        category: formData.category as any,
      })
    } else {
      result = await createGoal(workspaceId, {
        name: formData.name,
        description: formData.description || undefined,
        target_amount: targetAmount,
        target_date: formData.target_date || undefined,
        category: formData.category as any,
      })
    }

    setSubmitting(false)

    if (result.error) {
      toast({ title: result.error, variant: 'destructive' })
    } else {
      toast({ title: editingGoal ? 'Goal updated!' : 'Goal created!', variant: 'success' })
      setShowCreateDialog(false)
      setEditingGoal(null)
      resetForm()
      loadData()
    }
  }

  const handleDelete = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    if (isDemo) {
      setGoals(prev => prev.filter(g => g.id !== goalId))
      toast({ title: 'Goal deleted (demo)', variant: 'success' })
      return
    }

    const result = await deleteGoal(goalId)
    if (result.error) {
      toast({ title: result.error, variant: 'destructive' })
    } else {
      setGoals(prev => prev.filter(g => g.id !== goalId))
      toast({ title: 'Goal deleted', variant: 'success' })
      loadData()
    }
  }

  const handleToggleComplete = async (goal: Goal) => {
    if (isDemo) {
      setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, is_completed: !g.is_completed } : g))
      toast({ title: 'Goal updated (demo)', variant: 'success' })
      return
    }

    const result = await updateGoal(goal.id, { is_completed: !goal.is_completed })
    if (result.error) {
      toast({ title: result.error, variant: 'destructive' })
    } else {
      setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, is_completed: !g.is_completed } : g))
      toast({ title: goal.is_completed ? 'Goal reopened' : 'Goal completed! 🎉', variant: 'success' })
    }
  }

  const startEditing = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      name: goal.name,
      description: goal.description || '',
      target_amount: (goal.target_amount / 100).toString(),
      target_date: goal.target_date || '',
      category: goal.category,
    })
    setShowCreateDialog(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      target_amount: '',
      target_date: '',
      category: 'emergency',
    })
    setFormErrors({})
    setEditingGoal(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setShowCreateDialog(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="page-container">
          <div className="space-y-6" role="status" aria-label="Loading goals">
            <div className="skeleton h-32 rounded-2xl animate-pulse bg-charcoal/10" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton h-64 rounded-2xl animate-pulse bg-charcoal/10" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  const overallProgress = progress.total_target > 0 
    ? (progress.total_current / progress.total_target) * 100 
    : 0

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
              <Target className="h-8 w-8 text-rose" />
              Savings Goals
            </h1>
            <p className="mt-1 text-sm text-charcoal/60">Track your shared dreams and milestones</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Goal
          </Button>
        </motion.div>

        {/* Overall Progress */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-blush/50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-charcoal/60">Overall Progress</p>
                  <p className="font-display text-2xl font-semibold text-charcoal">
                    {formatCurrency(progress.total_current)} / {formatCurrency(progress.total_target)}
                  </p>
                  <p className="mt-1 text-sm text-rose font-medium">
                    {overallProgress.toFixed(1)}% complete · {progress.completed_count} of {progress.total_count} goals achieved
                  </p>
                </div>
                <div className="w-full sm:w-48">
                  <Progress value={overallProgress} className="h-3" />
                </div>
              </div>
            </CardContent>
            </Card>
        </motion.section>

        {/* Goals Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {goals.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal, index) => (
                <motion.article
                  key={goal.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${
                    goal.is_completed 
                      ? 'border-sage bg-sage/20' 
                      : 'border-blush/50 bg-cream hover:border-rose/50 hover:shadow-elevated'
                  }`}
                >
                  {goal.is_completed && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-3 py-1 rounded-full bg-sage text-charcoal text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Completed
                    </div>
                  )}

                  <div className="p-6">
                    {/* Category & Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{categories.find(c => c.value === goal.category)?.icon || '📦'}</span>
                        <span className="text-xs font-medium text-charcoal/60 capitalize">
                          {categories.find(c => c.value === goal.category)?.label || goal.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEditing(goal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose hover:text-rose"
                          onClick={() => handleDelete(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Goal Name */}
                    <h3 className="font-display text-xl font-semibold text-charcoal mb-2">
                      {goal.name}
                    </h3>

                    {/* Description */}
                    {goal.description && (
                      <p className="text-sm text-charcoal/50 mb-4 line-clamp-2">{goal.description}</p>
                    )}

                    {/* Progress */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-charcoal/60">Saved</span>
                        <span className="font-semibold text-rose">{formatCurrency(goal.current_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-charcoal/60">Target</span>
                        <span className="font-semibold text-charcoal">{formatCurrency(goal.target_amount)}</span>
                      </div>
                      <Progress 
                        value={goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0} 
                        className="h-2" 
                      />
                      <div className="flex items-center justify-between text-xs text-charcoal/50">
                        <span>{Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))}% complete</span>
                        <span>{formatCurrency(Math.max(0, goal.target_amount - goal.current_amount))} remaining</span>
                      </div>
                    </div>

                    {/* Target Date */}
                    {goal.target_date && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-charcoal/50">
                        <Calendar className="h-4 w-4" />
                        <span>Target: {formatDate(goal.target_date)}</span>
                        <span>·</span>
                        <span>{formatRelativeTime(goal.target_date)}</span>
                      </div>
                    )}

                    {/* Created by */}
                    <div className="mt-4 flex items-center gap-2 text-xs text-charcoal/40">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{goal.created_by === user?.id ? 'Me' : 'P'}</AvatarFallback>
                      </Avatar>
                      <span>Created by {goal.created_by === user?.id ? 'you' : 'your partner'}</span>
                    </div>

                    {/* Complete Button */}
                    {!goal.is_completed && goal.current_amount < goal.target_amount && (
                      <Button 
                        className="mt-4 w-full" 
                        variant="secondary"
                        onClick={() => handleToggleComplete(goal)}
                      >
                        Mark as Complete
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <Card className="border-blush/50">
              <CardContent className="p-12 text-center">
                <Target className="mx-auto mb-4 h-16 w-16 text-charcoal/20" />
                <h3 className="font-display text-xl font-semibold text-charcoal">No goals yet</h3>
                <p className="mt-2 text-charcoal/50">Create your first savings goal to start tracking your dreams</p>
                <Button className="mt-6" onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Goal
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.section>
      </main>

      {/* Create/Edit Goal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
            <DialogDescription>
              {editingGoal 
                ? 'Update your savings goal details' 
                : 'Set a target and watch your progress grow together'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Goal Name"
                placeholder="e.g., Japan Trip, Emergency Fund, New Home"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                error={formErrors.name}
                required
              />
            </div>
            <div>
              <Textarea
                label="Description (Optional)"
                placeholder="What are you saving for?"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Input
                  label="Target Amount (₹)"
                  type="number"
                  placeholder="100000"
                  value={formData.target_amount}
                  onChange={e => setFormData(prev => ({ ...prev, target_amount: e.target.value }))}
                  error={formErrors.target_amount}
                  required
                  step="100"
                  min="100"
                />
              </div>
              <div>
                <Input
                  label="Target Date (Optional)"
                  type="date"
                  value={formData.target_date}
                  onChange={e => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Category</label>
              <Select value={formData.category} onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}