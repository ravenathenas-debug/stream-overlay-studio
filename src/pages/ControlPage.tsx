import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useOverlays } from '../hooks/useOverlays'
import AddOverlayModal from '../components/AddOverlayModal'
import LayerItem from '../components/LayerItem'
import CanvasEditor from '../components/CanvasEditor'
import { CANVAS_DIMS } from '../constants/canvas'
import PresetManager from '../components/PresetManager'
import { Overlay, LayoutPreset } from '../types/overlay'

type AspectRatio = '16:9' | '9:16'

const AR_STORAGE_KEY = 'sos-aspect-ratio'
const PRESET_STORAGE_KEY = 'sos-presets'

function loadAspectRatio(): AspectRatio {
  const saved = localStorage.getItem(AR_STORAGE_KEY)
  return saved === '9:16' ? '9:16' : '16:9'
}

function loadPresets(): LayoutPreset[] {
  try {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LayoutPreset[]) : []
  } catch { return [] }
}

function savePresets(presets: LayoutPreset[]) {
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets))
}

export default function ControlPage() {
  const { streamId } = useParams<{ streamId: string }>()
  const sid = streamId ?? ''

  const { overlays, addOverlay, updateOverlay, removeOverlay, reorder, toggleVisible, toggleLock, rename, setOverlays, duplicateOverlay } =
    useOverlays({ streamId: sid, role: 'controller' })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(loadAspectRatio)
  const [panelOpen, setPanelOpen] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [showPresetsInline, setShowPresetsInline] = useState(false)
  const [presets, setPresetsState] = useState<LayoutPreset[]>(loadPresets)
  const [newPresetName, setNewPresetName] = useState('')

  useEffect(() => {
    localStorage.setItem(AR_STORAGE_KEY, aspectRatio)
  }, [aspectRatio])

  const selectedOverlay = overlays.find((o) => o.id === selectedId) ?? null

  const overlayUrl = `${window.location.origin}/overlay/${sid}`

  function copyOverlayUrl() {
    navigator.clipboard.writeText(overlayUrl).catch(() => {})
  }

  function handleSavePreset() {
    if (!newPresetName.trim()) return
    const preset: LayoutPreset = {
      id: Math.random().toString(36).slice(2, 10),
      name: newPresetName.trim(),
      overlays: JSON.parse(JSON.stringify(overlays)) as Overlay[],
      createdAt: new Date().toISOString(),
    }
    const next = [...presets, preset]
    setPresetsState(next)
    savePresets(next)
    setNewPresetName('')
  }

  function handleDeletePreset(id: string) {
    const next = presets.filter((p) => p.id !== id)
    setPresetsState(next)
    savePresets(next)
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
        if (Array.isArray(parsed.overlays)) setOverlays(parsed.overlays)
      } catch { alert('Invalid JSON file') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="cp-root">
      {/* ── Header ── */}
      <header className="cp-header">
        <div className="cp-header-left">
          <span className="cp-logo">🎬</span>
          <div className="cp-title-group">
            <h1 className="cp-title">Overlay Studio</h1>
            <span className="cp-stream-id">stream: {sid}</span>
          </div>
        </div>

        <div className="cp-header-center">
          <div className="cp-ar-toggle">
            <button
              className={`cp-ar-btn ${aspectRatio === '16:9' ? 'active' : ''}`}
              onClick={() => setAspectRatio('16:9')}
              title="Landscape 16:9"
            >
              <span className="ar-icon ar-16-9" />
              16:9
            </button>
            <button
              className={`cp-ar-btn ${aspectRatio === '9:16' ? 'active' : ''}`}
              onClick={() => setAspectRatio('9:16')}
              title="Portrait 9:16"
            >
              <span className="ar-icon ar-9-16" />
              9:16
            </button>
          </div>
        </div>

        <div className="cp-header-right">
          <button className="cp-icon-btn" onClick={() => setShowAdd(true)} title="Add overlay">
            ＋
          </button>
          <button
            className={`cp-icon-btn ${panelOpen ? 'active' : ''}`}
            onClick={() => setPanelOpen((p) => !p)}
            title={panelOpen ? 'Close panel' : 'Open panel'}
          >
            ☰
          </button>
        </div>
      </header>

      {/* ── URL bar ── */}
      <div className="cp-url-bar">
        <span className="cp-url-label">Browser Source:</span>
        <span className="cp-url-text">{overlayUrl}</span>
        <button className="cp-url-copy" onClick={copyOverlayUrl}>Copy</button>
      </div>

      {/* ── Body ── */}
      <div className="cp-body">
        {/* Canvas */}
        <div className="cp-canvas-area">
          <CanvasEditor
            overlays={overlays}
            onUpdate={updateOverlay}
            aspectRatio={aspectRatio}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {/* Inspector (shown when overlay selected) */}
          {selectedOverlay && (() => {
            const { w: CW, h: CH } = CANVAS_DIMS[aspectRatio]
            const ov = selectedOverlay
            const xMin = -Math.round(CW / 2), xMax = Math.round(CW * 1.5)
            const yMin = -Math.round(CH / 2), yMax = Math.round(CH * 1.5)
            return (
              <div className="cp-inspector">
                <div className="cp-inspector-grid">
                  {/* X */}
                  <div className="cp-slider-row">
                    <span className="cp-slider-lbl">X</span>
                    <input type="range" className="cp-insp-slider" min={xMin} max={xMax} step={1}
                      value={Math.round(ov.x)}
                      onChange={(e) => updateOverlay(ov.id, { x: Number(e.target.value) })} />
                    <input type="number" className="cp-num" value={Math.round(ov.x)}
                      onChange={(e) => updateOverlay(ov.id, { x: Number(e.target.value) })} />
                  </div>
                  {/* Y */}
                  <div className="cp-slider-row">
                    <span className="cp-slider-lbl">Y</span>
                    <input type="range" className="cp-insp-slider" min={yMin} max={yMax} step={1}
                      value={Math.round(ov.y)}
                      onChange={(e) => updateOverlay(ov.id, { y: Number(e.target.value) })} />
                    <input type="number" className="cp-num" value={Math.round(ov.y)}
                      onChange={(e) => updateOverlay(ov.id, { y: Number(e.target.value) })} />
                  </div>
                  {/* W */}
                  <div className="cp-slider-row">
                    <span className="cp-slider-lbl">W</span>
                    <input type="range" className="cp-insp-slider" min={80} max={CW} step={1}
                      value={Math.round(ov.width)}
                      onChange={(e) => updateOverlay(ov.id, { width: Number(e.target.value) })} />
                    <input type="number" className="cp-num" value={Math.round(ov.width)}
                      onChange={(e) => updateOverlay(ov.id, { width: Number(e.target.value) })} />
                  </div>
                  {/* H */}
                  <div className="cp-slider-row">
                    <span className="cp-slider-lbl">H</span>
                    <input type="range" className="cp-insp-slider" min={60} max={CH} step={1}
                      value={Math.round(ov.height)}
                      onChange={(e) => updateOverlay(ov.id, { height: Number(e.target.value) })} />
                    <input type="number" className="cp-num" value={Math.round(ov.height)}
                      onChange={(e) => updateOverlay(ov.id, { height: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="cp-inspector-row cp-inspector-zoom">
                  <span className="cp-zoom-label">Zoom</span>
                  <input type="range" min={0.1} max={4} step={0.05} value={ov.scale}
                    onChange={(e) => updateOverlay(ov.id, { scale: parseFloat(e.target.value) })}
                    className="cp-zoom-slider" />
                  <span className="cp-zoom-value">{Math.round(ov.scale * 100)}%</span>
                  <button className="cp-deselect" onClick={() => setSelectedId(null)}>✕</button>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Side panel */}
        {panelOpen && (
          <aside className="cp-panel">
            <div className="cp-panel-header">
              <span className="cp-panel-title">Layers ({overlays.length})</span>
              <div className="cp-panel-actions">
                <button className="cp-text-btn" onClick={() => setShowPresetsInline((p) => !p)}>
                  {showPresetsInline ? '← Layers' : '📂 Presets'}
                </button>
                <button className="cp-add-btn" onClick={() => setShowAdd(true)}>+ Add</button>
              </div>
            </div>

            <div className="cp-panel-body">
              {!showPresetsInline ? (
                <>
                  {overlays.length === 0 && (
                    <div className="cp-empty">
                      <p>No overlays yet</p>
                      <button className="cp-add-btn" onClick={() => setShowAdd(true)}>+ Add overlay</button>
                    </div>
                  )}
                  {[...overlays].map((ov, i) => (
                    <div
                      key={ov.id}
                      className={`cp-layer-wrap ${selectedId === ov.id ? 'cp-layer-selected' : ''}`}
                      onClick={() => setSelectedId(ov.id === selectedId ? null : ov.id)}
                    >
                      <LayerItem
                        overlay={ov}
                        index={i}
                        totalCount={overlays.length}
                        onUpdate={updateOverlay}
                        onRemove={removeOverlay}
                        onToggleVisible={toggleVisible}
                        onToggleLock={toggleLock}
                        onRename={rename}
                        onMoveUp={(idx) => reorder(idx, idx - 1)}
                        onMoveDown={(idx) => reorder(idx, idx + 1)}
                        onDuplicate={duplicateOverlay}
                      />
                    </div>
                  ))}
                </>
              ) : (
                <div className="cp-presets-panel">
                  <section className="cp-preset-section">
                    <h3>Save Layout</h3>
                    <div className="cp-preset-save-row">
                      <input
                        type="text"
                        className="cp-preset-input"
                        placeholder="Preset name..."
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                      />
                      <button className="cp-add-btn" onClick={handleSavePreset} disabled={!newPresetName.trim()}>
                        Save
                      </button>
                    </div>
                  </section>

                  <section className="cp-preset-section">
                    <h3>Saved Presets</h3>
                    {presets.length === 0 && <p className="cp-empty-text">No presets yet</p>}
                    <ul className="cp-preset-list">
                      {presets.map((preset) => (
                        <li key={preset.id} className="cp-preset-item">
                          <div className="cp-preset-info">
                            <span className="cp-preset-name">{preset.name}</span>
                            <span className="cp-preset-count">{preset.overlays.length} overlays</span>
                          </div>
                          <div className="cp-preset-btns">
                            <button className="cp-add-btn cp-btn-sm"
                              onClick={() => setOverlays(JSON.parse(JSON.stringify(preset.overlays)) as Overlay[])}>
                              Load
                            </button>
                            <button className="cp-danger-btn cp-btn-sm" onClick={() => handleDeletePreset(preset.id)}>
                              ✕
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="cp-preset-section">
                    <h3>Export / Import</h3>
                    <div className="cp-export-row">
                      <button className="cp-ghost-btn" onClick={handleExport}>Export JSON</button>
                      <label className="cp-ghost-btn">
                        Import JSON
                        <input type="file" accept=".json" className="visually-hidden" onChange={handleImport} />
                      </label>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ── Modals ── */}
      {showAdd && (
        <AddOverlayModal
          onAdd={addOverlay}
          onClose={() => setShowAdd(false)}
          nextZIndex={overlays.length}
        />
      )}

      {showPresets && (
        <PresetManager
          overlays={overlays}
          onLoad={(ovs: Overlay[]) => setOverlays(ovs)}
          onClose={() => setShowPresets(false)}
        />
      )}
    </div>
  )
}
