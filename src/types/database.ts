export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MemberRole = 'owner' | 'member'
export type ContributionType = 'personal' | 'shared'
export type GoalCategory = 'emergency' | 'travel' | 'home' | 'occasion' | 'dream' | 'other'
export type ReminderStatus = 'pending' | 'completed' | 'upcoming'
export type NotificationType = 'push' | 'email'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  display_name: string | null
  timezone: string
  created_at: string
  updated_at: string
}

export interface SavingsWorkspace {
  id: string
  name: string
  tagline: string | null
  invite_code: string
  target_amount: number
  currency: string
  reminder_1_day: number
  reminder_1_enabled: boolean
  reminder_1_time: string
  reminder_1_label: string
  reminder_1_message: string
  reminder_2_last_day: boolean
  reminder_2_day: number | null
  reminder_2_enabled: boolean
  reminder_2_time: string
  reminder_2_label: string
  reminder_2_message: string
  reminder_timezone: string
  upi_id: string | null
  qr_code_path: string | null
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  profile_id: string
  role: MemberRole
  joined_at: string
  notification_enabled: boolean
  email_notifications: boolean
  push_subscription: Json | null
  created_at: string
  updated_at: string
  profile?: Profile
}

export interface SavingsGoal {
  id: string
  workspace_id: string
  name: string
  description: string | null
  target_amount: number
  current_amount: number
  target_date: string | null
  category: GoalCategory
  cover_image_path: string | null
  is_completed: boolean
  completed_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Contribution {
  id: string
  workspace_id: string
  profile_id: string
  goal_id: string | null
  amount: number
  type: ContributionType
  description: string | null
  payment_reference: string | null
  contribution_date: string
  created_at: string
  updated_at: string
  profile?: Profile
  goal?: SavingsGoal
}

export interface ReminderSetting {
  id: string
  workspace_id: string
  reminder_number: number
  year: number
  month: number
  scheduled_date: string
  status: ReminderStatus
  completed_by: string | null
  completed_at: string | null
  expected_amount: number | null
  notified_at: string | null
  created_at: string
  updated_at: string
}

export interface NotificationSubscription {
  id: string
  profile_id: string
  workspace_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NotificationDelivery {
  id: string
  workspace_id: string
  profile_id: string
  reminder_setting_id: string | null
  type: NotificationType
  status: string
  error_message: string | null
  sent_at: string
}

export interface WorkspaceWithMembers extends SavingsWorkspace {
  members: (WorkspaceMember & { profile: Profile })[]
}

export interface DashboardStats {
  total_saved: number
  target_amount: number
  progress_percentage: number
  remaining_amount: number
  streak: number
  my_contributions: number
  partner_contributions: number
  my_count: number
  partner_count: number
}

export interface ReminderInfo {
  id: string
  reminder_number: number
  label: string
  message: string
  scheduled_date: Date
  status: ReminderStatus
  is_upcoming: boolean
  days_until: number
  expected_amount?: number
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}