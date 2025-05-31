import React from 'react'
import ReactDOM from 'react-dom/client'
import FloatingDisplay from './FloatingDisplay'
import './styles/index.css' // Corrected path to Tailwind CSS

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <FloatingDisplay />
  </React.StrictMode>
)
