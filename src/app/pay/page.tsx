'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { QrCode, Copy, Download, CreditCard, Smartphone, CheckCircle, AlertCircle, Upload, Edit, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { formatCurrency } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { getQRCodeUrl, uploadQRCode, updateWorkspaceSettings } from '@/lib/actions/auth'
import { getUserWorkspace } from '@/lib/actions/auth'
import { toast } from '@/hooks/use-toast'
import { useUserStore } from '@/stores/user-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { demoWorkspace } from '@/lib/demo-data'

export default function PayPage() {
  const { user } = useUserStore()
  const { workspace, setWorkspace, updateWorkspace } = useWorkspaceStore()
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [upiId, setUpiId] = useState('')
  const [showUpiId, setShowUpiId] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === 'true') {
      setIsDemo(true)
      setWorkspace(demoWorkspace)
      setUpiId(demoWorkspace.upi_id || 'ourfund@upi')
      setQrCodeUrl('https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=upi%3A%2F%2Fpay%3Fpa%3Fourfund%40upi%26pn%3DOur%20Little%20Fund%26cu%3DINR')
      setLoading(false)
    } else {
      loadData()
    }
  }, [])

  const loadData = async () => {
    try {
      const workspaceRes = await getUserWorkspace()
      const qrRes = await getQRCodeUrl(workspaceRes.workspace?.id || '')

      if (workspaceRes.workspace) {
        setWorkspace(workspaceRes.workspace)
        setUpiId(workspaceRes.workspace.upi_id || '')
      }
      if (qrRes.url) {
        setQrCodeUrl(qrRes.url)
      }
    } catch (error) {
      console.error('Failed to load payment info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Please select an image file', variant: 'destructive' })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File size must be less than 5MB', variant: 'destructive' })
        return
      }
      setSelectedFile(file)
      setFilePreview(URL.createObjectURL(file))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !workspace?.id) return
    
    setUploading(true)
    const result = await uploadQRCode(workspace.id, selectedFile)
    setUploading(false)
    
    if (result.error) {
      toast({ title: result.error, variant: 'destructive' })
    } else {
      setQrCodeUrl(result.url || null)
      setShowUploadDialog(false)
      setSelectedFile(null)
      setFilePreview(null)
      toast({ title: 'QR code uploaded successfully!', variant: 'success' })
    }
  }

  const handleUpiIdChange = async (newUpiId: string) => {
    setUpiId(newUpiId)
    if (!isDemo && workspace?.id) {
      const result = await updateWorkspaceSettings(workspace.id, { upi_id: newUpiId })
      if (result.error) {
        toast({ title: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'UPI ID updated', variant: 'success' })
      }
    }
  }

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId)
    toast({ title: 'UPI ID copied to clipboard!', variant: 'success' })
  }

  const downloadQR = () => {
    if (!qrCodeUrl) return
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = 'our-little-fund-qr.png'
    link.click()
  }

  const handleContributionMade = () => {
    toast({ 
      title: 'Great! 🎉', 
      description: 'Don\'t forget to record your contribution in the app.',
      variant: 'success' 
    })
  }

  const isOwner = workspace?.members?.find(m => m.profile_id === user?.id)?.role === 'owner'

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="page-container max-w-2xl">
          <div className="space-y-6" role="status" aria-label="Loading payment page">
            <div className="skeleton h-96 rounded-2xl animate-pulse bg-charcoal/10" />
            <div className="skeleton h-64 rounded-2xl animate-pulse bg-charcoal/10" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="page-container max-w-2xl">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose to-lavender">
            <QrCode className="h-8 w-8 text-cream" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">Our Savings Account</h1>
          <p className="mt-2 text-lg text-charcoal/60">Scan to contribute to our shared future</p>
        </motion.div>

        {/* QR Code Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-blush/50 overflow-hidden">
            <CardContent className="p-8 text-center">
              {qrCodeUrl ? (
                <div className="space-y-6">
                  <div className="relative inline-block p-4 bg-cream rounded-2xl shadow-soft">
                    <img 
                      src={qrCodeUrl} 
                      alt="UPI QR Code for Our Little Fund"
                      className="h-64 w-64 object-contain"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <p className="font-display text-lg font-semibold text-charcoal">
                      {workspace?.name || 'Our Little Fund'}
                    </p>
                    <p className="text-sm text-charcoal/50">Scan with any UPI app to pay</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button variant="outline" onClick={downloadQR}>
                      <Download className="mr-2 h-4 w-4" />
                      Download QR
                    </Button>
                    <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      {qrCodeUrl && !isDemo ? 'Replace QR' : 'Upload QR'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex h-64 w-64 items-center justify-center rounded-xl bg-blush/50 mx-auto">
                    <QrCode className="h-16 w-16 text-charcoal/30" />
                  </div>
                  <p className="text-charcoal/50">No QR code uploaded yet</p>
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload QR Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {/* UPI ID Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border-blush/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-rose" />
                UPI ID
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-blush/50 rounded-xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cream">
                    <CreditCard className="h-6 w-6 text-rose" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-charcoal/50">UPI ID</p>
                    <div className="flex items-center gap-2">
                      <span className={showUpiId ? 'font-mono font-medium text-charcoal' : 'font-mono font-medium text-charcoal letter-spacing-wider'}>
                        {showUpiId ? upiId : '••••••••••'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowUpiId(!showUpiId)}
                      >
                        {showUpiId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={copyUpiId}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {isOwner && (
                  <div className="pt-4 border-t border-blush/50">
                    <label className="block text-sm font-medium text-charcoal mb-2">Update UPI ID</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="e.g., ourfund@upi"
                        value={upiId}
                        onChange={e => handleUpiIdChange(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            </Card>
        </motion.section>

        {/* Instructions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="border-blush/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-rose" />
                How to Pay
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose/10 text-rose">
                    <span className="font-semibold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-charcoal">Open any UPI app</p>
                    <p className="text-sm text-charcoal/50">GPay, PhonePe, Paytm, BHIM, or your bank app</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose/10 text-rose">
                    <span className="font-semibold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-charcoal">Scan the QR code</p>
                    <p className="text-sm text-charcoal/50">Use the "Scan QR" or "Scan & Pay" feature</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose/10 text-rose">
                    <span className="font-semibold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-charcoal">Enter amount & pay</p>
                    <p className="text-sm text-charcoal/50">The UPI ID and account name will auto-fill</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose/10 text-rose">
                    <span className="font-semibold">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-charcoal">Record in app</p>
                    <p className="text-sm text-charcoal/50">Come back and tap "I've made my contribution"</p>
                  </div>
                </div>
              </div>
            </CardContent>
            </Card>
        </motion.section>

        {/* Contribution Button */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-blush/50">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-charcoal/50 mb-4">Made a payment? Record it in our savings tracker</p>
              <Button 
                size="xl" 
                variant="secondary" 
                className="w-full sm:w-auto"
                onClick={handleContributionMade}
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                I've Made My Contribution
              </Button>
              <p className="mt-3 text-xs text-charcoal/40">
                This will take you to the contribution form with today's date pre-filled
              </p>
            </CardContent>
            </Card>
        </motion.section>

        {/* Upload QR Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload QR Code</DialogTitle>
              <DialogDescription>
                Upload a screenshot of your UPI QR code. This will be visible to both partners.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-blush/50 rounded-xl p-6 text-center hover:border-rose transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="qr-upload"
                />
                <label htmlFor="qr-upload" className="cursor-pointer">
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="mx-auto max-h-48 rounded-lg" />
                  ) : (
                    <>
                      <Upload className="mx-auto mb-2 h-10 w-10 text-charcoal/30" />
                      <p className="text-charcoal/50">Click or drag to upload QR code</p>
                      <p className="text-xs text-charcoal/40">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </label>
              </div>
              {filePreview && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setSelectedFile(null); setFilePreview(null); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} loading={uploading}>
                    {uploading ? 'Uploading...' : 'Upload QR Code'}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}