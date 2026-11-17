'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { toZonedTime, format as formatTz } from 'date-fns-tz'
import type { ReminderSetting, ReminderStatus } from '@/types/database'

const TIMEZONE = 'Asia/Kolkata'

function getDaysInMonthForDate(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getReminderDates(year: number, month: number, settings: any) {
  const dates: { reminder_number: number; scheduled_date: Date }[] = []
  
  // Reminder 1: Fixed day (1-7)
  if (settings.reminder_1_enabled) {
    const day = Math.min(settings.reminder_1_day, getDaysInMonthForDate(year, month))
    dates.push({
      reminder_number: 1,
      scheduled_date: new Date(year, month - 1, day),
    })
  }
  
  // Reminder 2: Last day of month or fixed day
  if (settings.reminder_2_enabled) {
    let day: number
    if (settings.reminder_2_last_day) {
      day = getDaysInMonthForDate(year, month)
    } else {
      day = Math.min(settings.reminder_2_day || getDaysInMonthForDate(year, month), getDaysInMonthForDate(year, month))
    }
    dates.push({
      reminder_number: 2,
      scheduled_date: new Date(year, month - 1, day),
    })
  }
  
  return dates
}

export async function getReminderSettings(workspaceId: string) {
  const supabase = await createClient()
  
  const { data: workspace } = await supabase
    .from('savings_workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()
  
  if (!workspace) {
    return { settings: null, error: 'Workspace not found' }
  }
  
  const { data: reminders, error } = await supabase
    .from('reminder_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(24)
  
  if (error) {
    return { settings: workspace, reminders: [], error: error.message }
  }
  
  return { settings: workspace, reminders: reminders || [] }
}

export async function getUpcomingReminders(workspaceId: string) {
  const supabase = await createClient()
  
  const { data: workspace } = await supabase
    .from('savings_workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()
  
  if (!workspace) {
    return { reminders: [] }
  }
  
  const now = toZonedTime(new Date(), TIMEZONE)
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  // Get reminders for current and next month
  const { data: reminders } = await supabase
    .from('reminder_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('year', [currentYear, currentYear + (currentMonth === 12 ? 1 : 0)])
    .in('month', currentMonth === 12 ? [12, 1] : [currentMonth, currentMonth + 1])
    .order('year', { ascending: true })
    .order('month', { ascending: true })
    .order('reminder_number', { ascending: true })
  
  const upcoming: any[] = []
  
  if (reminders) {
    for (const r of reminders) {
      const scheduled = new Date(r.scheduled_date)
      const diffDays = Math.ceil((scheduled.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays >= 0) {
        upcoming.push({
          ...r,
          is_upcoming: true,
          days_until: diffDays,
          label: r.reminder_number === 1 ? workspace.reminder_1_label : workspace.reminder_2_label,
          message: r.reminder_number === 1 ? workspace.reminder_1_message : workspace.reminder_2_message,
        })
      }
    }
  }
  
  // If no reminders in DB for upcoming months, generate them
  if (upcoming.length === 0) {
    for (let i = 0; i < 2; i++) {
      const checkDate = addMonths(now, i)
      const year = checkDate.getFullYear()
      const month = checkDate.getMonth() + 1
      
      const dates = getReminderDates(year, month, workspace)
      
      for (const d of dates) {
        const scheduled = d.scheduled_date
        const diffDays = Math.ceil((scheduled.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays >= 0) {
          upcoming.push({
            id: `generated-${year}-${month}-${d.reminder_number}`,
            workspace_id: workspaceId,
            reminder_number: d.reminder_number,
            year,
            month,
            scheduled_date: scheduled.toISOString().split('T')[0],
            status: 'upcoming' as ReminderStatus,
            is_upcoming: true,
            days_until: diffDays,
            label: d.reminder_number === 1 ? workspace.reminder_1_label : workspace.reminder_2_label,
            message: d.reminder_number === 1 ? workspace.reminder_1_message : workspace.reminder_2_message,
            expected_amount: null,
          })
        }
      }
    }
  }
  
  return { reminders: upcoming.slice(0, 4) }
}

export async function updateReminderSettings(workspaceId: string, data: {
  reminder_1_day?: number
  reminder_1_enabled?: boolean
  reminder_1_time?: string
  reminder_1_label?: string
  reminder_1_message?: string
  reminder_2_last_day?: boolean
  reminder_2_day?: number
  reminder_2_enabled?: boolean
  reminder_2_time?: string
  reminder_2_label?: string
  reminder_2_message?: string
  reminder_timezone?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('profile_id', user.id)
    .single()
  
  if (!member || member.role !== 'owner') {
    return { error: 'Only owners can update reminder settings' }
  }
  
  const { error } = await supabase
    .from('savings_workspaces')
    .update(data)
    .eq('id', workspaceId)
  
  if (error) {
    return { error: error.message }
  }
  
  // Regenerate reminder settings for upcoming months
  await regenerateReminderSettings(workspaceId)
  
  return { success: true }
}

async function regenerateReminderSettings(workspaceId: string) {
  const admin = createAdminClient()
  
  const { data: workspace } = await admin
    .from('savings_workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()
  
  if (!workspace) return
  
  const now = toZonedTime(new Date(), TIMEZONE)
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  // Generate for next 12 months
  for (let i = 0; i < 12; i++) {
    const checkDate = addMonths(now, i)
    const year = checkDate.getFullYear()
    const month = checkDate.getMonth() + 1
    
    const dates = getReminderDates(year, month, workspace)
    
    for (const d of dates) {
      const scheduled = d.scheduled_date
      const isPast = scheduled < now
      
      await admin
        .from('reminder_settings')
        .upsert({
          workspace_id: workspaceId,
          reminder_number: d.reminder_number,
          year,
          month,
          scheduled_date: scheduled.toISOString().split('T')[0],
          status: isPast ? 'pending' : 'upcoming',
          expected_amount: null,
        }, {
          onConflict: 'workspace_id,reminder_number,year,month',
        })
    }
  }
}

export async function markReminderCompleted(reminderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  // Parse generated ID or get from DB
  if (reminderId.startsWith('generated-')) {
    const [, year, month, reminderNumber] = reminderId.split('-')
    
    const { error } = await supabase
      .from('reminder_settings')
      .upsert({
        workspace_id: (await supabase.from('workspace_members').select('workspace_id').eq('profile_id', user.id).single()).data?.workspace_id,
        reminder_number: parseInt(reminderNumber),
        year: parseInt(year),
        month: parseInt(month),
        scheduled_date: new Date(parseInt(year), parseInt(month) - 1, reminderNumber === '1' ? 5 : 28).toISOString().split('T')[0],
        status: 'completed',
        completed_by: user.id,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'workspace_id,reminder_number,year,month',
      })
    
    if (error) {
      return { error: error.message }
    }
    
    return { success: true }
  }
  
  const { data: reminder } = await supabase
    .from('reminder_settings')
    .select('workspace_id')
    .eq('id', reminderId)
    .single()
  
  if (!reminder) {
    return { error: 'Reminder not found' }
  }
  
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', reminder.workspace_id)
    .eq('profile_id', user.id)
    .single()
  
  if (!member) {
    return { error: 'Not authorized' }
  }
  
  const { error } = await supabase
    .from('reminder_settings')
    .update({
      status: 'completed',
      completed_by: user.id,
      completed_at: new Date().toISOString(),
    })
    .eq('id', reminderId)
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export async function getReminderCompletionStatus(workspaceId: string, year: number, month: number) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('reminder_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('year', year)
    .eq('month', month)
  
  if (error) {
    return { status: {}, error: error.message }
  }
  
  const status: Record<number, ReminderStatus> = {}
  data?.forEach(r => {
    status[r.reminder_number] = r.status
  })
  
  return { status }
}