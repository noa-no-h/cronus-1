import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from './contexts/ThemeContext'
import FloatingDisplay from './FloatingDisplay'
import './styles/index.css' // Corrected path to Tailwind CSS

// Component to apply dark mode
const AppWithForcedDarkMode = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <ThemeProvider>
      <FloatingDisplay />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppWithForcedDarkMode />
  </React.StrictMode>
)
