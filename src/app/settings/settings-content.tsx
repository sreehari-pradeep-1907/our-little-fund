'use client'
export const dynamic = "force-dynamic"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Wallet, Bell, Moon, Shield, Heart, LogOut, Camera, Save, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { updateProfile, uploadAvatar, updateWorkspaceSettings, getUserWorkspace, joinWorkspace } from '@/lib/actions/auth'
import { getWorkspaceMembers } from '@/lib/actions/auth'
import { toast } from '@/hooks/use-toast'
import { useUserStore } from '@/stores/user-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { demoWorkspace } from '@/lib/demo-data'

type Tab = 'profile' | 'workspace' | 'notifications' | 'appearance' | 'account'

export default function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, updateProfile: updateUserProfile, signOut } = useUserStore()
  const { workspace, setWorkspace, updateWorkspace: updateWorkspaceStore, clearWorkspace } = useWorkspaceStore()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    display_name: '',
  })
  
  // Workspace form
  const [workspaceForm, setWorkspaceForm] = useState({
    name: 'Our Little Fund',
    tagline: 'Little by little, together.',
    target_amount: 100000,
    currency: 'INR',
  })
  
  // Notification form
  const [notificationForm, setNotificationForm] = useState({
    enabled: true,
    email: false,
  })
  
  // Appearance form
  const [appearanceForm, setAppearanceForm] = useState({
    darkMode: false,
  })
  
  // Avatar upload
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab
    if (tab && ['profile', 'workspace', 'notifications', 'appearance', 'account'].includes(tab)) {
      setActiveTab(tab)
    }
    
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === 'true') {
      setIsDemo(true)
      setWorkspace(demoWorkspace)
      setProfileForm({ full_name: 'Me', display_name: 'Me' })
      setWorkspaceForm({ name: demoWorkspace.name, tagline: demoWorkspace.tagline || '', target_amount: demoWorkspace.target_amount / 100, currency: demoWorkspace.currency })
      setNotificationForm({ enabled: true, email: false })
      setLoading(false)
    } else {
      loadData()
    }
  }, [searchParams])

  const loadData = async () => {
    try {
      const workspaceRes = await getUserWorkspace()
      const membersRes = await getWorkspaceMembers(workspaceRes.workspace?.id || '')

      if (workspaceRes.workspace) {
        setWorkspace(workspaceRes.workspace)
        setWorkspaceForm({
          name: workspaceRes.workspace.name,
          tagline: workspaceRes.workspace.tagline || '',
          target_amount: workspaceRes.workspace.target_amount / 100,
          currency: workspaceRes.workspace.currency,
        })
      }
      if (membersRes.members) {
        setMembers(membersRes.members)
      }
      if (user) {
        setProfileForm({
          full_name: user.full_name || '',
          display_name: user.display_name || '',
        })
      }
      // Load notification preferences
      const currentMember = membersRes.members?.find(m => m.profile_id === user?.id)
      if (currentMember) {
        setNotificationForm({
          enabled: currentMember.notification_enabled,
          email: currentMember.email_notifications,
        })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSave = async () => {
    setSaving(true)
    if (isDemo) {
      setTimeout(() => {
        setSaving(false)
        updateUserProfile(profileForm)
        toast({ title: 'Profile saved (demo)', variant: 'success' })
      }, 500)
      return
    }

    const result = await updateProfile(profileForm)
    setSaving(false)
    if (result.error) {
      toast({ title: result.error, variant: 'destructive' })
    } else {
      updateUserProfile(profileForm)
      toast({ title: 'Profile updated', variant: 'success' })
    }
  }

  const handleWorkspaceSave = async () => {
    setSaving(true)
    if (isDemo) {
      setTimeout(() => {
        setSaving(false)
        updateWorkspaceStore({ ...workspaceForm, target_amount: workspaceForm.target_amount * 100 })
        toast({ title: 'Workspace saved (demo)', variant: 'success' })
      }, 500)
      return
    }

    const result = await updateWorkspaceSettings(workspace?.id || '', {
      ...workspaceForm,
      target_amount: workspaceForm.target_amount * 100,
    })
    setSaving(false)
    if (result.error) {
      toast({ title: result.error, variant: 'destructive' })
    } else {
      updateWorkspaceStore({ ...workspaceForm, target_amount: workspaceForm.target_amount * 100 })
      toast({ title: 'Workspace updated', variant: 'success' })
    }
  }

  const handleNotificationSave = async () => {
    if (isDemo) {
      toast({ title: 'Notifications updated (demo)', variant: 'success' })
      return
    }

    // This would call an action to update notification preferences
    toast({ title: 'Notification preferences updated', variant: 'success' })
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return
    setSaving(true)

    if (isDemo) {
      setTimeout(() => {
        setSaving(false)
        setAvatarPreview(null)
        setAvatarFile(null)
        toast({ title: 'Avatar updated (demo)', variant: 'success' })
      }, 500)
      return
    }

    const result = await uploadAvatar(avatarFile)
    setSaving(false)
    if (result.error) {
      toast({ title: result.error, variant: 'destructive' })
    } else {
      updateUserProfile({ avatar_url: result.url })
      setAvatarPreview(null)
      setAvatarFile(null)
      toast({ title: 'Avatar updated', variant: 'success' })
    }
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Please select an image', variant: 'destructive' })
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: 'File must be less than 2MB', variant: 'destructive' })
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleJoinWorkspace = async (inviteCode: string) => {
    if (!inviteCode.trim()) return
    setSaving(true)
    const result = await joinWorkspace(inviteCode.trim().toUpperCase())
    setSaving(false)
    if (result.error) {
      toast({ title: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Joined workspace!', variant: 'success' })
      router.refresh()
    }
  }

  const handleSignOut = () => {
    signOut()
    clearWorkspace()
    router.push('/login')
  }

  const isOwner = workspace?.members?.find(m => m.profile_id === user?.id)?.role === 'owner'
  const partner = workspace?.members?.find(m => m.profile_id !== user?.id)?.profile

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="page-container max-w-3xl">
          <div className="space-y-6" role="status" aria-label="Loading settings">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-32 rounded-2xl animate-pulse bg-charcoal/10" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
    { id: 'workspace', label: 'Workspace', icon: <Wallet className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Moon className="h-4 w-4" /> },
    { id: 'account', label: 'Account', icon: <Shield className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="page-container max-w-3xl">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-semibold text-charcoal">Settings</h1>
          <p className="mt-1 text-sm text-charcoal/60">Manage your account and workspace preferences</p>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as Tab)} className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            {tabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center justify-center gap-1.5 py-2">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card className="border-blush/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-rose" />
                    Profile
                  </CardTitle>
                  <CardDescription>Manage your personal information</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatarPreview || user?.avatar_url || undefined} alt={user?.display_name || ''} />
                      <AvatarFallback className="text-rose font-medium text-2xl">
                        {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-display text-lg font-semibold text-charcoal">
                        {user?.display_name || 'User'}
                      </p>
                      <p className="text-sm text-charcoal/50">{user?.email}</p>
                      <Button variant="outline" size="sm" onClick={() => document.getElementById('avatar-input')?.click()}>
                        <Camera className="mr-2 h-4 w-4" />
                        Change Avatar
                      </Button>
                      <input
                        id="avatar-input"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarSelect}
                        className="hidden"
                      />
                      {avatarPreview && (
                        <Button variant="secondary" size="sm" onClick={handleAvatarUpload} loading={saving} className="ml-2">
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-blush/50 pt-6 space-y-4">
                    <Input
                      label="Full Name"
                      placeholder="Your full name"
                      value={profileForm.full_name}
                      onChange={e => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                    <Input
                      label="Display Name"
                      placeholder="How you appear in the app"
                      value={profileForm.display_name}
                      onChange={e => setProfileForm(prev => ({ ...prev, display_name: e.target.value }))}
                    />
                    <Button onClick={handleProfileSave} loading={saving}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Workspace Tab */}
            {activeTab === 'workspace' && (
              <>
                <Card className="border-blush/50 mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-rose" />
                      Workspace Settings
                    </CardTitle>
                    <CardDescription>Configure your shared savings space</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-6">
                    <div className="space-y-4">
                      <Input
                        label="Workspace Name"
                        value={workspaceForm.name}
                        onChange={e => setWorkspaceForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <Textarea
                        label="Tagline"
                        value={workspaceForm.tagline}
                        onChange={e => setWorkspaceForm(prev => ({ ...prev, tagline: e.target.value }))}
                        rows={2}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          label="Savings Target (₹)"
                          type="number"
                          value={workspaceForm.target_amount}
                          onChange={e => setWorkspaceForm(prev => ({ ...prev, target_amount: parseInt(e.target.value) || 0 }))}
                          min="1000"
                        />
                        <Select value={workspaceForm.currency} onValueChange={v => setWorkspaceForm(prev => ({ ...prev, currency: v }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {isOwner && (
                      <div className="border-t border-blush/50 pt-6">
                        <h4 className="font-medium text-charcoal mb-4">Invite Partner</h4>
                        <div className="space-y-3">
                          <p className="text-sm text-charcoal/60">
                            Share this invite code with your partner to join your workspace:
                          </p>
                          <div className="flex items-center gap-3 p-4 bg-blush/50 rounded-xl">
                            <code className="font-mono text-lg font-semibold text-rose flex-1 text-center tracking-widest">
                              {workspace?.invite_code || 'ABCD1234'}
                            </code>
                            <Button variant="outline" size="sm">
                              Copy
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button onClick={handleWorkspaceSave} loading={saving} disabled={!isOwner}>
                      <Save className="mr-2 h-4 w-4" />
                      {isOwner ? 'Save Workspace' : 'Only owners can save'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Members */}
                <Card className="border-blush/50 mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-rose" />
                      Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {members.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-blush/50">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.profile.avatar_url} alt={member.profile.display_name || ''} />
                              <AvatarFallback className="text-rose font-medium">
                                {member.profile.display_name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-charcoal">{member.profile.display_name || member.profile.email}</p>
                              <p className="text-sm text-charcoal/50 flex items-center gap-1">
                                {member.role === 'owner' && <span className="px-2 py-0.5 rounded text-xs bg-rose/10 text-rose">Owner</span>}
                                {member.profile_id === user?.id && <span className="px-2 py-0.5 rounded text-xs bg-lavender text-rose">You</span>}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                {isOwner && (
                  <Card className="border-rose/50 bg-blush/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-rose">
                        <Shield className="h-5 w-5" />
                        Danger Zone
                      </CardTitle>
                      <CardDescription>Irreversible actions</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button variant="destructive" onClick={() => {
                        if (confirm('Are you sure you want to leave this workspace? This cannot be undone.')) {
                          // Leave workspace logic
                        }
                      }}>
                        Leave Workspace
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card className="border-blush/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-rose" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Configure how you receive savings reminders</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-charcoal">Push Notifications</p>
                        <p className="text-sm text-charcoal/50">Receive reminders on your devices</p>
                      </div>
                      <Switch
                        checked={notificationForm.enabled}
                        onCheckedChange={checked => setNotificationForm(prev => ({ ...prev, enabled: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-charcoal">Email Notifications</p>
                        <p className="text-sm text-charcoal/50">Also receive reminders via email</p>
                      </div>
                      <Switch
                        checked={notificationForm.email}
                        onCheckedChange={checked => setNotificationForm(prev => ({ ...prev, email: checked }))}
                      />
                    </div>
                  </div>

                  <div className="border-t border-blush/50 pt-6">
                    <Button variant="outline" onClick={() => toast({ title: 'Test notification sent! (demo)', variant: 'success' })}>
                      <Bell className="mr-2 h-4 w-4" />
                      Send Test Notification
                    </Button>
                  </div>

                  <Button onClick={handleNotificationSave} loading={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <Card className="border-blush/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5 text-rose" />
                    Appearance
                  </CardTitle>
                  <CardDescription>Customize how the app looks</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-charcoal">Dark Mode</p>
                        <p className="text-sm text-charcoal/50">Use dark theme (system preference by default)</p>
                      </div>
                      <Switch
                        checked={appearanceForm.darkMode}
                        onCheckedChange={checked => {
                          setAppearanceForm(prev => ({ ...prev, darkMode: checked }))
                          document.documentElement.classList.toggle('dark', checked)
                        }}
                      />
                    </div>
                  </div>

                  <div className="border-t border-blush/50 pt-6">
                    <h4 className="font-medium text-charcoal mb-4">Theme Preview</h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {['Light', 'Dark', 'System'].map((theme: string) => (
                        <Button
                          key={theme}
                          variant={appearanceForm.darkMode && theme === 'Dark' ? 'default' : 'outline'}
                          className="h-20 flex-col gap-2"
                          onClick={() => {
                            const isDark = theme === 'Dark' || (theme === 'System' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                            setAppearanceForm(prev => ({ ...prev, darkMode: isDark }))
                            document.documentElement.classList.toggle('dark', isDark)
                          }}
                        >
                          <div className={`w-12 h-12 rounded-xl ${theme === 'Dark' ? 'bg-charcoal' : 'bg-cream border border-charcoal/10'}`} />
                          <span className="text-sm">{theme}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
                </Card>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <>
                <Card className="border-blush/50 mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-rose" />
                      Account Security
                    </CardTitle>
                    <CardDescription>Manage your account security settings</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-blush/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose/10 text-rose">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-charcoal">Magic Link Authentication</p>
                          <p className="text-sm text-charcoal/50">Sign in with email links, no passwords</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-sage text-charcoal">Active</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blush/50 mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-rose" />
                      Data & Privacy
                    </CardTitle>
                    <CardDescription>Your data, your control</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="mr-2 h-4 w-4" />
                        Export My Data
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Shield className="mr-2 h-4 w-4" />
                        Privacy Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-rose/50 bg-blush/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-rose">
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </CardTitle>
                    <CardDescription>Sign out of your account</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button variant="destructive" onClick={handleSignOut} className="w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

import { Users, Download } from 'lucide-react'