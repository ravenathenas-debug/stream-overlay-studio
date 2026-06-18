import { useRef, useState } from 'react'
import { Overlay } from '../types/overlay'

interface Props {
  overlay: Overlay
  index: number
  totalCount: number
  onUpdate: (id: string, changes: Partial<Overlay>) => void
  onRemove: (id: string) => void
  onToggleVisible: (id: string) => void
  onToggleLock: (id: string) => void
  onRename: (id: string, name: string) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  onDuplicate: (id: string) => void
}

const TYPE_ICON: Record<string, string> = {
  tikfinity: '🎯',
  vdo: '📷',
  generic: '🌐',
}

export default function LayerItem({
  overlay, index, totalCount,
  onUpdate, onRemove, onToggleVisible, onToggleLock, onRename,
  onMoveUp, onMoveDown, onDuplicate,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(overlay.name)
  const nameRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraftName(overlay.name)
    setEditing(true)
    setTimeout(() => nameRef.current?.select(), 0)
  }

  function commitEdit() {
    const trimmed = draftName.trim()
    if (trimmed) onRename(overlay.id, trimmed)
    setEditing(false)
  }

  return (
    <div className={`layer-item ${overlay.visible ? '' : 'layer-hidden'} ${overlay.locked ? 'layer-locked' : ''}`}>
      <div className="layer-drag-handle">☰</div>
      <div className="layer-icon">{TYPE_ICON[overlay.type] ?? '🌐'}</div>

      <div className="layer-info" onDoubleClick={startEdit}>
        {editing ? (
          <input
            ref={nameRef}
            className="layer-name-input"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') setEditing(false)
            }}
          />
        ) : (
          <span className="layer-name">{overlay.name}</span>
        )}
        <span className="layer-url">{overlay.url}</span>
      </div>

      <div className="layer-controls">
        <button
          className={`icon-btn small ${overlay.visible ? 'active' : 'muted'}`}
          onClick={() => onToggleVisible(overlay.id)}
          title={overlay.visible ? 'Hide' : 'Show'}
        >{overlay.visible ? '👁' : '🙈'}</button>
        <button
          className={`icon-btn small ${overlay.locked ? 'active' : 'muted'}`}
          onClick={() => onToggleLock(overlay.id)}
          title={overlay.locked ? 'Unlock' : 'Lock'}
        >{overlay.locked ? '🔒' : '🔓'}</button>
        <button
          className="icon-btn small muted"
          onClick={(e) => { e.stopPropagation(); onDuplicate(overlay.id) }}
          title="Duplicate layer"
        >⧉</button>
        <button
          className="icon-btn small muted"
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          title="Move up"
        >↑</button>
        <button
          className="icon-btn small muted"
          onClick={() => onMoveDown(index)}
          disabled={index === totalCount - 1}
          title="Move down"
        >↓</button>
        <button
          className="icon-btn small danger"
          onClick={() => { if (confirm(`Remove "${overlay.name}"?`)) onRemove(overlay.id) }}
          title="Remove"
        >✕</button>
      </div>

      <div className="layer-sliders">
        <label className="slider-label">
          <span>Opacity</span>
          <input
            type="range" min={0} max={1} step={0.01}
            value={overlay.opacity}
            onChange={(e) => onUpdate(overlay.id, { opacity: parseFloat(e.target.value) })}
            className="slider"
          />
          <span className="slider-value">{Math.round(overlay.opacity * 100)}%</span>
        </label>
      </div>
    </div>
  )
}
