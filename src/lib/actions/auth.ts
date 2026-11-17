'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { generateInviteCode } from '@/lib/utils'

export async function signInWithEmail(email: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function updateProfile(data: { full_name?: string; display_name?: string; avatar_url?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', user.id)
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export async function uploadAvatar(file: File) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/avatar.${fileExt}`
  
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true })
  
  if (uploadError) {
    return { error: uploadError.message }
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)
  
  await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)
  
  return { url: publicUrl }
}

export async function createWorkspace(name: string, tagline: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const inviteCode = generateInviteCode()
  
  const { data: workspace, error } = await supabase
    .from('savings_workspaces')
    .insert({ name, tagline, invite_code: inviteCode })
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, profile_id: user.id, role: 'owner' })
  
  if (memberError) {
    return { error: memberError.message }
  }
  
  return { workspace }
}

export async function joinWorkspace(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { data: workspace, error: workspaceError } = await supabase
    .from('savings_workspaces')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()
  
  if (workspaceError || !workspace) {
    return { error: 'Invalid invite code' }
  }
  
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, profile_id: user.id, role: 'member' })
  
  if (memberError) {
    return { error: memberError.message }
  }
  
  return { workspace }
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
  
  return { workspace: member?.workspace, member }
}

export async function getWorkspaceMembers(workspaceId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      *,
      profile: profiles(*)
    `)
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true })
  
  if (error) {
    return { members: [], error: error.message }
  }
  
  return { members: data || [] }
}

export async function updateWorkspaceSettings(workspaceId: string, data: Partial<SavingsWorkspace>) {
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
    return { error: 'Only owners can update workspace settings' }
  }
  
  const { error } = await supabase
    .from('savings_workspaces')
    .update(data)
    .eq('id', workspaceId)
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export async function uploadQRCode(workspaceId: string, file: File) {
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
    return { error: 'Only owners can upload QR codes' }
  }
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${workspaceId}/qr-code.${fileExt}`
  
  const { error: uploadError } = await supabase.storage
    .from('qr-codes')
    .upload(fileName, file, { upsert: true })
  
  if (uploadError) {
    return { error: uploadError.message }
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('qr-codes')
    .getPublicUrl(fileName)
  
  // Get current workspace upi_id
  const { data: workspaceData } = await supabase
    .from('savings_workspaces')
    .select('upi_id')
    .eq('id', workspaceId)
    .single()
  
  const { error: updateError } = await supabase
    .from('savings_workspaces')
    .update({ qr_code_path: fileName, upi_id: workspaceData?.upi_id })
    .eq('id', workspaceId)
  
  if (updateError) {
    return { error: updateError.message }
  }
  
  return { url: publicUrl, path: fileName }
}

export async function getQRCodeUrl(workspaceId: string) {
  const supabase = await createClient()
  
  const { data: workspace } = await supabase
    .from('savings_workspaces')
    .select('qr_code_path')
    .eq('id', workspaceId)
    .single()
  
  if (!workspace?.qr_code_path) {
    return { url: null }
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('qr-codes')
    .getPublicUrl(workspace.qr_code_path)
  
  return { url: publicUrl }
}

import type { SavingsWorkspace } from '@/types/database'