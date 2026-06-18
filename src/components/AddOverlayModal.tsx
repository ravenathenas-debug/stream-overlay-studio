import { useState } from 'react'
import { Overlay, OverlayType } from '../types/overlay'

interface Props {
  onAdd: (overlay: Overlay) => void
  onClose: () => void
  nextZIndex: number
}

const OVERLAY_TYPES: { value: OverlayType; label: string; placeholder: string }[] = [
  {
    value: 'tikfinity',
    label: 'TikFinity',
    placeholder: 'https://tikfinity.zerody.one/widget/...',
  },
  { value: 'vdo', label: 'VDO Camera', placeholder: 'https://vdo.ninja/?view=...' },
  { value: 'generic', label: 'Generic URL', placeholder: 'https://example.com/overlay' },
]

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function AddOverlayModal({ onAdd, onClose, nextZIndex }: Props) {
  const [type, setType] = useState<OverlayType>('generic')
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')

  const selectedType = OVERLAY_TYPES.find((t) => t.value === type)!

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    const overlay: Overlay = {
      id: generateId(),
      name: name.trim() || selectedType.label,
      url: url.trim(),
      type,
      x: 50,
      y: 50,
      width: 400,
      height: 300,
      scale: 1,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: nextZIndex,
    }
    onAdd(overlay)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Overlay</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="type-tabs">
            {OVERLAY_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`type-tab ${type === t.value ? 'active' : ''}`}
                onClick={() => setType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <label className="field">
            <span>Name (optional)</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={selectedType.label}
              className="input"
            />
          </label>

          <label className="field">
            <span>URL</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={selectedType.placeholder}
              className="input"
              required
              autoFocus
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!url.trim()}>
              Add Overlay
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
