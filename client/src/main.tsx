import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './hooks/useAuth'
import { ChatProvider } from './hooks/useChat'
import PushSetup from './components/PushSetup'
import { setupBackButton } from './utils/nativeApp'

setupBackButton() // Android app only; does nothing on the website

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <PushSetup />
          <App />
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
