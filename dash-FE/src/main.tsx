import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './mobile.css'
import { previewMode } from './api/capabilities';
if (previewMode && !localStorage.getItem('dashtag_access_token')) localStorage.setItem('dashtag_access_token','preview-session');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
