import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { startPushNotifications } from '../utils/pushNotifications'

// Shows nothing. In the Android app it turns on push notifications once someone is logged in,
// and opens the right page (e.g. /chat/5) when a notification is tapped. Does nothing on the website.
export default function PushSetup() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    startPushNotifications((url) => navigate(url)).catch((err) => console.warn('Push setup failed', err))
  }, [user, navigate])

  return null
}
