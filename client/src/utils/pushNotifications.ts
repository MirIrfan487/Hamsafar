// Push notifications in the Android app (Firebase Cloud Messaging via @capacitor/push-notifications).
// The website does not use push; every function here does nothing there.
//
// Flow: after login -> ask permission -> Android gives this phone a token -> we send it to POST /api/devices.
//       The server then pushes "new interest / accepted / new message" to that token (NotificationService).
//       On logout -> DELETE /api/devices, so the next person using this phone gets nothing meant for us.

import { PushNotifications } from '@capacitor/push-notifications'
import { devicesApi } from '../services/devices'
import { isNativeApp } from './nativeApp'

// The same id is set as the default channel in AndroidManifest.xml (server messages use it automatically)
const CHANNEL_ID = 'hamsafar'
const TOKEN_KEY = 'matrimony_push_token' // this phone's token, remembered so logout can remove it

let listenersAdded = false

function savedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

// Call when a member is logged in. onOpen(url) is called when they tap a notification.
export async function startPushNotifications(onOpen: (url: string) => void) {
  if (!isNativeApp) return

  if (!listenersAdded) {
    listenersAdded = true

    // Android gave us (or renewed) this phone's token -> tell the server
    await PushNotifications.addListener('registration', ({ value }) => {
      saveToken(value)
      devicesApi.register(value).catch(() => {
        /* not critical: we try again at the next app start */
      })
    })

    await PushNotifications.addListener('registrationError', (err) => {
      console.warn('Push registration failed', err.error)
    })

    // Tapped a notification (also works when the tap started the app)
    await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
      const url = notification.data?.url
      if (typeof url === 'string' && url.startsWith('/')) onOpen(url) // only our own pages
    })

    // Android 8+ groups notifications in "channels" the member can switch off in the phone settings
    await PushNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Interests and messages',
      description: 'New interests, accepted interests and new messages',
      importance: 4, // high: makes a sound and shows a banner
      visibility: 0, // private: on a locked screen only "Hamsafar" shows, not the text
    })
  }

  // Android 13+ asks the member once; earlier versions allow it automatically
  let permission = await PushNotifications.checkPermissions()
  if (permission.receive === 'prompt') permission = await PushNotifications.requestPermissions()
  if (permission.receive !== 'granted') return // they said no: the app works without notifications

  await PushNotifications.register() // -> 'registration' event above
}

// Call on logout, BEFORE the login token is cleared (the request needs it).
export function stopPushNotifications() {
  if (!isNativeApp) return
  const token = savedToken()
  if (token) {
    // apiRequest reads the login token immediately, so this still works after logout clears it
    devicesApi.unregister(token).catch(() => {
      /* offline: the server replaces it when someone logs in on this phone again */
    })
  }
}
