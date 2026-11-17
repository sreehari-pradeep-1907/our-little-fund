'use client'

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant }) {
        return (
          <Toast key={id} variant={variant}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {variant === 'destructive' && <AlertCircle className="h-5 w-5 text-rose" />}
                {variant === 'success' && <CheckCircle className="h-5 w-5 text-sage" />}
                {variant === 'default' && <Info className="h-5 w-5 text-rose" />}
              </div>
              <div className="flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
              {action}
              <ToastClose />
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}