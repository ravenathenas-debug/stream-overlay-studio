import { useState } from 'react'
import { LayoutPreset, Overlay } from '../types/overlay'

const STORAGE_KEY = 'sos-presets'

function loadPresets(): LayoutPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LayoutPreset[]) : []
  } catch {
    return []
  }
}

function savePresets(presets: LayoutPreset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

interface Props {
  overlays: Overlay[]
  onLoad: (overlays: Overlay[]) => void
  onClose: () => void
}

export default function PresetManager({ overlays, onLoad, onClose }: Props) {
  const [presets, setPresets] = useState<LayoutPreset[]>(loadPresets)
  const [newName, setNewName] = useState('')

  function handleSave() {
    if (!newName.trim()) return
    const preset: LayoutPreset = {
      id: Math.random().toString(36).slice(2, 10),
      name: newName.trim(),
      overlays: JSON.parse(JSON.stringify(overlays)) as Overlay[],
      createdAt: new Date().toISOString(),
    }
    const next = [...presets, preset]
    setPresets(next)
    savePresets(next)
    setNewName('')
  }

  function handleDelete(id: string) {
    const next = presets.filter((p) => p.id !== id)
    setPresets(next)
    savePresets(next)
  }

  function handleLoad(preset: LayoutPreset) {
    onLoad(JSON.parse(JSON.stringify(preset.overlays)) as Overlay[])
    onClose()
  }

  function handleExport() {
    const data = JSON.stringify({ overlays, exportedAt: new Date().toISOString() }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `overlay-layout-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as { overlays: Overlay[] }
        if (Array.isArray(parsed.overlays)) {
          onLoad(parsed.overlays)
          onClose()
        }
      } catch {
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Presets & Export</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <section className="preset-section">
            <h3>Save Current Layout</h3>
            <div className="preset-save-row">
              <input
                type="text"
                className="input"
                placeholder="Preset name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!newName.trim()}
              >
                Save
              </button>
            </div>
          </section>

          <section className="preset-section">
            <h3>Saved Presets</h3>
            {presets.length === 0 && (
              <p className="empty-text">No presets saved yet</p>
            )}
            <ul className="preset-list">
              {presets.map((preset) => (
                <li key={preset.id} className="preset-item">
                  <div className="preset-info">
                    <span className="preset-name">{preset.name}</span>
                    <span className="preset-count">{preset.overlays.length} overlays</span>
                  </div>
                  <div className="preset-actions">
                    <button className="btn btn-sm btn-primary" onClick={() => handleLoad(preset)}>
                      Load
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(preset.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="preset-section">
            <h3>Export / Import</h3>
            <div className="export-row">
              <button className="btn btn-ghost" onClick={handleExport}>
                Export JSON
              </button>
              <label className="btn btn-ghost import-label">
                Import JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  className="visually-hidden"
                  onChange={handleImport}
                />
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
