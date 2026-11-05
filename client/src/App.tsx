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
      </Route>

      {/* Login / Register have their own centered layout */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Unknown URL -> home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
