import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { reloadForNewVersion } from '@/lib/chunkReload'

// Vite fires this when a file a page needs is missing, which after a deploy
// means the open tab is running the previous version. See lib/chunkReload.js.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewVersion()) event.preventDefault()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
