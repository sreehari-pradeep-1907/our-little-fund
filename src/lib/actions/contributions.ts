'use server'

import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import type { Contribution, ContributionType } from '@/types/database'

export async function getContributions(workspaceId: string, limit = 50, offset = 0) {
  const supabase = await createClient()
  
  const { data, error, count } = await supabase
    .from('contributions')
    .select(`
      *,
      profile: profiles(*),
      goal: savings_goals(*)
    `, { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('contribution_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) {
    return { contributions: [], total: 0, error: error.message }
  }
  
  return { contributions: data || [], total: count || 0 }
}

export async function getContributionStats(workspaceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { stats: null, error: 'Not authenticated' }
  }
  
  const { data: member } = await supabase
    .from('workspace_members')
    .select('profile_id')
    .eq('workspace_id', workspaceId)
    .neq('profile_id', user.id)
    .single()
  
  const partnerId = member?.profile_id
  
  const { data: contributions } = await supabase
    .from('contributions')
    .select('amount, profile_id, type, contribution_date')
    .eq('workspace_id', workspaceId)
  
  if (!contributions) {
    return { stats: null }
  }
  
  const totalSaved = contributions.reduce((sum, c) => sum + c.amount, 0)
  const myContributions = contributions.filter(c => c.profile_id === user.id)
  const partnerContributions = partnerId ? contributions.filter(c => c.profile_id === partnerId) : []
  
  const myTotal = myContributions.reduce((sum, c) => sum + c.amount, 0)
  const partnerTotal = partnerContributions.reduce((sum, c) => sum + c.amount, 0)
  
  const { data: workspace } = await supabase
    .from('savings_workspaces')
    .select('target_amount')
    .eq('id', workspaceId)
    .single()
  
  const targetAmount = workspace?.target_amount || 10000000
  const progressPercentage = Math.min((totalSaved / targetAmount) * 100, 100)
  const remainingAmount = Math.max(targetAmount - totalSaved, 0)
  
  // Calculate streak
  const sharedContributions = contributions.filter(c => c.type === 'shared')
  const sortedDates = [...sharedContributions]
    .sort((a, b) => new Date(b.contribution_date).getTime() - new Date(a.contribution_date).getTime())
    .map(c => new Date(c.contribution_date))
  
  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  
  for (const date of sortedDates) {
    const diffDays = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === streak) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (diffDays > streak) {
      break
    }
  }
  
  return {
    stats: {
      total_saved: totalSaved,
      target_amount: targetAmount,
      progress_percentage: progressPercentage,
      remaining_amount: remainingAmount,
      streak,
      my_contributions: myTotal,
      partner_contributions: partnerTotal,
      my_count: myContributions.length,
      partner_count: partnerContributions.length,
    }
  }
}

