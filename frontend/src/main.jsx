import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/app.css'
import { initThemeOnBoot } from './utils/themeAndCoachConfig'

import ErrorBoundary from './components/ErrorBoundary.jsx'

// Initialize coach custom theme before rendering
initThemeOnBoot();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
