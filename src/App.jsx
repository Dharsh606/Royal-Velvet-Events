import { lazy, Suspense, useEffect } from 'react'
import PublicSite from './components/PublicSite'
import { applyAdminSeo } from './lib/seo'
import './styles.css'

const AdminPanel = lazy(() => import('./components/AdminPanel'))

export default function App() {
  const isAdmin = window.location.pathname.startsWith('/admin')

  useEffect(() => {
    if (isAdmin) applyAdminSeo()
  }, [isAdmin])

  return isAdmin ? (
    <Suspense fallback={<div className="route-loader">Entering dashboard...</div>}>
      <AdminPanel />
    </Suspense>
  ) : (
    <PublicSite />
  )
}
