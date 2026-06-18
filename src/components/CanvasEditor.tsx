import { useRef, useState, useCallback, useEffect } from 'react'
import { Overlay } from '../types/overlay'
import { CANVAS_DIMS } from '../constants/canvas'

interface Props {
  overlays: Overlay[]
  onUpdate: (id: string, changes: Partial<Overlay>) => void
  aspectRatio: '16:9' | '9:16'
  selectedId: string | null
  onSelect: (id: string | null) => void
}

interface DragState {
  type: 'move' | 'resize-se' | 'resize-sw' | 'resize-ne' | 'resize-nw'
  id: string
  startX: number
  startY: number
  origX: number
  origY: number
  origW: number
  origH: number
}

const TYPE_COLOR: Record<string, string> = {
  tikfinity: '#f43f5e',
  vdo: '#8b5cf6',
  generic: '#3b82f6',
}

const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 2.5, 3]
const PAD = 60 // px padding around canvas (room to see off-canvas layers)

export default function CanvasEditor({ overlays, onUpdate, aspectRatio, selectedId, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [wrapSize, setWrapSize] = useState({ w: 800, h: 600 })
  const [zoomFactor, setZoomFactor] = useState(1)
  const dragRef = useRef<DragState | null>(null)

  const { w: CANVAS_W, h: CANVAS_H } = CANVAS_DIMS[aspectRatio]

  // For portrait (9:16): fit to width so the canvas fills the panel horizontally
  // and scrolls vertically — matches how PRISM shows the portrait canvas.
  // For landscape (16:9): fit to whichever dimension is tighter.
  const fitScale = aspectRatio === '9:16'
    ? (wrapSize.w - PAD * 2) / CANVAS_W
    : Math.min(
        (wrapSize.w - PAD * 2) / CANVAS_W,
        (wrapSize.h - PAD * 2) / CANVAS_H
      )

  const scale = fitScale * zoomFactor
  const stageW = Math.round(CANVAS_W * scale)
  const stageH = Math.round(CANVAS_H * scale)

  // Measure wrapper
  useEffect(() => {
    function measure() {
      if (!wrapRef.current) return
      const { width, height } = wrapRef.current.getBoundingClientRect()
      setWrapSize({ w: width, h: height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  // Reset zoom when aspect ratio changes
  useEffect(() => {
    setZoomFactor(1)
  }, [aspectRatio])

  // Convert pointer client coords → canvas pixel coords
  const toCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return { cx: 0, cy: 0 }
    return {
      cx: (clientX - rect.left) / scale,
      cy: (clientY - rect.top) / scale,
    }
  }, [scale])

  function startInteraction(e: React.PointerEvent, overlay: Overlay, type: DragState['type']) {
    if (overlay.locked) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    onSelect(overlay.id)
    const { cx, cy } = toCanvas(e.clientX, e.clientY)
    dragRef.current = {
      type, id: overlay.id,
      startX: cx, startY: cy,
      origX: overlay.x, origY: overlay.y,
      origW: overlay.width, origH: overlay.height,
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d) return
    const { cx, cy } = toCanvas(e.clientX, e.clientY)
    const dx = cx - d.startX
    const dy = cy - d.startY

    if (d.type === 'move') {
      // No clamping — layers can go past canvas edges
      onUpdate(d.id, { x: d.origX + dx, y: d.origY + dy })
    } else {
      let nx = d.origX, ny = d.origY, nw = d.origW, nh = d.origH
      if (d.type === 'resize-se') { nw = Math.max(80, d.origW + dx); nh = Math.max(60, d.origH + dy) }
      else if (d.type === 'resize-sw') { nw = Math.max(80, d.origW - dx); nh = Math.max(60, d.origH + dy); nx = d.origX + d.origW - nw }
      else if (d.type === 'resize-ne') { nw = Math.max(80, d.origW + dx); nh = Math.max(60, d.origH - dy); ny = d.origY + d.origH - nh }
      else if (d.type === 'resize-nw') { nw = Math.max(80, d.origW - dx); nh = Math.max(60, d.origH - dy); nx = d.origX + d.origW - nw; ny = d.origY + d.origH - nh }
      onUpdate(d.id, { x: nx, y: ny, width: nw, height: nh })
    }
  }

  function onPointerUp() { dragRef.current = null }

  function zoomIn() {
    const next = ZOOM_STEPS.find((z) => z > zoomFactor)
    if (next) setZoomFactor(next)
  }

  function zoomOut() {
    const prev = [...ZOOM_STEPS].reverse().find((z) => z < zoomFactor)
    if (prev) setZoomFactor(prev)
  }

  function zoomFit() { setZoomFactor(1) }

  const sorted = [...overlays].sort((a, b) => a.zIndex - b.zIndex)
  const isZoomed = zoomFactor !== 1

  return (
    <div className="canvas-wrap" ref={wrapRef} style={{ overflow: 'auto' }}>
      {/* Centering shell — needed so stage is centered when smaller than wrap */}
      <div
        className="canvas-center"
        style={{
          minWidth: stageW + PAD * 2,
          minHeight: stageH + PAD * 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => onSelect(null)}
      >
        {/* The actual canvas stage at scaled pixel size */}
        <div
          ref={stageRef}
          className="canvas-stage"
          style={{ width: stageW, height: stageH }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="canvas-inner">
            {sorted.map((ov) => {
              const isSelected = ov.id === selectedId
              const color = TYPE_COLOR[ov.type] ?? '#3b82f6'
              const isHidden = !ov.visible

              return (
                <div
                  key={ov.id}
                  className={`canvas-overlay-wrap ${isSelected ? 'is-selected' : ''} ${ov.locked ? 'is-locked' : ''} ${isHidden ? 'is-hidden' : ''}`}
                  style={{
                    left: `${(ov.x / CANVAS_W) * 100}%`,
                    top: `${(ov.y / CANVAS_H) * 100}%`,
                    width: `${(ov.width / CANVAS_W) * 100}%`,
                    height: `${(ov.height / CANVAS_H) * 100}%`,
                    '--overlay-color': color,
                  } as React.CSSProperties}
                >
                  <div className="canvas-iframe-container" style={{ opacity: ov.opacity }}>
                    <iframe
                      src={ov.url}
                      title={ov.name}
                      className="canvas-iframe"
                      style={{
                        width: `${100 / ov.scale}%`,
                        height: `${100 / ov.scale}%`,
                        transform: `scale(${ov.scale})`,
                        transformOrigin: 'top left',
                      }}
                      allow="camera; microphone; autoplay; fullscreen"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
                    />
                  </div>

                  <div
                    className="canvas-capture-layer"
                    onPointerDown={(e) => startInteraction(e, ov, 'move')}
                    onClick={(e) => { e.stopPropagation(); onSelect(ov.id) }}
                  />

                  <div className="canvas-overlay-label" style={{ background: color }}>
                    {ov.locked && '🔒 '}{isHidden && '👁 '}{ov.name}
                  </div>

                  {isSelected && !ov.locked && (
                    <>
                      <div className="resize-handle nw" onPointerDown={(e) => startInteraction(e, ov, 'resize-nw')} />
                      <div className="resize-handle ne" onPointerDown={(e) => startInteraction(e, ov, 'resize-ne')} />
                      <div className="resize-handle sw" onPointerDown={(e) => startInteraction(e, ov, 'resize-sw')} />
                      <div className="resize-handle se" onPointerDown={(e) => startInteraction(e, ov, 'resize-se')} />
                    </>
                  )}
                </div>
              )
            })}

            {overlays.length === 0 && (
              <div className="canvas-empty">No overlays added yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Zoom controls — fixed in bottom-right of canvas area */}
      <div className="canvas-zoom-bar">
        <button className="czoom-btn" onClick={zoomOut} disabled={zoomFactor <= ZOOM_STEPS[0]} title="Zoom out">−</button>
        <button className="czoom-pct" onClick={zoomFit} title="Reset to fit">{Math.round(fitScale * zoomFactor * 100)}%</button>
        <button className="czoom-btn" onClick={zoomIn} disabled={zoomFactor >= ZOOM_STEPS[ZOOM_STEPS.length - 1]} title="Zoom in">+</button>
        <div className="czoom-divider" />
        <button className="czoom-fit" onClick={zoomFit} title="Fit to screen">⊡ Fit</button>
      </div>
    </div>
  )
}
