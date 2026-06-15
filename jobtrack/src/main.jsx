import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '10px',
              border: '1px solid #c2c6d6',
              fontSize: '14px',
              color: '#151c27',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
