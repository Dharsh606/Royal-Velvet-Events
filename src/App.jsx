import { lazy, Suspense } from 'react'
import PublicSite from './components/PublicSite'
import './styles.css'

const AdminPanel = lazy(() => import('./components/AdminPanel'))

export default function App() {
  return window.location.pathname.startsWith('/admin') ? (
    <Suspense fallback={<div className="route-loader">Entering dashboard…</div>}>
      <AdminPanel />
    </Suspense>
  ) : (
    <PublicSite />
  )
}
