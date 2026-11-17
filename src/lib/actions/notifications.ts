'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import webpush from 'web-push'
import type { PushSubscriptionData } from '@/types/database'

// Initialize web-push with VAPID keys
function initWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
  )
}

export async function subscribeToPush(subscription: PushSubscriptionData, workspaceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('notification_subscriptions')
    .upsert({
      profile_id: user.id,
      workspace_id: workspaceId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      is_active: true,
    }, {
      onConflict: 'profile_id,endpoint',
    })
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export async function unsubscribeFromPush(endpoint: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('notification_subscriptions')
    .update({ is_active: false })
    .eq('profile_id', user.id)
    .eq('endpoint', endpoint)
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export async function getPushSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { subscription: null }
  }
  
  const { data, error } = await supabase
    .from('notification_subscriptions')
    .select('*')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  
  if (error || !data) {
    return { subscription: null }
  }
  
  return {
    subscription: {
      endpoint: data.endpoint,
      keys: {
        p256dh: data.p256dh,
        auth: data.auth,
      },
    }
  }
}

export async function sendTestNotification(workspaceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { data: member } = await supabase
    .from('workspace_members')
    .select('notification_enabled')
    .eq('workspace_id', workspaceId)
    .eq('profile_id', user.id)
    .single()
  
  if (!member?.notification_enabled) {
    return { error: 'Notifications are disabled for you' }
  }
  
  const { data: subscription } = await supabase
    .from('notification_subscriptions')
    .select('*')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  
  if (!subscription) {
    return { error: 'No push subscription found. Please enable notifications first.' }
  }
  
  initWebPush()
  
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({
        title: 'Our Little Fund 💕',
        body: 'This is a test notification! Your savings reminders are working.',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'test-notification',
        data: { url: '/dashboard' },
      })
    )
    
    // Log delivery
    await supabase
      .from('notification_deliveries')
      .insert({
        workspace_id: workspaceId,
        profile_id: user.id,
        type: 'push',
        status: 'sent',
      })
    
    return { success: true }
  } catch (error: any) {
    // Log failed delivery
    await supabase
      .from('notification_deliveries')
      .insert({
        workspace_id: workspaceId,
        profile_id: user.id,
        type: 'push',
        status: 'failed',
        error_message: error.message,
      })
    
    if (error.statusCode === 410) {
      // Subscription expired, mark as inactive
      await supabase
        .from('notification_subscriptions')
        .update({ is_active: false })
        .eq('id', subscription.id)
    }
    
    return { error: error.message }
  }
}

export async function sendReminderNotifications(workspaceId: string, reminderNumber: number, year: number, month: number) {
  const admin = createAdminClient()
  
  const { data: workspace } = await admin
    .from('savings_workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()
  
  if (!workspace) {
    return { sent: 0, errors: ['Workspace not found'] }
  }
  
  const label = reminderNumber === 1 ? workspace.reminder_1_label : workspace.reminder_2_label
  const message = reminderNumber === 1 ? workspace.reminder_1_message : workspace.reminder_2_message
  
  const { data: members } = await admin
    .from('workspace_members')
    .select(`
      profile_id,
      notification_enabled,
      profile: profiles(display_name)
    `)
    .eq('workspace_id', workspaceId)
    .eq('notification_enabled', true)
  
  if (!members || members.length === 0) {
    return { sent: 0, errors: ['No members with notifications enabled'] }
  }
  
  initWebPush()
  
  let sent = 0
  const errors: string[] = []
  
  for (const member of members) {
    const { data: subscriptions } = await admin
      .from('notification_subscriptions')
      .select('*')
      .eq('profile_id', member.profile_id)
      .eq('is_active', true)
    
    if (!subscriptions || subscriptions.length === 0) {
      errors.push(`No subscription for ${(member.profile as any)?.display_name || member.profile_id}`)
      continue
    }
    
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({
            title: `Our Little Fund: ${label} ❤️`,
            body: message,
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            tag: `reminder-${year}-${month}-${reminderNumber}`,
            data: { url: '/dashboard', reminderNumber, year, month },
          })
        )
        
        await admin
          .from('notification_deliveries')
          .insert({
            workspace_id: workspaceId,
            profile_id: member.profile_id,
            reminder_setting_id: (
              await admin
                .from('reminder_settings')
                .select('id')
                .eq('workspace_id', workspaceId)
                .eq('reminder_number', reminderNumber)
                .eq('year', year)
                .eq('month', month)
                .single()
            ).data?.id,
            type: 'push',
            status: 'sent',
          })
        
        sent++
      } catch (error: any) {
        errors.push(`Failed for ${(member.profile as any)?.display_name || member.profile_id}: ${error.message}`)
        
        await admin
          .from('notification_deliveries')
          .insert({
            workspace_id: workspaceId,
            profile_id: member.profile_id,
            type: 'push',
            status: 'failed',
            error_message: error.message,
          })
        
        if (error.statusCode === 410) {
          await admin
            .from('notification_subscriptions')
            .update({ is_active: false })
            .eq('id', sub.id)
        }
      }
    }
  }
  
  // Mark reminder as notified
  await admin
    .from('reminder_settings')
    .update({ notified_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)
    .eq('reminder_number', reminderNumber)
    .eq('year', year)
    .eq('month', month)
  
  return { sent, errors }
}

export async function updateNotificationPreferences(workspaceId: string, enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('workspace_members')
    .update({ notification_enabled: enabled })
    .eq('workspace_id', workspaceId)
    .eq('profile_id', user.id)
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export async function getVapidPublicKey() {
  return { publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '' }
}