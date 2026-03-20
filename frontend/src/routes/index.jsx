import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { lazy, Suspense } from 'react'
import MainLayout from '../layouts/MainLayout'
import AuthLayout from '../layouts/AuthLayout'
import PosLayout from '../layouts/PosLayout'
import LoadingScreen from '../components/common/LoadingScreen'
import { hasPermission, isModuleActive } from '../features/authSlice'

// Lazy-load all pages for code splitting
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const Dashboard = lazy(() => import('../pages/Dashboard'))
const PosPage = lazy(() => import('../pages/pos/PosPage'))
const OrdersPage = lazy(() => import('../pages/orders/OrdersPage'))
const ReservationsPage = lazy(() => import('../pages/reservations/ReservationsPage'))
const CustomersPage = lazy(() => import('../pages/customers/CustomersPage'))
const MenuPage = lazy(() => import('../pages/menu/MenuPage'))
const StaffPage = lazy(() => import('../pages/staff/StaffPage'))
const KitchenPage = lazy(() => import('../pages/kitchen/KitchenPage'))
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'))
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'))
const TablesPage = lazy(() => import('../pages/tables/TablesPage'))
const PaymentSuccessPage = lazy(() => import('../pages/payment/PaymentSuccessPage'))

function ProtectedRoute({ children, permission, moduleKey }) {
  const { isAuthenticated, user, modules } = useSelector(s => s.auth)
  
  if (!isAuthenticated) return <Navigate to="/login" replace />
  
  // Check module access
  if (moduleKey && !isModuleActive(modules, moduleKey)) {
    return <Navigate to="/dashboard" replace />
  }
  
  // Check permission
  if (permission && !hasPermission(user, permission)) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

const Wrap = ({ children }) => (
  <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
)

export default function AppRoutes() {
  const isAuthenticated = useSelector(s => s.auth.isAuthenticated)

  return (
    <Routes>
      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={
          <Wrap>{isAuthenticated ? <Navigate to="/tables" replace /> : <LoginPage />}</Wrap>
        } />
      </Route>

      {/* Tables - fullscreen with POS header (no sidebar) */}
      <Route path="/tables" element={
        <ProtectedRoute permission="pos" moduleKey="tables"><Wrap><TablesPage /></Wrap></ProtectedRoute>
      } />

      {/* POS - fullscreen, no sidebar */}
      <Route element={<ProtectedRoute moduleKey="pos"><PosLayout /></ProtectedRoute>}>
        <Route path="/pos" element={
          <ProtectedRoute permission="pos" moduleKey="pos"><Wrap><PosPage /></Wrap></ProtectedRoute>
        } />
        <Route path="/payment-success" element={
          <ProtectedRoute><Wrap><PaymentSuccessPage /></Wrap></ProtectedRoute>
        } />
      </Route>

      {/* Main app with sidebar */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Wrap><Dashboard /></Wrap>} />
        <Route path="/orders" element={
          <ProtectedRoute permission="orders" moduleKey="orders"><Wrap><OrdersPage /></Wrap></ProtectedRoute>
        } />
        <Route path="/reservations" element={
          <ProtectedRoute permission="reservations" moduleKey="reservations"><Wrap><ReservationsPage /></Wrap></ProtectedRoute>
        } />
        <Route path="/customers" element={
          <ProtectedRoute permission="customers" moduleKey="customers"><Wrap><CustomersPage /></Wrap></ProtectedRoute>
        } />
        <Route path="/menu" element={
          <ProtectedRoute permission="menu" moduleKey="menu"><Wrap><MenuPage /></Wrap></ProtectedRoute>
        } />
        <Route path="/staff" element={
          <ProtectedRoute permission="staff" moduleKey="staff"><Wrap><StaffPage /></Wrap></ProtectedRoute>
        } />
        <Route path="/kitchen" element={
          <ProtectedRoute permission="kot" moduleKey="kot"><Wrap><KitchenPage /></Wrap></ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute permission="reports" moduleKey="reports"><Wrap><ReportsPage /></Wrap></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute permission="settings" moduleKey="settings"><Wrap><SettingsPage /></Wrap></ProtectedRoute>
        } />
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated ? '/tables' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
