export type OverlayType = 'tikfinity' | 'vdo' | 'generic';

export interface Overlay {
  id: string;
  name: string;
  url: string;
  type: OverlayType;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

export interface LayoutPreset {
  id: string;
  name: string;
  overlays: Overlay[];
  createdAt: string;
}

export interface StreamState {
  overlays: Overlay[];
  updatedAt: string;
}

export type OverlayAction =
  | { type: 'SET_OVERLAYS'; overlays: Overlay[] }
  | { type: 'ADD_OVERLAY'; overlay: Overlay }
  | { type: 'UPDATE_OVERLAY'; id: string; changes: Partial<Overlay> }
  | { type: 'REMOVE_OVERLAY'; id: string }
  | { type: 'DUPLICATE_OVERLAY'; id: string }
  | { type: 'REORDER'; fromIndex: number; toIndex: number }
  | { type: 'TOGGLE_VISIBLE'; id: string }
  | { type: 'TOGGLE_LOCK'; id: string }
  | { type: 'RENAME'; id: string; name: string };
