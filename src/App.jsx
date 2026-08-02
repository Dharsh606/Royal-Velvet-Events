import { lazy, Suspense, useEffect, useState } from 'react'
import PublicSite from './components/PublicSite'
import PrivateInquiryPage from './components/PrivateInquiryPage'
import {
  LuxuryErrorBoundary,
  LuxuryErrorPage,
  NetworkRecovery,
  SecurePortalLoader,
} from './components/LuxurySystemStates'
import { applyAdminSeo, SECTION_PATHS } from './lib/seo'
import './styles.css'

let adminPanelModulePromise
const loadAdminPanel = () => {
  if (!adminPanelModulePromise) adminPanelModulePromise = import('./components/AdminPanel')
  return adminPanelModulePromise
}
const AdminPanel = lazy(loadAdminPanel)

function AdminPortalEntry() {
  const [portalReady, setPortalReady] = useState(false)
  const [curtainVisible, setCurtainVisible] = useState(true)

  useEffect(() => {
    let mounted = true
    let entryTimer
    let curtainTimer
    const minimumEntryTime = new Promise((resolve) => {
      entryTimer = window.setTimeout(resolve, 4000)
    })

    Promise.all([minimumEntryTime, loadAdminPanel().catch(() => null)]).then(() => {
      if (!mounted) return
      setPortalReady(true)
      curtainTimer = window.setTimeout(() => {
        if (mounted) setCurtainVisible(false)
      }, 1100)
    })

    return () => {
      mounted = false
      window.clearTimeout(entryTimer)
      window.clearTimeout(curtainTimer)
    }
  }, [])

  return (
    <div className={`admin-portal-stage${portalReady ? ' is-ready' : ''}`}>
      {portalReady && (
        <div className="admin-portal-content">
          <Suspense fallback={null}>
            <AdminPanel />
          </Suspense>
        </div>
      )}
      {curtainVisible && (
        <div className={`admin-portal-curtain${portalReady ? ' is-exiting' : ''}`}>
          <SecurePortalLoader />
        </div>
      )}
    </div>
  )
}

export default function App() {
  const isAdmin = window.location.pathname.startsWith('/admin')
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/'
  const isPrivateInquiry = normalizedPath === '/private-inquiry' || normalizedPath === '/private-inquiry.html'
  const isPublishedProjectRoute = /^\/projects\/[a-z0-9-]+$/i.test(normalizedPath)
  const isKnownPublicRoute = normalizedPath === '/index.html'
    || Object.values(SECTION_PATHS).includes(normalizedPath)
    || isPublishedProjectRoute
  const maintenanceEnabled = import.meta.env.VITE_MAINTENANCE_MODE === 'true'

  useEffect(() => {
    if (isAdmin) applyAdminSeo()
  }, [isAdmin])

  return (
    <LuxuryErrorBoundary>
      <NetworkRecovery />
      {maintenanceEnabled && !isAdmin ? (
        <LuxuryErrorPage variant="maintenance" />
      ) : isAdmin ? (
        <AdminPortalEntry />
      ) : isPrivateInquiry ? (
        <PrivateInquiryPage />
      ) : isKnownPublicRoute ? (
        <PublicSite />
      ) : (
        <LuxuryErrorPage variant="notFound" />
      )}
    </LuxuryErrorBoundary>
  )
}
