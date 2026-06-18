import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useOverlays } from '../hooks/useOverlays'
import { SyncStatus } from '../hooks/useSupabaseSync'
import { Overlay } from '../types/overlay'

const CANVAS_W = 1920
const CANVAS_H = 1080

const STATUS_COLOR: Record<SyncStatus, string> = {
  connecting: '#f59e0b',
  connected:  '#10b981',
  error:      '#f43f5e',
}

const STATUS_LABEL: Record<SyncStatus, string> = {
  connecting: 'Connecting…',
  connected:  'Connected',
  error:      'Disconnected',
}

function StatusDot({ status }: { status: SyncStatus }) {
  const [visible, setVisible] = useState(true)
  const [fadeKey, setFadeKey] = useState(0)

  // Re-show for 4 s every time status changes
  useEffect(() => {
    setVisible(true)
    setFadeKey((k) => k + 1)
    const t = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(t)
  }, [status])

  const color = STATUS_COLOR[status]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        borderRadius: 20,
        padding: '4px 10px 4px 8px',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: visible ? 1 : 0,
        transition: visible ? 'opacity 0.3s' : 'opacity 1.2s',
        // suppress the key from affecting anything meaningful — just re-triggers the effect
        ...(fadeKey >= 0 ? {} : {}),
      }}
    >
      {/* Pulsing dot */}
      <span style={{ position: 'relative', width: 8, height: 8, display: 'inline-block' }}>
        {status === 'connecting' && (
          <span style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: color, animation: 'sos-pulse 1s infinite',
          }} />
        )}
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%', background: color,
        }} />
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', fontFamily: 'system-ui, sans-serif', whiteSpace: 'nowrap' }}>
        {STATUS_LABEL[status]}
      </span>
    </div>
  )
}

function OverlayFrame({ overlay }: { overlay: Overlay }) {
  return (
    <div
      style={{
        position: 'absolute',
        left:   `${(overlay.x     / CANVAS_W) * 100}%`,
        top:    `${(overlay.y     / CANVAS_H) * 100}%`,
        width:  `${(overlay.width / CANVAS_W) * 100}%`,
        height: `${(overlay.height / CANVAS_H) * 100}%`,
        opacity: overlay.opacity,
        zIndex:  overlay.zIndex,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <iframe
        src={overlay.url}
        title={overlay.name}
        style={{
          width:  `${100 / overlay.scale}%`,
          height: `${100 / overlay.scale}%`,
          transformOrigin: 'top left',
          transform: `scale(${overlay.scale})`,
          border: 'none',
          background: 'transparent',
          pointerEvents: 'none',
        }}
        allowFullScreen
        allow="camera; microphone; autoplay; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
      />
    </div>
  )
}

export default function OverlayPage() {
  const { streamId } = useParams<{ streamId: string }>()

  // Force the body/root to be truly transparent so PRISM captures a clear background
  useEffect(() => {
    const els = [document.documentElement, document.body, document.getElementById('root')]
    els.forEach((el) => { if (el) el.style.background = 'transparent' })
    return () => {
      els.forEach((el) => { if (el) el.style.background = '' })
    }
  }, [])

  const { overlays, status } = useOverlays({
    streamId: streamId ?? '',
    role: 'receiver',
  })

  const sorted  = [...overlays].sort((a, b) => a.zIndex - b.zIndex)
  const visible = sorted.filter((o) => o.visible)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'transparent', overflow: 'hidden' }}>
      <style>{`
        @keyframes sos-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.9); opacity: 0; }
        }
      `}</style>

      <div style={{ position: 'absolute', inset: 0 }}>
        {visible.map((ov) => (
          <OverlayFrame key={ov.id} overlay={ov} />
        ))}
      </div>

      <StatusDot status={status} />
    </div>
  )
}
