import { useReducer, useCallback, useEffect, useRef } from 'react'
import { Overlay, OverlayAction, StreamState } from '../types/overlay'
import { useSupabaseSync } from './useSupabaseSync'

const STORAGE_PREFIX = 'sos-stream-'

function overlayReducer(state: Overlay[], action: OverlayAction): Overlay[] {
  switch (action.type) {
    case 'SET_OVERLAYS':
      return action.overlays

    case 'ADD_OVERLAY':
      return [...state, action.overlay]

    case 'UPDATE_OVERLAY':
      return state.map((o) => (o.id === action.id ? { ...o, ...action.changes } : o))

    case 'REMOVE_OVERLAY':
      return state.filter((o) => o.id !== action.id)

    case 'REORDER': {
      const next = [...state]
      const [moved] = next.splice(action.fromIndex, 1)
      next.splice(action.toIndex, 0, moved)
      return next.map((o, i) => ({ ...o, zIndex: i }))
    }

    case 'TOGGLE_VISIBLE':
      return state.map((o) => (o.id === action.id ? { ...o, visible: !o.visible } : o))

    case 'TOGGLE_LOCK':
      return state.map((o) => (o.id === action.id ? { ...o, locked: !o.locked } : o))

    case 'DUPLICATE_OVERLAY': {
      const src = state.find((o) => o.id === action.id)
      if (!src) return state
      const copy: Overlay = {
        ...src,
        id: Math.random().toString(36).slice(2, 10),
        name: src.name + ' copy',
        x: src.x + 30,
        y: src.y + 30,
        zIndex: state.length,
      }
      return [...state, copy]
    }

    case 'RENAME':
      return state.map((o) => (o.id === action.id ? { ...o, name: action.name } : o))

    default:
      return state
  }
}

function loadFromStorage(streamId: string): Overlay[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${streamId}`)
    return raw ? (JSON.parse(raw) as Overlay[]) : []
  } catch {
    return []
  }
}

function saveToStorage(streamId: string, overlays: Overlay[]) {
  localStorage.setItem(`${STORAGE_PREFIX}${streamId}`, JSON.stringify(overlays))
}

interface UseOverlaysOptions {
  streamId: string
  role: 'controller' | 'receiver'
}

export function useOverlays({ streamId, role }: UseOverlaysOptions) {
  const [overlays, dispatch] = useReducer(overlayReducer, [], () =>
    role === 'controller' ? loadFromStorage(streamId) : []
  )

  const overlaysRef = useRef(overlays)
  overlaysRef.current = overlays

  const handleRemoteState = useCallback((state: StreamState) => {
    dispatch({ type: 'SET_OVERLAYS', overlays: state.overlays })
  }, [])

  const handleStateRequested = useCallback(() => {
    broadcastRef.current({
      overlays: overlaysRef.current,
      updatedAt: new Date().toISOString(),
    })
  }, [])

  const { broadcast, status } = useSupabaseSync({
    streamId,
    role,
    onRemoteState: handleRemoteState,
    onStateRequested: handleStateRequested,
  })

  const broadcastRef = useRef(broadcast)
  broadcastRef.current = broadcast

  useEffect(() => {
    if (role !== 'controller') return
    saveToStorage(streamId, overlays)
    broadcastRef.current({
      overlays,
      updatedAt: new Date().toISOString(),
    })
  }, [overlays, streamId, role])

  const addOverlay = useCallback((overlay: Overlay) => {
    dispatch({ type: 'ADD_OVERLAY', overlay })
  }, [])

  const updateOverlay = useCallback((id: string, changes: Partial<Overlay>) => {
    dispatch({ type: 'UPDATE_OVERLAY', id, changes })
  }, [])

  const removeOverlay = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_OVERLAY', id })
  }, [])

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER', fromIndex, toIndex })
  }, [])

  const toggleVisible = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_VISIBLE', id })
  }, [])

  const toggleLock = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_LOCK', id })
  }, [])

  const rename = useCallback((id: string, name: string) => {
    dispatch({ type: 'RENAME', id, name })
  }, [])

  const setOverlays = useCallback((overlays: Overlay[]) => {
    dispatch({ type: 'SET_OVERLAYS', overlays })
  }, [])

  const duplicateOverlay = useCallback((id: string) => {
    dispatch({ type: 'DUPLICATE_OVERLAY', id })
  }, [])

  return {
    overlays,
    addOverlay,
    updateOverlay,
    removeOverlay,
    reorder,
    toggleVisible,
    toggleLock,
    rename,
    setOverlays,
    duplicateOverlay,
    status,
  }
}
