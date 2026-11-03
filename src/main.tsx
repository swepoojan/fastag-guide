import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'
import { I18nProvider } from './i18n'
import './index.css'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>
)

// The production page arrives prerendered; hydrate it. In development the root is empty.
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
