import { useEffect, useRef, useCallback, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { getChannel } from '../lib/supabase'
import { StreamState } from '../types/overlay'

export type SyncRole = 'controller' | 'receiver'
export type SyncStatus = 'connecting' | 'connected' | 'error'

interface UseSyncOptions {
  streamId: string
  role: SyncRole
  onRemoteState: (state: StreamState) => void
  onStateRequested?: () => void
}

export function useSupabaseSync({ streamId, role, onRemoteState, onStateRequested }: UseSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const onRemoteStateRef = useRef(onRemoteState)
  const onStateRequestedRef = useRef(onStateRequested)
  onRemoteStateRef.current = onRemoteState
  onStateRequestedRef.current = onStateRequested

  const [status, setStatus] = useState<SyncStatus>('connecting')

  useEffect(() => {
    if (!streamId) return

    setStatus('connecting')
    const channel = getChannel(streamId)
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'state-update' }, ({ payload }: { payload: StreamState }) => {
        onRemoteStateRef.current(payload)
      })
      .on('broadcast', { event: 'state-request' }, () => {
        if (role === 'controller') {
          onStateRequestedRef.current?.()
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected')
          if (role === 'receiver') {
            channel.send({ type: 'broadcast', event: 'state-request', payload: {} })
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setStatus('error')
        }
      })

    return () => {
      channel.unsubscribe()
      channelRef.current = null
      setStatus('connecting')
    }
  }, [streamId, role])

  const broadcast = useCallback(
    (state: StreamState) => {
      if (role !== 'controller') return
      channelRef.current?.send({
        type: 'broadcast',
        event: 'state-update',
        payload: state,
      })
    },
    [role]
  )

  return { broadcast, status }
}
