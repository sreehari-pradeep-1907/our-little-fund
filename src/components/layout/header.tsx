'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, Wallet, Target, BarChart3, CreditCard, Calendar, Settings, LogOut, Menu, X, User, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUserStore } from '@/stores/user-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { formatCurrency } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Wallet },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Payments', href: '/pay', icon: CreditCard },
  { name: 'Reminders', href: '/reminders', icon: Calendar },
  { name: 'Contributions', href: '/contributions', icon: Heart },
]

export function Header() {
  const pathname = usePathname()
  const { user } = useUserStore()
  const { workspace } = useWorkspaceStore()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-40 w-full border-b border-blush/50 bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
                className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose to-lavender"
              >
                <Heart className="h-5 w-5 text-cream" />
              </motion.div>
              <span className="font-display text-xl font-semibold text-charcoal hidden sm:block">
                Our Little Fund
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:gap-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'relative flex h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-blush text-charcoal shadow-soft'
                          : 'text-charcoal/60 hover:bg-blush/50 hover:text-charcoal'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span>{item.name}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="center">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Settings & Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar_url || undefined} alt={user?.display_name || 'User'} />
                        <AvatarFallback className="text-rose font-medium">
                          {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end">
                    {user?.display_name || 'Profile'}
                  </TooltipContent>
                </Tooltip>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-display">
                  {user?.display_name || 'User'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex w-full items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings?tab=profile" className="flex w-full items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {workspace && workspace.members?.some(m => m.profile_id === user?.id && m.role === 'owner') && (
                  <DropdownMenuItem asChild>
                    <Link href="/settings?tab=workspace" className="flex w-full items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Workspace Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => useUserStore.getState().signOut()}
                  className="text-rose focus:text-rose"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-xl text-charcoal/60 hover:bg-blush/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-blush/50 py-4 px-4"
          >
            <nav className="flex flex-col gap-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-blush text-charcoal'
                        : 'text-charcoal/60 hover:bg-blush/50 hover:text-charcoal'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </motion.div>
        )}
      </header>
    </TooltipProvider>
  )
}

import * as React from 'react'