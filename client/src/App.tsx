import { Navigate, Route, Routes } from 'react-router'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import StatusPage from './pages/StatusPage'
import ProfileWizardPage from './pages/ProfileWizardPage'
import SearchPage from './pages/SearchPage'
import ProfileDetailPage from './pages/ProfileDetailPage'
import InterestsPage from './pages/InterestsPage'
import ChatPage from './pages/ChatPage'
import PlansPage from './pages/PlansPage'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './pages/admin/AdminLayout'
import AdminOverviewPage from './pages/admin/AdminOverviewPage'
import AdminProfilesPage from './pages/admin/AdminProfilesPage'
import AdminPhotosPage from './pages/admin/AdminPhotosPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminMembersPage from './pages/admin/AdminMembersPage'
import AdminActivityPage from './pages/admin/AdminActivityPage'

// All pages (routes) of the app in one place
export default function App() {
  return (
    <Routes>
      {/* Pages with the navbar */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/plans" element={<PlansPage />} />

        {/* Pages that need login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile/edit" element={<ProfileWizardPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profiles/:id" element={<ProfileDetailPage />} />
          <Route path="/interests" element={<InterestsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:conversationId" element={<ChatPage />} />
        </Route>

        {/* Admin pages (Admin role only) */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="profiles" element={<AdminProfilesPage />} />
            <Route path="photos" element={<AdminPhotosPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="members" element={<AdminMembersPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
          </Route>
        </Route>
      </Route>

      {/* Login / Register have their own centered layout */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Unknown URL -> home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
