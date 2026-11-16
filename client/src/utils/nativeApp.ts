// Things that only happen inside the Android app (Capacitor). On the website every function here does nothing.

import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

// true inside the Android app, false in a normal browser
export const isNativeApp = Capacitor.isNativePlatform()

// Pages where the Back button should leave the app instead of going to the previous page.
// Without this, Back on the dashboard right after login would go back to the login page.
const START_PAGES = ['/', '/dashboard', '/admin']

// Android's Back button (or back gesture).
//  - on a start page: put the app in the background (like other Android apps; chat stays connected)
//  - anywhere else:   go to the previous page, the same as the browser's Back
export function setupBackButton() {
  if (!isNativeApp) return

  App.addListener('backButton', ({ canGoBack }) => {
    const onStartPage = START_PAGES.includes(window.location.pathname)
    if (canGoBack && !onStartPage) {
      window.history.back()
    } else {
      App.minimizeApp()
    }
  })
}
