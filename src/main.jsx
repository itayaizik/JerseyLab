import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { reloadForNewVersion } from '@/lib/chunkReload'
import { applyPrefs, loadPrefs } from '@/lib/accessibilityPrefs'

// The accessibility menu's saved choices, applied before React draws anything,
// so a visitor who needs large text or high contrast never sees the page
// without it.
applyPrefs(loadPrefs())

// Vite fires this when a file a page needs is missing, which after a deploy
// means the open tab is running the previous version. See lib/chunkReload.js.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewVersion()) event.preventDefault()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
