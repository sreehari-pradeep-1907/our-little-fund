'use server'

import { createClient } from '@/lib/supabase/server'
import type { SavingsGoal, GoalCategory } from '@/types/database'

export async function getGoals(workspaceId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  
  if (error) {
    return { goals: [], error: error.message }
  }
  
  return { goals: data || [] }
}

export async function getGoal(goalId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('id', goalId)
    .single()
  
  if (error) {
    return { goal: null, error: error.message }
  }
  
  return { goal: data }
}

export async function createGoal(
  workspaceId: string,
  data: {
    name: string
    description?: string
    target_amount: number
    target_date?: string
    category: GoalCategory
    cover_image_path?: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('savings_goals')
    .insert({
      workspace_id: workspaceId,
      created_by: user.id,
      ...data,
    })
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export async function updateGoal(
  goalId: string,
  data: Partial<Pick<SavingsGoal, 'name' | 'description' | 'target_amount' | 'target_date' | 'category' | 'cover_image_path' | 'current_amount' | 'is_completed'>>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { data: goal } = await supabase
    .from('savings_goals')
    .select('*, workspace_id')
    .eq('id', goalId)
    .single()
  
  if (!goal) {
    return { error: 'Goal not found' }
  }
  
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', goal.workspace_id)
    .eq('profile_id', user.id)
    .single()
  
  if (!member || (member.role !== 'owner' && goal.created_by !== user.id)) {
    return { error: 'Not authorized' }
  }
  
  const updates: any = { ...data }
  
  if (data.is_completed && !goal.is_completed) {
    updates.completed_at = new Date().toISOString()
  } else if (!data.is_completed && goal.is_completed) {
    updates.completed_at = null
  }
  
  const { error } = await supabase
    .from('savings_goals')
    .update(updates)
    .eq('id', goalId)
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export async function deleteGoal(goalId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { data: goal } = await supabase
    .from('savings_goals')
    .select('*, workspace_id')
    .eq('id', goalId)
    .single()
  
  if (!goal) {
    return { error: 'Goal not found' }
  }
  
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', goal.workspace_id)
    .eq('profile_id', user.id)
    .single()
  
  if (!member || member.role !== 'owner') {
    return { error: 'Only owners can delete goals' }
  }
  
  const { error } = await supabase
    .from('savings_goals')
    .delete()
    .eq('id', goalId)
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export async function uploadGoalCover(goalId: string, file: File) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { data: goal } = await supabase
    .from('savings_goals')
    .select('workspace_id')
    .eq('id', goalId)
    .single()
  
  if (!goal) {
    return { error: 'Goal not found' }
  }
  
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', goal.workspace_id)
    .eq('profile_id', user.id)
    .single()
  
  if (!member) {
    return { error: 'Not authorized' }
  }
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${goalId}/cover.${fileExt}`
  
  const { error: uploadError } = await supabase.storage
    .from('goal-covers')
    .upload(fileName, file, { upsert: true })
  
  if (uploadError) {
    return { error: uploadError.message }
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('goal-covers')
    .getPublicUrl(fileName)
  
  const { error: updateError } = await supabase
    .from('savings_goals')
    .update({ cover_image_path: fileName })
    .eq('id', goalId)
  
  if (updateError) {
    return { error: updateError.message }
  }
  
  return { url: publicUrl, path: fileName }
}

export async function getGoalCoverUrl(goalId: string) {
  const supabase = await createClient()
  
  const { data: goal } = await supabase
    .from('savings_goals')
    .select('cover_image_path')
    .eq('id', goalId)
    .single()
  
  if (!goal?.cover_image_path) {
    return { url: null }
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('goal-covers')
    .getPublicUrl(goal.cover_image_path)
  
  return { url: publicUrl }
}

export async function getGoalProgress(workspaceId: string) {
  const supabase = await createClient()
  
  const { data: goals } = await supabase
    .from('savings_goals')
    .select('target_amount, current_amount, is_completed')
    .eq('workspace_id', workspaceId)
  
  if (!goals) {
    return { progress: { total_target: 0, total_current: 0, completed_count: 0, total_count: 0 } }
  }
  
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0)
  const totalCurrent = goals.reduce((sum, g) => sum + g.current_amount, 0)
  const completedCount = goals.filter(g => g.is_completed).length
  
  return {
    progress: {
      total_target: totalTarget,
      total_current: totalCurrent,
      completed_count: completedCount,
      total_count: goals.length,
      overall_percentage: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
    }
  }
}