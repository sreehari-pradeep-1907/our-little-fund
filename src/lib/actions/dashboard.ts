'use server'

import { createClient } from '@/lib/supabase/server'
import { format, subMonths } from 'date-fns'
import type { DashboardStats, ReminderInfo } from '@/types/database'

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { stats: null, error: 'Not authenticated' }
  }
  
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('profile_id', user.id)
    .single()
  
  if (!member) {
    return { stats: null, error: 'No workspace found' }
  }
  
  const workspaceId = member.workspace_id
  
  // Get all contributions
  const { data: contributions } = await supabase
    .from('contributions')
    .select('amount, profile_id, type, contribution_date')
    .eq('workspace_id', workspaceId)
  
  if (!contributions) {
    return { stats: null }
  }
  
  // Get partner ID
  const { data: partnerMember } = await supabase
    .from('workspace_members')
    .select('profile_id')
    .eq('workspace_id', workspaceId)
    .neq('profile_id', user.id)
    .single()
  
  const partnerId = partnerMember?.profile_id
  
  const totalSaved = contributions.reduce((sum, c) => sum + c.amount, 0)
  const myContributions = contributions.filter(c => c.profile_id === user.id)
  const partnerContributions = partnerId ? contributions.filter(c => c.profile_id === partnerId) : []
  
  const myTotal = myContributions.reduce((sum, c) => sum + c.amount, 0)
  const partnerTotal = partnerContributions.reduce((sum, c) => sum + c.amount, 0)
  
  // Get workspace target
  const { data: workspace } = await supabase
    .from('savings_workspaces')
    .select('target_amount')
    .eq('id', workspaceId)
    .single()
  
  const targetAmount = workspace?.target_amount || 10000000
  const progressPercentage = Math.min((totalSaved / targetAmount) * 100, 100)
  const remainingAmount = Math.max(targetAmount - totalSaved, 0)
  
  // Calculate streak using shared contributions
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

