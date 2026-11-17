'use client'
export const dynamic = "force-dynamic"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Heart, ArrowLeft, Calendar, User, CreditCard, Sparkles, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { addContribution } from '@/lib/actions/contributions'
import { getUserWorkspace } from '@/lib/actions/auth'
import { getGoals } from '@/lib/actions/goals'
import { toast } from '@/hooks/use-toast'
import { useUserStore } from '@/stores/user-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { demoWorkspace, demoGoals } from '@/lib/demo-data'

interface Goal {
  id: string
  name: string
  target_amount: number
  current_amount: number
}

export default function AddContributionPage() {
  const router = useRouter()
  const { user } = useUserStore()
  const { workspace, setWorkspace } = useWorkspaceStore()
  const [loading, setLoading] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [isDemo, setIsDemo] = useState(false)
  const [formData, setFormData] = useState({
    profile_id: user?.id || '',
    amount: '',
    type: 'shared' as 'shared' | 'personal',
    description: '',
    payment_reference: '',
    contribution_date: new Date().toISOString().split('T')[0],
    goal_id: '',
  })
  const [errors, setErrors] = useState<Partial<typeof formData>>({})

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === 'true') {
      setIsDemo(true)
      setWorkspace(demoWorkspace)
      setGoals(demoGoals)
      setFormData(prev => ({ ...prev, profile_id: 'demo-user-1' }))
    } else {
      loadData()
    }
  }, [])

  const loadData = async () => {
    try {
      const workspaceRes = await getUserWorkspace()
      const goalsRes = await getGoals(workspaceRes.workspace?.id || '')

      if (workspaceRes.workspace) {
        setWorkspace(workspaceRes.workspace)
        setFormData(prev => ({ ...prev, profile_id: user?.id || '' }))
      }
      if (goalsRes.goals) {
        setGoals(goalsRes.goals.filter(g => !g.is_completed))
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({ title: 'Failed to load data', variant: 'destructive' })
    }
  }

  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {}
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount'
    }
    
    if (!formData.contribution_date) {
      newErrors.contribution_date = 'Please select a date'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    const amountInPaise = Math.round(parseFloat(formData.amount) * 100)
    
    if (isDemo) {
      setTimeout(() => {
        setLoading(false)
        toast({ 
          title: 'Contribution added! (Demo)', 
          description: `Added ${formatCurrency(amountInPaise)} to your savings`,
          variant: 'success' 
        })
        router.push('/contributions?demo=true')
      }, 500)
      return
    }
    
    const workspaceId = workspace?.id
    if (!workspaceId) {
      toast({ title: 'No workspace found', variant: 'destructive' })
      setLoading(false)
      return
    }
    
    const result = await addContribution(workspaceId, {
      amount: amountInPaise,
      type: formData.type,
      description: formData.description || undefined,
      payment_reference: formData.payment_reference || undefined,
      contribution_date: formData.contribution_date,
      goal_id: formData.goal_id || undefined,
    })
    
    setLoading(false)
    
    if (result.error) {
      toast({ title: result.error, variant: 'destructive' })
    } else {
      toast({ 
        title: 'Contribution added!', 
        description: `${formatCurrency(amountInPaise)} has been recorded`,
        variant: 'success' 
      })
      router.push('/contributions')
    }
  }
  
  const partner = workspace?.members?.find(m => m.profile_id !== user?.id)?.profile

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="page-container max-w-2xl">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-semibold text-charcoal">Add Contribution</h1>
            <p className="text-sm text-charcoal/60">Record a new savings entry</p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Contributor */}
          <Card className="border-blush/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-rose" />
                Contributor
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-3 sm:grid-cols-2">
                {workspace?.members?.map(member => (
                  <Button
                    key={member.profile_id}
                    type="button"
                    variant={formData.profile_id === member.profile_id ? 'default' : 'outline'}
                    className="w-full justify-start gap-3"
                    onClick={() => setFormData(prev => ({ ...prev, profile_id: member.profile_id }))}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.profile.avatar_url || undefined} alt={member.profile.display_name || ''} />
                      <AvatarFallback className="text-rose font-medium">
                        {member.profile.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{member.profile.display_name || member.profile.email}</span>
                    {member.profile_id === user?.id && (
                      <span className="ml-auto text-xs text-rose">You</span>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Amount */}
          <Card className="border-blush/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose" />
                Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/50">₹</span>
                <Input
                  type="number"
                  id="amount"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="pl-8"
                  required
                  error={errors.amount}
                  step="0.01"
                  min="0.01"
                  inputMode="decimal"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[100, 500, 1000, 2000, 5000].map(amount => (
                  <Button
                    key={amount}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
                  >
                    ₹{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Type */}
          <Card className="border-blush/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-rose" />
                Type
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant={formData.type === 'shared' ? 'default' : 'outline'}
                  className="w-full justify-start gap-3"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'shared' }))}
                >
                  <Heart className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Shared Savings</p>
                    <p className="text-xs text-charcoal/50">Counts toward our joint goal</p>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'personal' ? 'default' : 'outline'}
                  className="w-full justify-start gap-3"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'personal' }))}
                >
                  <User className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Personal</p>
                    <p className="text-xs text-charcoal/50">Individual savings tracking</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Date */}
          <Card className="border-blush/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-rose" />
                Date
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Input
                type="date"
                id="contribution_date"
                value={formData.contribution_date}
                onChange={e => setFormData(prev => ({ ...prev, contribution_date: e.target.value }))}
                required
                error={errors.contribution_date}
                max={new Date().toISOString().split('T')[0]}
              />
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="border-blush/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-rose" />
                Description (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                id="description"
                placeholder="What was this for? e.g., Monthly savings, Bonus, Gift..."
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Payment Reference */}
          <Card className="border-blush/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-rose" />
                Payment Reference (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Input
                type="text"
                id="payment_reference"
                placeholder="UPI transaction ID, bank reference, etc."
                value={formData.payment_reference}
                onChange={e => setFormData(prev => ({ ...prev, payment_reference: e.target.value }))}
              />
            </CardContent>
          </Card>

          {/* Goal (Optional) */}
          {goals.length > 0 && (
            <Card className="border-blush/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-rose" />
                  Allocate to Goal (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Select value={formData.goal_id} onValueChange={value => setFormData(prev => ({ ...prev, goal_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a goal (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None - General Savings</SelectItem>
                    {goals.map(goal => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.name} ({formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" size="lg" loading={loading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Add Contribution'}
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </motion.form>
      </main>
    </div>
  )
}