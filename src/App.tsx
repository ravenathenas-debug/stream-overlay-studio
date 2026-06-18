import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import OverlayPage from './pages/OverlayPage'
import ControlPage from './pages/ControlPage'

function Home() {
  const navigate = useNavigate()
  const storedId = localStorage.getItem('sos-last-stream-id') ?? ''

  function go(type: 'overlay' | 'control', id: string) {
    if (!id.trim()) return
    localStorage.setItem('sos-last-stream-id', id.trim())
    navigate(`/${type}/${id.trim()}`)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>, type: 'overlay' | 'control') {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    go(type, fd.get('streamId') as string)
  }

  return (
    <div className="home-root">
      <div className="home-card">
        <div className="home-logo">🎬</div>
        <h1>Stream Overlay Studio</h1>
        <p className="home-subtitle">
          Real-time overlay manager for PRISM Live Mobile
        </p>

        <div className="home-section">
          <h2>Open Control Panel</h2>
          <p>Manage overlays on your second phone</p>
          <form onSubmit={(e) => handleSubmit(e, 'control')} className="home-form">
            <input
              name="streamId"
              type="text"
              className="input"
              placeholder="Stream ID (e.g. mystream)"
              defaultValue={storedId}
              required
              pattern="[a-zA-Z0-9_-]+"
              title="Letters, numbers, hyphens and underscores only"
            />
            <button type="submit" className="btn btn-primary">
              Open Control Panel →
            </button>
          </form>
        </div>

        <div className="home-divider" />

        <div className="home-section">
          <h2>Open Overlay Source</h2>
          <p>Load this URL in PRISM Live browser source</p>
          <form onSubmit={(e) => handleSubmit(e, 'overlay')} className="home-form">
            <input
              name="streamId"
              type="text"
              className="input"
              placeholder="Stream ID (same as control)"
              defaultValue={storedId}
              required
              pattern="[a-zA-Z0-9_-]+"
            />
            <button type="submit" className="btn btn-ghost">
              Preview Overlay →
            </button>
          </form>
        </div>

        <p className="home-hint">
          Use the same Stream ID on both devices to sync in real-time.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/overlay/:streamId" element={<OverlayPage />} />
        <Route path="/control/:streamId" element={<ControlPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
