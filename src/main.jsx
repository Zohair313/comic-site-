import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { SiteDataProvider } from './context/SiteDataContext'
import '@fontsource/opendyslexic/400.css'
import '@fontsource/opendyslexic/400-italic.css'
import '@fontsource/opendyslexic/700.css'
import '@fontsource/opendyslexic/700-italic.css'
import './index.css'
import './Greyfire.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SiteDataProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </SiteDataProvider>
  </StrictMode>,
)
