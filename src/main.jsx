import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AppShellProvider } from './context/AppShellContext'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppShellProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AppShellProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)

// Register PWA Service Worker for desktop app installation
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Trigger background update checks
        reg.update().catch(() => {})
      })
      .catch((err) => {
        console.warn('Service worker registration failed:', err)
      })
  })
}
