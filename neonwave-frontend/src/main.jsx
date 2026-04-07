import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { QueueProvider } from './contexts/QueueContext'
import './styles/NeonPlayer.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueueProvider>
        <App />
      </QueueProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
