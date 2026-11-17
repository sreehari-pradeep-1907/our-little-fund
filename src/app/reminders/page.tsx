'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Bell, CheckCircle, AlertCircle, CalendarDays, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { getUpcomingReminders, getReminderSettings, updateReminderSettings, markReminderCompleted } from '@/lib/actions/reminders'
import { getUserWorkspace } from '@/lib/actions/auth'
import { toast } from '@/hooks/use-toast'
import { useUserStore } from '@/stores/user-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { demoWorkspace, demoReminders } from '@/lib/demo-data'

interface ReminderInfo {
  id: string
  reminder_number: number
  label: string
  message: string
  scheduled_date: string
  status: string
  is_upcoming: boolean
  days_until: number
  expected_amount?: number
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function RemindersPage() {
  const { user } = useUserStore()
  const { workspace, setWorkspace, updateWorkspace: updateWorkspaceStore } = useWorkspaceStore()
  const [reminders, setReminders] = useState<ReminderInfo[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [isDemo, setIsDemo] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    reminder_1_day: 5,
    reminder_1_enabled: true,
    reminder_1_time: '09:00',
    reminder_1_label: 'First Week Savings Day',
    reminder_1_message: 'New month, new savings! ❤️ It\'s time to contribute to our future.',
    reminder_2_last_day: true,
    reminder_2_day: 28,
    reminder_2_enabled: true,
    reminder_2_time: '09:00',
    reminder_2_label: 'Month-End Savings Day',
    reminder_2_message: 'Another month, another step toward our dreams. Let\'s save together! 💗',
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === 'true') {
      setIsDemo(true)
      setWorkspace(demoWorkspace)
      setReminders(demoReminders)
      setSettingsForm({
        reminder_1_day: 5,
        reminder_1_enabled: true,
        reminder_1_time: '09:00',
        reminder_1_label: 'First Week Savings Day',
        reminder_1_message: 'New month, new savings! ❤️ It\'s time to contribute to our future.',
        reminder_2_last_day: true,
        reminder_2_day: 28,
        reminder_2_enabled: true,
        reminder_2_time: '09:00',
        reminder_2_label: 'Month-End Savings Day',
        reminder_2_message: 'Another month, another step toward our dreams. Let\'s save together! 💗',
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
      const [remindersRes, settingsRes] = await Promise.all([
        getUpcomingReminders(workspaceRes.workspace?.id || ''),
        getReminderSettings(workspaceRes.workspace?.id || ''),
      ])

      if (workspaceRes.workspace) {
        setWorkspace(workspaceRes.workspace)
        if (workspaceRes.workspace.reminder_1_day) {
          setSettingsForm(prev => ({
            ...prev,
            reminder_1_day: workspaceRes.workspace.reminder_1_day,
            reminder_1_enabled: workspaceRes.workspace.reminder_1_enabled,
            reminder_1_time: workspaceRes.workspace.reminder_1_time?.slice(0, 5) || '09:00',
            reminder_1_label: workspaceRes.workspace.reminder_1_label,
            reminder_1_message: workspaceRes.workspace.reminder_1_message,
            reminder_2_last_day: workspaceRes.workspace.reminder_2_last_day,
            reminder_2_day: workspaceRes.workspace.reminder_2_day,
            reminder_2_enabled: workspaceRes.workspace.reminder_2_enabled,
            reminder_2_time: workspaceRes.workspace.reminder_2_time?.slice(0, 5) || '09:00',
            reminder_2_label: workspaceRes.workspace.reminder_2_label,
            reminder_2_message: workspaceRes.workspace.reminder_2_message,
          }))
        }
      }
      if (remindersRes.reminders) setReminders(remindersRes.reminders)
      if (settingsRes.settings) setSettings(settingsRes.settings)
    } catch (error) {
      console.error('Failed to load reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingsSave = async () => {
    if (isDemo) {
      setShowSettings(false)
      toast({ title: 'Settings saved (demo)', variant: 'success' })
      return
    }

    const result = await updateReminderSettings(workspace?.id || '', settingsForm)
    if (result.error) {
      toast({ title: result.error, variant: 'destructive' })
    } else {
      setShowSettings(false)
      toast({ title: 'Reminder settings updated', variant: 'success' })
      loadData()
    }
  }

  const handleMarkComplete = async (reminderId: string) => {
    if (isDemo) {
      setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status: 'completed' } : r))
      toast({ title: 'Reminder marked complete! (demo)', variant: 'success' })
      return
    }

    const result = await markReminderCompleted(reminderId)
    if (result.error) {
      toast({ title: result.error, variant: 'destructive' })
    } else {
      setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, status: 'completed' } : r))
      toast({ title: 'Reminder marked complete!', variant: 'success' })
    }
  }

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)

  // Get reminders for current month
  const currentMonthReminders = reminders.filter(r => {
    const date = new Date(r.scheduled_date)
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth
  })

  const prevMonth = () => {
    setCurrentMonth(prev => prev === 0 ? (setCurrentYear(y => y - 1), 11) : prev - 1)
  }
  const nextMonth = () => {
    setCurrentMonth(prev => prev === 11 ? (setCurrentYear(y => y + 1), 0) : prev + 1)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return today.getFullYear() === currentYear && 
           today.getMonth() === currentMonth && 
           today.getDate() === day
  }

  const getDayReminders = (day: number) => {
    return currentMonthReminders.filter(r => new Date(r.scheduled_date).getDate() === day)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="page-container">
          <div className="space-y-6" role="status" aria-label="Loading reminders">
            <div className="skeleton h-32 rounded-2xl animate-pulse bg-charcoal/10" />
            <div className="skeleton h-96 rounded-2xl animate-pulse bg-charcoal/10" />
          </div>
        </main>
      </div>
    )
  }

  const isOwner = workspace?.members?.find(m => m.profile_id === user?.id)?.role === 'owner'

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="page-container max-w-4xl">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-3xl font-semibold text-charcoal flex items-center gap-2">
              <CalendarDays className="h-8 w-8 text-rose" />
              Savings Calendar
            </h1>
            <p className="mt-1 text-sm text-charcoal/60">Track your monthly savings reminders</p>
          </div>
          {isOwner && (
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          )}
        </motion.div>

        {/* Upcoming Reminders */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="font-display text-xl font-semibold text-charcoal mb-4">Upcoming Reminders</h2>
          <div className="space-y-3">
            {reminders.slice(0, 4).map((reminder, index) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-2xl border transition-colors ${
                  reminder.status === 'completed' 
                    ? 'border-sage bg-sage/20' 
                    : reminder.status === 'pending' 
                      ? 'border-rose/50 bg-blush/30' 
                      : 'border-blush/50 bg-cream hover:border-rose/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display text-lg font-semibold text-charcoal">
                        {reminder.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        reminder.status === 'completed' ? 'bg-sage text-charcoal' :
                        reminder.status === 'pending' ? 'bg-rose/10 text-rose' :
                        'bg-lavender text-rose'
                      }`}>
                        {reminder.status === 'completed' ? '✓ Completed' :
                         reminder.status === 'pending' ? '⏰ Due' : '📅 Upcoming'}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal/50 mb-2">{reminder.message}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-charcoal/60">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(reminder.scheduled_date)}
                      </span>
                      <span className={`flex items-center gap-1 font-medium ${
                        reminder.days_until === 0 ? 'text-rose' : 'text-charcoal/60'
                      }`}>
                        <Clock className="h-3.5 w-3.5" />
                        {reminder.days_until === 0 ? 'Today!' : 
                         reminder.days_until === 1 ? 'Tomorrow' : 
                         `In ${reminder.days_until} days`}
                      </span>
                      {reminder.expected_amount && (
                        <span className="flex items-center gap-1 text-rose font-medium">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Expected: {formatCurrency(reminder.expected_amount)}
                        </span>
                      )}
                    </div>
                  </div>
                  {reminder.status !== 'completed' && (
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleMarkComplete(reminder.id)}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
            
            {reminders.length === 0 && (
              <Card className="border-blush/50">
                <CardContent className="p-8 text-center">
                  <Calendar className="mx-auto mb-3 h-12 w-12 text-charcoal/20" />
                  <h3 className="font-display text-lg font-medium text-charcoal">No upcoming reminders</h3>
                  <p className="mt-1 text-sm text-charcoal/50">Configure your savings reminders in settings</p>
                  {isOwner && (
                    <Button className="mt-4" variant="outline" onClick={() => setShowSettings(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Configure Reminders
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </motion.section>

        {/* Calendar View */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-blush/50 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <h3 className="font-display text-xl font-semibold text-charcoal">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  setCurrentMonth(new Date().getMonth())
                  setCurrentYear(new Date().getFullYear())
                }}>
                  Today
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-4">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-charcoal/50 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before month start */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {/* Days of month */}
                {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map(day => {
                  const dayReminders = getDayReminders(day)
                  const today = isToday(day)
                  
                  return (
                    <motion.button
                      key={day}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: day * 0.01 }}
                      className={`relative aspect-square rounded-xl transition-all ${
                        today 
                          ? 'bg-gradient-to-br from-rose to-lavender text-cream font-semibold shadow-soft' 
                          : 'bg-cream hover:bg-blush/50 text-charcoal'
                      } ${dayReminders.length > 0 ? 'ring-2 ring-rose' : ''}`}
                    >
                      <span className="absolute top-1 left-1 text-sm">{day}</span>
                      
                      {dayReminders.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {dayReminders.map(r => (
                            <span
                              key={r.id}
                              className={`h-1.5 w-1.5 rounded-full ${
                                r.status === 'completed' ? 'bg-sage' :
                                r.status === 'pending' ? 'bg-rose' : 'bg-lavender'
                              }`}
                              title={r.label}
                            />
                          ))}
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
              
              {/* Legend */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-charcoal/60">
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-rose" />
                  <span>Reminder Due</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-sage" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-lavender" />
                  <span>Upcoming</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-xl bg-gradient-to-br from-rose to-lavender" />
                  <span>Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Settings Dialog */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="fixed inset-0 z-50" style={{ display: showSettings ? 'block' : 'none' }}>
            <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-cream p-6 shadow-elevated">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-semibold text-charcoal">Reminder Settings</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </Button>
              </div>
              
              <form onSubmit={e => { e.preventDefault(); handleSettingsSave() }} className="space-y-6">
                {/* Reminder 1 */}
                <div className="border-t border-blush/50 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-semibold text-charcoal">First Week Savings Day</h3>
                    <Switch
                      checked={settingsForm.reminder_1_enabled}
                      onCheckedChange={checked => setSettingsForm(prev => ({ ...prev, reminder_1_enabled: checked }))}
                    />
                  </div>
                  
                  <div className="space-y-3" style={{ opacity: settingsForm.reminder_1_enabled ? 1 : 0.5 }}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Day of Month (1-7)</label>
                        <select
                          value={settingsForm.reminder_1_day}
                          onChange={e => setSettingsForm(prev => ({ ...prev, reminder_1_day: parseInt(e.target.value) }))}
                          className="w-full rounded-xl border border-charcoal/20 bg-cream px-4 py-2.5 text-sm text-charcoal focus:border-rose focus:ring-2 focus:ring-rose/20"
                        >
                          {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>{d}{d===1?'st':d===2?'nd':d===3?'rd':'th'}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">Time</label>
                        <input
                          type="time"
                          value={settingsForm.reminder_1_time}
                          onChange={e => setSettingsForm(prev => ({ ...prev, reminder_1_time: e.target.value }))}
                          className="w-full rounded-xl border border-charcoal/20 bg-cream px-4 py-2.5 text-sm text-charcoal focus:border-rose focus:ring-2 focus:ring-rose/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1">Label</label>
                      <input
                        type="text"
                        value={settingsForm.reminder_1_label}
                        onChange={e => setSettingsForm(prev => ({ ...prev, reminder_1_label: e.target.value }))}
                        className="w-full rounded-xl border border-charcoal/20 bg-cream px-4 py-2.5 text-sm text-charcoal focus:border-rose focus:ring-2 focus:ring-rose/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1">Message</label>
                      <textarea
                        value={settingsForm.reminder_1_message}
                        onChange={e => setSettingsForm(prev => ({ ...prev, reminder_1_message: e.target.value }))}
                        rows={2}
                        className="w-full rounded-xl border border-charcoal/20 bg-cream px-4 py-2.5 text-sm text-charcoal focus:border-rose focus:ring-2 focus:ring-rose/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Reminder 2 */}
                <div className="border-t border-blush/50 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-semibold text-charcoal">Month-End Savings Day</h3>
                    <Switch
                      checked={settingsForm.reminder_2_enabled}
                      onCheckedChange={checked => setSettingsForm(prev => ({ ...prev, reminder_2_enabled: checked }))}
                    />
                  </div>
                  
                  <div className="space-y-3" style={{ opacity: settingsForm.reminder_2_enabled ? 1 : 0.5 }}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">
                          <input
                            type="checkbox"
                            checked={settingsForm.reminder_2_last_day}
                            onChange={e => setSettingsForm(prev => ({ ...prev, reminder_2_last_day: e.target.checked }))}
                            className="mr-2 h-4 w-4 rounded border-charcoal/20 text-rose focus:ring-rose"
                          />
                          Last day of month
                        </label>
                      </div>
                      <div style={{ display: settingsForm.reminder_2_last_day ? 'none' : 'block' }}>
                        <label className="block text-sm font-medium text-charcoal mb-1">Day of Month (28-31)</label>
                        <select
                          value={settingsForm.reminder_2_day}
                          onChange={e => setSettingsForm(prev => ({ ...prev, reminder_2_day: parseInt(e.target.value) }))}
                          className="w-full rounded-xl border border-charcoal/20 bg-cream px-4 py-2.5 text-sm text-charcoal focus:border-rose focus:ring-2 focus:ring-rose/20"
                        >
                          {[28,29,30,31].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1">Time</label>
                      <input
                        type="time"
                        value={settingsForm.reminder_2_time}
                        onChange={e => setSettingsForm(prev => ({ ...prev, reminder_2_time: e.target.value }))}
                        className="w-full rounded-xl border border-charcoal/20 bg-cream px-4 py-2.5 text-sm text-charcoal focus:border-rose focus:ring-2 focus:ring-rose/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1">Label</label>
                      <input
                        type="text"
                        value={settingsForm.reminder_2_label}
                        onChange={e => setSettingsForm(prev => ({ ...prev, reminder_2_label: e.target.value }))}
                        className="w-full rounded-xl border border-charcoal/20 bg-cream px-4 py-2.5 text-sm text-charcoal focus:border-rose focus:ring-2 focus:ring-rose/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1">Message</label>
                      <textarea
                        value={settingsForm.reminder_2_message}
                        onChange={e => setSettingsForm(prev => ({ ...prev, reminder_2_message: e.target.value }))}
                        rows={2}
                        className="w-full rounded-xl border border-charcoal/20 bg-cream px-4 py-2.5 text-sm text-charcoal focus:border-rose focus:ring-2 focus:ring-rose/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-blush/50">
                  <Button type="button" variant="outline" onClick={() => setShowSettings(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Save Settings
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}