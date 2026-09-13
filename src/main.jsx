import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { reloadForNewVersion, isChunkLoadError } from '@/lib/chunkReload'
import { recordCrash } from '@/lib/crashLog'
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

// Errors outside React's rendering - a failed upload, a save that threw in a
// click handler - never reach the error screen, so they are recorded here.
window.addEventListener('error', (event) => {
  recordCrash(event.error || event.message, { source: 'window' })
})
window.addEventListener('unhandledrejection', (event) => {
  if (isChunkLoadError(event.reason)) return
  recordCrash(event.reason, { source: 'promise' })
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
