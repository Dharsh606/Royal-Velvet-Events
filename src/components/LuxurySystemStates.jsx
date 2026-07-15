import { Component, useEffect, useState } from 'react'

const stateCopy = {
  notFound: {
    eyebrow: 'Private Route',
    code: '404',
    title: 'This doorway leads elsewhere.',
    message: 'The page may have moved, retired, or never belonged to this private collection. Your experience can continue without interruption.',
  },
  server: {
    eyebrow: 'Service Interlude',
    title: 'The salon is temporarily unavailable.',
    message: 'A private service has paused unexpectedly. No inquiry or project detail has been lost; our concierge system is preparing a safe return.',
  },
  maintenance: {
    eyebrow: 'Private Maintenance',
    title: 'We are refining the experience.',
    message: 'The Royal Velvet is completing a scheduled enhancement. The celebration house will reopen shortly, polished and fully prepared.',
  },
}

export function LuxuryImage({
  src,
  rawSrc,
  fallbackSrc,
  alt = '',
  className = '',
  imgClassName = '',
  fill = false,
  onLoad,
  onError,
  ...imageProps
}) {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [rawAttempted, setRawAttempted] = useState(false)

  useEffect(() => {
    setCurrentSrc(src)
    setLoaded(false)
    setFailed(false)
    setRawAttempted(false)
  }, [src])

  const handleLoad = (event) => {
    setLoaded(true)
    setFailed(false)
    onLoad?.(event)
  }

  const handleError = (event) => {
    if (rawSrc && !rawAttempted && currentSrc !== rawSrc) {
      setRawAttempted(true)
      setCurrentSrc(rawSrc)
      return
    }
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      return
    }
    setFailed(true)
    onError?.(event)
  }

  return (
    <span className={`luxury-image-shell${fill ? ' is-fill' : ''}${loaded ? ' is-loaded' : ''}${failed ? ' is-failed' : ''}${className ? ` ${className}` : ''}`}>
      {!loaded && (
        <span className="luxury-image-placeholder" role="status" aria-label="Preparing image">
          <i className="luxury-frame-ornament" aria-hidden="true" />
          <small>{failed ? 'Visual unavailable' : 'Preparing visual'}</small>
        </span>
      )}
      {currentSrc && (
        <img
          {...imageProps}
          className={imgClassName}
          src={currentSrc}
          srcSet={currentSrc === src ? imageProps.srcSet : undefined}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </span>
  )
}

export function ConciergeDataLoader({ compact = false, label = 'Retrieving the private archive' }) {
  return (
    <section className={`concierge-data-loader${compact ? ' is-compact' : ''}`} role="status" aria-live="polite">
      <div className="concierge-loader-head">
        <div>
          <p className="eyebrow">Concierge Dashboard</p>
          <h2>{label}</h2>
          <p>Synchronising secure Royal Velvet records.</p>
        </div>
        <span>Synchronising</span>
      </div>
      <div className="concierge-skeleton-grid" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <article className="concierge-skeleton-card" key={item}>
            <i className="concierge-skeleton-icon" />
            <i className="concierge-skeleton-line" />
            <i className="concierge-skeleton-line short" />
            <i className="concierge-skeleton-line tiny" />
          </article>
        ))}
      </div>
    </section>
  )
}

export function SecurePortalLoader() {
  return (
    <main className="secure-portal-loader" role="status" aria-live="polite" aria-busy="true">
      <section className="secure-portal-loader-card">
        <p className="eyebrow">Private Access</p>
        <h1>Entering the secure portal of The Royal Velvet.</h1>
        <p>Verifying the protected concierge route.</p>
        <div className="secure-portal-loading-line" aria-hidden="true"><i /></div>
        <small>Authorised access only</small>
      </section>
    </main>
  )
}

export function AdminDashboardEntryLoader() {
  return (
    <main className="admin-dashboard-entry-loader" role="status" aria-live="polite" aria-busy="true">
      <section className="admin-dashboard-entry-card">
        <div className="admin-dashboard-entry-orbit" aria-hidden="true">
          <i />
          <span />
        </div>
        <p className="eyebrow">Access Confirmed</p>
        <h1>Preparing your private command centre.</h1>
        <p>Synchronising the latest inquiries, projects, and concierge records.</p>
        <div className="admin-dashboard-entry-progress" aria-hidden="true"><i /></div>
        <small>Secure Royal Velvet session</small>
      </section>
    </main>
  )
}

export function TransactionSpinner() {
  return <i className="royal-transaction-spinner" aria-hidden="true" />
}

export function RoyalTransactionOverlay({ open, title = 'Securing your request', message = 'The Royal Velvet is confirming every detail before this action is completed.' }) {
  if (!open) return null
  return (
    <div className="royal-transaction-overlay" role="status" aria-live="assertive" aria-busy="true">
      <div className="royal-transaction-card">
        <p className="eyebrow">Confirmed Action</p>
        <div className="royal-transaction-mark" aria-hidden="true"><TransactionSpinner /></div>
        <h2>{title}</h2>
        <p>{message}</p>
        <span>Please keep this window open</span>
      </div>
    </div>
  )
}

export function LuxuryErrorPage({ variant = 'server', onPrimary, embedded = false }) {
  const copy = stateCopy[variant] || stateCopy.server
  const isNotFound = variant === 'notFound'
  const isMaintenance = variant === 'maintenance'
  const primaryLabel = isNotFound ? 'Return Home' : isMaintenance ? 'Return Home' : 'Try Again'
  const primaryAction = onPrimary || (() => {
    if (isNotFound || isMaintenance) window.location.assign('/')
    else window.location.reload()
  })

  return (
    <main className={`luxury-error-page${embedded ? ' is-embedded' : ''}`}>
      <section className="luxury-error-experience">
        {isNotFound ? <div className="luxury-error-number">{copy.code}</div> : <div className="luxury-error-door" aria-hidden="true" />}
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.message}</p>
        {isMaintenance && <div className="luxury-maintenance-line" aria-hidden="true" />}
        <div className="luxury-error-actions">
          <button type="button" onClick={primaryAction}>{primaryLabel}</button>
          {!isMaintenance && <a href="/contact">Contact Concierge</a>}
        </div>
      </section>
    </main>
  )
}

export function NetworkRecovery() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (online) return null
  return (
    <div className="network-recovery-overlay" role="alertdialog" aria-modal="true" aria-label="Network connection unavailable">
      <section className="network-recovery-card">
        <div className="network-recovery-orbit" aria-hidden="true"><i /></div>
        <p className="eyebrow">Connection Concierge</p>
        <h2>Your connection has paused.</h2>
        <p>The Royal Velvet will continue as soon as your device reconnects. Nothing entered on this page has been discarded.</p>
        <button type="button" onClick={() => setOnline(navigator.onLine)}>Retry Connection</button>
      </section>
    </div>
  )
}

export class LuxuryErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, details) {
    if (import.meta.env.DEV) console.error('The Royal Velvet interface error', error, details)
  }

  render() {
    if (this.state.hasError) return <LuxuryErrorPage variant="server" />
    return this.props.children
  }
}
