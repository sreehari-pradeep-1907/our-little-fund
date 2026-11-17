import { createAdminClient } from '@/lib/supabase/admin'
import { toZonedTime as utcToZonedTime } from 'date-fns-tz'
import webpush from 'web-push'

export const dynamic = 'force-dynamic'

const CRON_SECRET = process.env.CRON_SECRET
const TIMEZONE = 'Asia/Kolkata'

function initWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
  )
}

export async function GET(request: Request) {
  initWebPush()
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient()
  
  // Get current date in IST
  const now = utcToZonedTime(new Date(), TIMEZONE)
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  try {
    // Find all workspaces that have reminders scheduled for today
    const { data: workspaces } = await admin
      .from('savings_workspaces')
      .select('id, reminder_1_enabled, reminder_1_day, reminder_2_enabled, reminder_2_last_day, reminder_2_day')
    
    if (!workspaces || workspaces.length === 0) {
      return Response.json({ message: 'No workspaces found', sent: 0 })
    }

    let totalSent = 0
    const errors: string[] = []

    for (const workspace of workspaces) {
      const remindersToSend: number[] = []

      // Check reminder 1 (fixed day 1-7)
      if (workspace.reminder_1_enabled && workspace.reminder_1_day === day) {
        remindersToSend.push(1)
      }

      // Check reminder 2 (last day of month or fixed day)
      if (workspace.reminder_2_enabled) {
        const lastDay = new Date(year, month, 0).getDate()
        const reminder2Day = workspace.reminder_2_last_day ? lastDay : (workspace.reminder_2_day || lastDay)
        
        if (reminder2Day === day) {
          remindersToSend.push(2)
        }
      }

      for (const reminderNumber of remindersToSend) {
        // Check if already notified today (prevent duplicates)
        const { data: existingReminder } = await admin
          .from('reminder_settings')
          .select('id, notified_at, status')
          .eq('workspace_id', workspace.id)
          .eq('reminder_number', reminderNumber)
          .eq('year', year)
          .eq('month', month)
          .single()

        if (existingReminder?.notified_at) {
          const notifiedDate = new Date(existingReminder.notified_at)
          if (notifiedDate.getDate() === day && 
              notifiedDate.getMonth() + 1 === month && 
              notifiedDate.getFullYear() === year) {
            continue // Already sent today
          }
        }

        // Get workspace members with notifications enabled
        const { data: members } = await admin
          .from('workspace_members')
          .select(`
            profile_id,
            notification_enabled,
            profile: profiles(display_name)
          `)
          .eq('workspace_id', workspace.id)
          .eq('notification_enabled', true)

        if (!members || members.length === 0) {
          continue
        }

        const label = reminderNumber === 1 
          ? (await admin.from('savings_workspaces').select('reminder_1_label').eq('id', workspace.id).single()).data?.reminder_1_label || 'First Week Savings Day'
          : (await admin.from('savings_workspaces').select('reminder_2_label').eq('id', workspace.id).single()).data?.reminder_2_label || 'Month-End Savings Day'
        
        const message = reminderNumber === 1
          ? (await admin.from('savings_workspaces').select('reminder_1_message').eq('id', workspace.id).single()).data?.reminder_1_message || 'New month, new savings! ❤️ It\'s time to contribute to our future.'
          : (await admin.from('savings_workspaces').select('reminder_2_message').eq('id', workspace.id).single()).data?.reminder_2_message || 'Another month, another step toward our dreams. Let\'s save together! 💗'

        for (const member of members) {
          const { data: subscriptions } = await admin
            .from('notification_subscriptions')
            .select('*')
            .eq('profile_id', member.profile_id)
            .eq('is_active', true)

          if (!subscriptions || subscriptions.length === 0) {
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
                  workspace_id: workspace.id,
                  profile_id: member.profile_id,
                  reminder_setting_id: existingReminder?.id,
                  type: 'push',
                  status: 'sent',
                })

              totalSent++
            } catch (error: any) {
              errors.push(`Workspace ${workspace.id}, member ${member.profile_id}: ${error.message}`)

              await admin
                .from('notification_deliveries')
                .insert({
                  workspace_id: workspace.id,
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
        if (existingReminder) {
          await admin
            .from('reminder_settings')
            .update({ notified_at: new Date().toISOString() })
            .eq('id', existingReminder.id)
        } else {
          // Create reminder setting if it doesn't exist
          await admin
            .from('reminder_settings')
            .upsert({
              workspace_id: workspace.id,
              reminder_number: reminderNumber,
              year,
              month,
              scheduled_date: new Date(year, month - 1, day).toISOString().split('T')[0],
              status: 'pending',
              notified_at: new Date().toISOString(),
            }, {
              onConflict: 'workspace_id,reminder_number,year,month',
            })
        }
      }
    }

    return Response.json({
      message: 'Cron job completed',
      sent: totalSent,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Cron job error:', error)
    return Response.json(
      { error: error.message, timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}