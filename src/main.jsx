import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/theme.css'
import App from './App.jsx'
import { DataProvider } from './contexts/DataContext'
import { AuthProvider } from './contexts/AuthContext'
import { UserSettingsProvider } from './contexts/UserSettingsContext'
import { applyInitialAccessibilitySnapshot } from './utils/accessibilityPreferences'

applyInitialAccessibilitySnapshot()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <DataProvider>
        <UserSettingsProvider>
          <App />
        </UserSettingsProvider>
      </DataProvider>
    </AuthProvider>
  </StrictMode>,
)
