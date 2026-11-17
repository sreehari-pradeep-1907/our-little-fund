export const APP_NAME = 'Our Little Fund'
export const APP_TAGLINE = 'Little by little, together.'
export const WELCOME_MESSAGE = 'Two hearts. One goal. A future we\'re building together.'
export const HERO_MESSAGE = 'Good things take time. Let\'s save for them together.'

export const DEFAULT_REMINDER_1_DAY = 5
export const DEFAULT_REMINDER_2_LAST_DAY = true
export const DEFAULT_REMINDER_TIME = '09:00'
export const DEFAULT_TIMEZONE = 'Asia/Kolkata'

export const REMINDER_1_LABEL = 'First Week Savings Day'
export const REMINDER_2_LABEL = 'Month-End Savings Day'

export const REMINDER_1_MESSAGE = 'New month, new savings! ❤️ It\'s time to contribute to our future.'
export const REMINDER_2_MESSAGE = 'Another month, another step toward our dreams. Let\'s save together! 💗'

export const CONTRIBUTION_TYPES = ['personal', 'shared'] as const
export const GOAL_CATEGORIES = [
  'emergency',
  'travel',
  'home',
  'occasion',
  'dream',
  'other',
] as const

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CONTRIBUTIONS: '/contributions',
  ADD_CONTRIBUTION: '/add-contribution',
  GOALS: '/goals',
  ANALYTICS: '/analytics',
  PAY: '/pay',
  REMINDERS: '/reminders',
  SETTINGS: '/settings',
} as const

export const STORAGE_BUCKETS = {
  QR_CODES: 'qr-codes',
  AVATARS: 'avatars',
  GOAL_COVERS: 'goal-covers',
} as const