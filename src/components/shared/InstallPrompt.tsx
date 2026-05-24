'use client'

import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'sourceasia-install-dismissed'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Don't show if user already dismissed
    if (typeof window === 'undefined') return
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) return

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) return

    function handleBIP(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Slight delay so the page loads first
      setTimeout(() => setShow(true), 2000)
    }

    function handleInstalled() {
      setInstalled(true)
      setShow(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBIP)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBIP)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
    }
    setDeferredPrompt(null)
    setShow(false)
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    setShow(false)
    setDeferredPrompt(null)
    localStorage.setItem(DISMISS_KEY, 'true')
  }, [])

  if (!show || installed) return null

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 animate-slide-up p-4 sm:p-6"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="mx-auto max-w-lg rounded-2xl p-4 sm:p-5 flex items-center gap-4"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.4)',
          pointerEvents: 'auto',
        }}
      >
        {/* Icon */}
        <div
          className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(232,82,42,0.12)' }}
        >
          <svg
            className="w-6 h-6"
            style={{ color: 'var(--accent)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Install SourceAsia
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Add to home screen for offline access
          </p>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={handleDismiss}
            className="text-xs py-1.5 px-3 rounded-full transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="btn-primary text-xs py-2 px-5"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}