export async function addContribution(
  workspaceId: string,
  data: {
    amount: number
    type: ContributionType
    description?: string
    payment_reference?: string
    contribution_date: string
    goal_id?: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('contributions')
    .insert({
      workspace_id: workspaceId,
      profile_id: user.id,
      ...data,
    })
  
  if (error) {
    return { error: error.message }
  }
  
  // Update goal current amount if goal_id provided
  if (data.goal_id) {
    const { data: goal } = await supabase
      .from('savings_goals')
      .select('current_amount, target_amount')
      .eq('id', data.goal_id)
      .single()
    
    if (goal) {
      const newAmount = goal.current_amount + data.amount
      const isCompleted = newAmount >= goal.target_amount
      
      await supabase
        .from('savings_goals')
        .update({
          current_amount: newAmount,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', data.goal_id)
    }
  }
  
  return { success: true }
}

export async function updateContribution(
  contributionId: string,
  data: Partial<Pick<Contribution, 'amount' | 'type' | 'description' | 'payment_reference' | 'contribution_date' | 'goal_id'>>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { data: contribution } = await supabase
    .from('contributions')
    .select('*, workspace_id')
    .eq('id', contributionId)
    .single()
  
  if (!contribution) {
    return { error: 'Contribution not found' }
  }
  
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', contribution.workspace_id)
    .eq('profile_id', user.id)
    .single()
  
  if (!member || (member.role !== 'owner' && contribution.profile_id !== user.id)) {
    return { error: 'Not authorized' }
  }
  
  const oldAmount = contribution.amount
  const oldGoalId = contribution.goal_id
  
  const { error } = await supabase
    .from('contributions')
    .update(data)
    .eq('id', contributionId)
  
  if (error) {
    return { error: error.message }
  }
  
  // Handle goal amount updates
  if (data.amount !== undefined || data.goal_id !== undefined) {
    const newAmount = data.amount ?? oldAmount
    const newGoalId = data.goal_id ?? oldGoalId
    
    // Subtract from old goal
    if (oldGoalId && oldGoalId !== newGoalId) {
      const { data: oldGoal } = await supabase
        .from('savings_goals')
        .select('current_amount, target_amount')
        .eq('id', oldGoalId)
        .single()
      
      if (oldGoal) {
        await supabase
          .from('savings_goals')
          .update({
            current_amount: Math.max(0, oldGoal.current_amount - oldAmount),
            is_completed: false,
            completed_at: null,
          })
          .eq('id', oldGoalId)
      }
    }
    
    // Add to new goal
    if (newGoalId) {
      const { data: newGoal } = await supabase
        .from('savings_goals')
        .select('current_amount, target_amount')
        .eq('id', newGoalId)
        .single()
      
      if (newGoal) {
        const updatedAmount = newGoal.current_amount + (data.amount ?? 0) - (oldGoalId === newGoalId ? oldAmount : 0)
        const isCompleted = updatedAmount >= newGoal.target_amount
        
        await supabase
          .from('savings_goals')
          .update({
            current_amount: Math.max(0, updatedAmount),
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
          })
          .eq('id', newGoalId)
      }
    }
  }
  
  return { success: true }
}

export async function deleteContribution(contributionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { data: contribution } = await supabase
    .from('contributions')
    .select('*, workspace_id')
    .eq('id', contributionId)
    .single()
  
  if (!contribution) {
    return { error: 'Contribution not found' }
  }
  
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', contribution.workspace_id)
    .eq('profile_id', user.id)
    .single()
  
  if (!member || (member.role !== 'owner' && contribution.profile_id !== user.id)) {
    return { error: 'Not authorized' }
  }
  
  // Update goal if applicable
  if (contribution.goal_id) {
    const { data: goal } = await supabase
      .from('savings_goals')
      .select('current_amount, target_amount')
      .eq('id', contribution.goal_id)
      .single()
    
    if (goal) {
      await supabase
        .from('savings_goals')
        .update({
          current_amount: Math.max(0, goal.current_amount - contribution.amount),
          is_completed: false,
          completed_at: null,
        })
        .eq('id', contribution.goal_id)
    }
  }
  
  const { error } = await supabase
    .from('contributions')
    .delete()
    .eq('id', contributionId)
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export async function getMonthlyStats(workspaceId: string, year: number, month: number) {
  const supabase = await createClient()
  
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('contributions')
    .select('amount, profile_id, type, contribution_date')
    .eq('workspace_id', workspaceId)
    .gte('contribution_date', startDate)
    .lte('contribution_date', endDate)
  
  if (error) {
    return { stats: null, error: error.message }
  }
  
  const total = data?.reduce((sum, c) => sum + c.amount, 0) || 0
  const shared = data?.filter(c => c.type === 'shared').reduce((sum, c) => sum + c.amount, 0) || 0
  const count = data?.length || 0
  
  return {
    stats: {
      total,
      shared,
      count,
      byProfile: data?.reduce((acc, c) => {
        acc[c.profile_id] = (acc[c.profile_id] || 0) + c.amount
        return acc
      }, {} as Record<string, number>) || {},
    }
  }
}

export async function getContributionHistory(workspaceId: string, months = 12) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('contributions')
    .select('amount, profile_id, type, contribution_date')
    .eq('workspace_id', workspaceId)
    .order('contribution_date', { ascending: true })
  
  if (error) {
    return { history: [], error: error.message }
  }
  
  // Group by month
  const monthlyData: Record<string, { total: number; shared: number; count: number; byProfile: Record<string, number> }> = {}
  
  data?.forEach(c => {
    const date = new Date(c.contribution_date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData[key]) {
      monthlyData[key] = { total: 0, shared: 0, count: 0, byProfile: {} }
    }
    
    monthlyData[key].total += c.amount
    if (c.type === 'shared') monthlyData[key].shared += c.amount
    monthlyData[key].count++
    monthlyData[key].byProfile[c.profile_id] = (monthlyData[key].byProfile[c.profile_id] || 0) + c.amount
  })
  
  const history = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-months)
    .map(([month, data]) => ({
      month,
      ...data,
    }))
  
  return { history }
}