export async function getUpcomingReminders() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { reminders: [] }
  }
  
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('profile_id', user.id)
    .single()
  
  if (!member) {
    return { reminders: [] }
  }
  
  const workspaceId = member.workspace_id
  
  // Get workspace settings
  const { data: workspace } = await supabase
    .from('savings_workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()
  
  if (!workspace) {
    return { reminders: [] }
  }
  
  // Get reminders from DB for current and next month
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  const { data: reminders } = await supabase
    .from('reminder_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('year', currentYear)
    .order('year', { ascending: true })
    .order('month', { ascending: true })
    .order('reminder_number', { ascending: true })
    .limit(12)
  
  const upcoming: ReminderInfo[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (reminders) {
    for (const r of reminders) {
      const scheduled = new Date(r.scheduled_date)
      scheduled.setHours(0, 0, 0, 0)
      
      const diffDays = Math.ceil((scheduled.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays >= -1) { // Include today and yesterday
        upcoming.push({
          id: r.id,
          reminder_number: r.reminder_number,
          label: r.reminder_number === 1 ? workspace.reminder_1_label : workspace.reminder_2_label,
          message: r.reminder_number === 1 ? workspace.reminder_1_message : workspace.reminder_2_message,
          scheduled_date: r.scheduled_date,
          status: r.status,
          is_upcoming: diffDays >= 0,
          days_until: Math.max(0, diffDays),
          expected_amount: r.expected_amount || undefined,
        })
      }
    }
  }
  
  // If no reminders in DB, generate from workspace settings
  if (upcoming.length === 0) {
    for (let i = 0; i < 3; i++) {
      const checkDate = new Date(currentYear, currentMonth - 1 + i, 1)
      const year = checkDate.getFullYear()
      const month = checkDate.getMonth() + 1
      const lastDay = new Date(year, month, 0).getDate()
      
      // Reminder 1
      if (workspace.reminder_1_enabled) {
        const day = Math.min(workspace.reminder_1_day, lastDay)
        const scheduled = new Date(year, month - 1, day)
        scheduled.setHours(0, 0, 0, 0)
        const diffDays = Math.ceil((scheduled.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays >= -1) {
          upcoming.push({
            id: `gen-${year}-${month}-1`,
            reminder_number: 1,
            label: workspace.reminder_1_label,
            message: workspace.reminder_1_message,
            scheduled_date: scheduled,
            status: diffDays < 0 ? 'pending' : 'upcoming',
            is_upcoming: diffDays >= 0,
            days_until: Math.max(0, diffDays),
          })
        }
      }
      
      // Reminder 2
      if (workspace.reminder_2_enabled) {
        const day = workspace.reminder_2_last_day ? lastDay : (workspace.reminder_2_day || lastDay)
        const scheduled = new Date(year, month - 1, day)
        scheduled.setHours(0, 0, 0, 0)
        const diffDays = Math.ceil((scheduled.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays >= -1) {
          upcoming.push({
            id: `gen-${year}-${month}-2`,
            reminder_number: 2,
            label: workspace.reminder_2_label,
            message: workspace.reminder_2_message,
            scheduled_date: scheduled,
            status: diffDays < 0 ? 'pending' : 'upcoming',
            is_upcoming: diffDays >= 0,
            days_until: Math.max(0, diffDays),
          })
        }
      }
    }
  }
  
  return { reminders: upcoming.slice(0, 4) }
}

export async function getRecentContributions(limit = 10) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { contributions: [] }
  }
  
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('profile_id', user.id)
    .single()
  
  if (!member) {
    return { contributions: [] }
  }
  
  const { data, error } = await supabase
    .from('contributions')
    .select(`
      *,
      profile: profiles(display_name, avatar_url)
    `)
    .eq('workspace_id', member.workspace_id)
    .order('contribution_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    return { contributions: [], error: error.message }
  }
  
  return { contributions: data || [] }
}

export async function getUserWorkspace() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { workspace: null, member: null }
  }
  
  const { data: member } = await supabase
    .from('workspace_members')
    .select(`
      *,
      workspace: savings_workspaces(*),
      profile: profiles(*)
    `)
    .eq('profile_id', user.id)
    .single()
  
  if (!member) {
    return { workspace: null, member: null }
  }
  
  // Get all members with profiles
  const { data: members } = await supabase
    .from('workspace_members')
    .select(`
      *,
      profile: profiles(*)
    `)
    .eq('workspace_id', member.workspace_id)
    .order('joined_at', { ascending: true })
  
  return { 
    workspace: { ...member.workspace, members: members || [] }, 
    member 
  }
}

export async function getMonthlyChartData(months = 6) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: [] }
  }
  
  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('profile_id', user.id)
    .single()
  
  if (!member) {
    return { data: [] }
  }
  
  const { data: contributions } = await supabase
    .from('contributions')
    .select('amount, contribution_date, profile_id, type')
    .eq('workspace_id', member.workspace_id)
    .gte('contribution_date', format(subMonths(new Date(), months), 'yyyy-MM-01'))
    .order('contribution_date', { ascending: true })
  
  if (!contributions) {
    return { data: [] }
  }
  
  // Group by month
  const monthlyData: Record<string, { 
    month: string
    total: number
    shared: number
    me: number
    partner: number
  }> = {}
  
  const { data: partnerMember } = await supabase
    .from('workspace_members')
    .select('profile_id')
    .eq('workspace_id', member.workspace_id)
    .neq('profile_id', user.id)
    .single()
  
  const partnerId = partnerMember?.profile_id
  
  contributions.forEach(c => {
    const date = new Date(c.contribution_date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData[key]) {
      monthlyData[key] = { month: key, total: 0, shared: 0, me: 0, partner: 0 }
    }
    
    monthlyData[key].total += c.amount
    if (c.type === 'shared') monthlyData[key].shared += c.amount
    if (c.profile_id === user.id) monthlyData[key].me += c.amount
    if (partnerId && c.profile_id === partnerId) monthlyData[key].partner += c.amount
  })
  
  // Fill missing months
  const result = []
  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = format(date, 'MMM yyyy')
    
    const monthlyEntry = monthlyData[key] || { total: 0, shared: 0, me: 0, partner: 0, month: monthName }
    result.push({
      ...monthlyEntry,
      month: monthName,
    })
  }
  
  return { data: result }
}