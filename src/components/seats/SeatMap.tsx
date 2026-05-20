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

const CLASS_BADGE: Record<SeatClass, string> = {
  first: 'bg-amber-100 text-amber-900 border-amber-300',
  business: 'bg-violet-100 text-violet-900 border-violet-300',
  economy: 'bg-sky-100 text-sky-900 border-sky-300',
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

  const liveDot =
    realtimeStatus === 'connected'
      ? 'bg-green-500'
      : realtimeStatus === 'error'
        ? 'bg-red-500'
        : 'bg-gray-400'

  const liveLabel =
    realtimeStatus === 'connected'
      ? 'Live'
      : realtimeStatus === 'error'
        ? 'Offline'
        : 'Connecting…'

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-selected-class={selectedClass}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <span className={`h-2 w-2 shrink-0 rounded-full ${liveDot}`} aria-hidden />
          <span className="font-medium">{liveLabel}</span>
        </div>
      </div>

      {seatTakenMessage && (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-center text-xs font-medium text-red-800">
          {seatTakenMessage}
        </div>
      )}

      <div className="shrink-0 border-b border-gray-200 px-4 py-3">
        <SeatLegend />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <CabinGrid
          seats={seats}
          selectedSeatId={selectedSeat?.id ?? null}
          userBookedSeatId={userBookedSeatId}
          onSeatClick={handleSeatClick}
        />
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {selectedSeat ? (
              <>
                <p className="text-sm font-semibold text-gray-900">
                  Seat <span className="font-mono">{selectedSeat.seat_number}</span>
                  <span
                    className={`ml-2 inline-block rounded border px-2 py-0.5 text-[10px] font-semibold ${CLASS_BADGE[selectedSeat.class]}`}
                  >
                    {CLASS_LABELS[selectedSeat.class]}
                  </span>
                </p>
                <p className="text-xs text-gray-600">
                  Extra: {selectedSeat.extra_fee > 0 ? formatPrice(selectedSeat.extra_fee) : 'Free'}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Select a seat on the map</p>
            )}
          </div>
        </div>
        <button
          type="button"
          disabled={!selectedSeat}
          onClick={handleConfirm}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition enabled:hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
        >
          Confirm Seat
        </button>
      </div>
    </div>
  )
}
