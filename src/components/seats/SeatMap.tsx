'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { SeatClass, SeatRow } from '@/types/supabase'
import { formatPrice } from '@/lib/airports'
import CabinGrid from './CabinGrid'
import SeatLegend from './SeatLegend'

const CLASS_LABELS: Record<SeatClass, string> = {
  first: 'First Class',
  business: 'Business',
  economy: 'Economy',
}

function mergeSeatUpdate(prev: SeatRow, incoming: Partial<SeatRow>): SeatRow {
  return { ...prev, ...incoming }
}

type RealtimeStatus = 'connecting' | 'connected' | 'error'

type Props = {
  flightId: string
  initialSeats: SeatRow[]
  userBookedSeatId?: string
  selectedClass: SeatClass
  isOpen: boolean
  onSeatConfirmed: (seat: SeatRow) => void
}

export default function SeatMap({
  flightId,
  initialSeats,
  userBookedSeatId,
  selectedClass,
  isOpen,
  onSeatConfirmed,
}: Props) {
  const [seats, setSeats] = useState<SeatRow[]>(initialSeats)
  const [selectedSeat, setSelectedSeat] = useState<SeatRow | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting')
  const [seatTakenMessage, setSeatTakenMessage] = useState<string | null>(null)
  const selectedSeatRef = useRef<SeatRow | null>(null)

  useEffect(() => {
    selectedSeatRef.current = selectedSeat
  }, [selectedSeat])

  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  useEffect(() => {
    if (!isOpen) return

    const channelName = `seats-${flightId}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seats',
          filter: `flight_id=eq.${flightId}`,
        },
        (payload) => {
          const incoming = payload.new as Partial<SeatRow> & { id?: string }
          if (!incoming.id) return

          setSeats((prev) => {
            const next = prev.map((s) =>
              s.id === incoming.id ? mergeSeatUpdate(s, incoming) : s
            )
            const merged = next.find((s) => s.id === incoming.id)
            const current = selectedSeatRef.current
            if (merged && current?.id === incoming.id && !merged.is_available) {
              setTimeout(() => {
                setSelectedSeat(null)
                setSeatTakenMessage(
                  'Seat just taken by another user. Please choose another.'
                )
              }, 0)
            }
            return next
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('error')
        } else {
          setRealtimeStatus('connecting')
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [flightId, isOpen, supabase])

  const handleSeatClick = useCallback((seat: SeatRow) => {
    if (!seat.is_available || userBookedSeatId === seat.id) return
    setSeatTakenMessage(null)
    setSelectedSeat(seat)
  }, [userBookedSeatId])

  const handleConfirm = useCallback(() => {
    if (!selectedSeat) return
    onSeatConfirmed(selectedSeat)
  }, [onSeatConfirmed, selectedSeat])

  const liveDotColor =
    realtimeStatus === 'connected'
      ? 'var(--success)'
      : realtimeStatus === 'error'
        ? 'var(--error)'
        : 'var(--muted)'

  const liveLabel =
    realtimeStatus === 'connected'
      ? 'Live'
      : realtimeStatus === 'error'
        ? 'Offline'
        : 'Connecting…'

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-selected-class={selectedClass}>
      {/* Status bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: liveDotColor, animation: realtimeStatus === 'connected' ? 'pulse-dot 2s ease-in-out infinite' : 'none' }}
            aria-hidden
          />
          <span className="font-medium">{liveLabel}</span>
        </div>
      </div>

      {/* Seat taken warning */}
      {seatTakenMessage && (
        <div
          className="shrink-0 px-4 py-2 text-center text-xs font-medium"
          style={{ background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)' }}
        >
          {seatTakenMessage}
        </div>
      )}

      {/* Legend */}
      <div className="shrink-0 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <SeatLegend />
      </div>

      {/* Cabin grid */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <CabinGrid
          seats={seats}
          selectedSeatId={selectedSeat?.id ?? null}
          userBookedSeatId={userBookedSeatId}
          onSeatClick={handleSeatClick}
        />
      </div>

      {/* Confirm bar */}
      <div className="shrink-0 px-4 py-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--background-dark)', boxShadow: '0 -4px 12px rgba(0,0,0,0.2)' }}>
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {selectedSeat ? (
              <>
                <p className="text-sm font-semibold">
                  Seat <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedSeat.seat_number}</span>
                  <span
                    className="ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: selectedSeat.class === 'first' ? 'rgba(245,158,11,0.15)' : selectedSeat.class === 'business' ? 'rgba(139,92,246,0.15)' : 'rgba(14,165,233,0.15)',
                      color: selectedSeat.class === 'first' ? '#f59e0b' : selectedSeat.class === 'business' ? '#8b5cf6' : '#0ea5e9',
                      border: `1px solid ${selectedSeat.class === 'first' ? 'rgba(245,158,11,0.3)' : selectedSeat.class === 'business' ? 'rgba(139,92,246,0.3)' : 'rgba(14,165,233,0.3)'}`,
                    }}
                  >
                    {CLASS_LABELS[selectedSeat.class]}
                  </span>
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Extra: {selectedSeat.extra_fee > 0 ? formatPrice(selectedSeat.extra_fee) : 'Free'}
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Select a seat on the map</p>
            )}
          </div>
        </div>
        <button
          type="button"
          disabled={!selectedSeat}
          onClick={handleConfirm}
          className="btn-primary w-full py-3 text-sm"
        >
          Confirm Seat
        </button>
      </div>
    </div>
  )
}
