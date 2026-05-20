'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { FlightRow, SeatRow, SeatClass } from '@/types/supabase'
import { formatPrice } from '@/lib/airports'
import { useFlightStore } from '@/stores/useFlightStore'
import { bookFlight } from '@/app/flights/actions'
import SeatModal from '@/components/seats/SeatModal'

type Props = {
  flight: FlightRow
  initialSeats: SeatRow[]
  userBookedSeatId?: string
  selectedClass: SeatClass
}

const CLASS_LABELS: Record<string, string> = {
  first: 'First Class',
  business: 'Business',
  economy: 'Economy',
}

const CLASS_COLORS: Record<string, string> = {
  first: 'border-amber-400 bg-amber-400/10 text-amber-300',
  business: 'border-violet-400 bg-violet-400/10 text-violet-300',
  economy: 'border-sky-400 bg-sky-400/10 text-sky-300',
}

export default function PassengerForm({
  flight,
  initialSeats,
  userBookedSeatId,
  selectedClass,
}: Props) {
  const router = useRouter()
  const {
    passengerForm,
    selectedSeat,
    setPassengerForm,
    setSelectedSeat,
    setBookingResult,
    setCurrentStep,
  } = useFlightStore()

  const [fullName, setFullName] = useState(passengerForm.fullName)
  const [passportNo, setPassportNo] = useState(passengerForm.passportNo)
  const [nationality, setNationality] = useState(passengerForm.nationality)
  const [dob, setDob] = useState(passengerForm.dob)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSeatModal, setShowSeatModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Save to store on change
  useEffect(() => {
    setPassengerForm({ fullName, passportNo, nationality, dob })
  }, [fullName, passportNo, nationality, dob, setPassengerForm])

  // Set current step
  useEffect(() => {
    setCurrentStep('passenger-form')
  }, [setCurrentStep])

  const totalPrice = flight.base_price + (selectedSeat?.extra_fee ?? 0)

  function validateForm(): boolean {
    const errs: Record<string, string> = {}
    if (!fullName.trim()) errs.fullName = 'Full name is required.'
    if (!passportNo.trim()) errs.passportNo = 'Passport number is required.'
    else if (passportNo.trim().length < 5) errs.passportNo = 'Invalid passport number.'
    if (!nationality.trim()) errs.nationality = 'Nationality is required.'
    if (!dob) errs.dob = 'Date of birth is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleOpenSeatModal() {
    if (!validateForm()) return
    setShowSeatModal(true)
  }

  function handleSeatConfirmed(seat: SeatRow) {
    setSelectedSeat(seat)
    setShowSeatModal(false)
  }

  async function handleConfirmBooking() {
    if (!selectedSeat) return
    if (!validateForm()) return

    setLoading(true)
    setSubmitError('')

    const { data, error } = await bookFlight({
      flightId: flight.id,
      seatId: selectedSeat.id,
      totalPrice,
      fullName: fullName.trim(),
      passportNo: passportNo.trim(),
      nationality: nationality.trim(),
      dob,
    })

    if (error) {
      setSubmitError(error)
      setLoading(false)
      return
    }

    if (data) {
      setBookingResult(data)
      setCurrentStep('confirmation')
      router.push('/booking/confirmation')
    }
  }

  return (
    <>
      <div className="space-y-8">
        {/* Passenger Details */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            Passenger Details
          </h2>

          <div className="glass-card p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  id="passenger-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }))
                  }}
                  className={`form-input ${errors.fullName ? 'border-error' : ''}`}
                  placeholder="As on passport"
                />
                {errors.fullName && (
                  <p className="text-error text-xs mt-1">{errors.fullName}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
                  Passport Number
                </label>
                <input
                  id="passport-number"
                  type="text"
                  value={passportNo}
                  onChange={(e) => {
                    setPassportNo(e.target.value.toUpperCase())
                    if (errors.passportNo) setErrors((prev) => ({ ...prev, passportNo: '' }))
                  }}
                  className={`form-input ${errors.passportNo ? 'border-error' : ''}`}
                  placeholder="e.g. A1234567"
                />
                {errors.passportNo && (
                  <p className="text-error text-xs mt-1">{errors.passportNo}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
                  Nationality
                </label>
                <input
                  id="nationality"
                  type="text"
                  value={nationality}
                  onChange={(e) => {
                    setNationality(e.target.value)
                    if (errors.nationality) setErrors((prev) => ({ ...prev, nationality: '' }))
                  }}
                  className={`form-input ${errors.nationality ? 'border-error' : ''}`}
                  placeholder="e.g. Indian"
                />
                {errors.nationality && (
                  <p className="text-error text-xs mt-1">{errors.nationality}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
                  Date of Birth
                </label>
                <input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value)
                    if (errors.dob) setErrors((prev) => ({ ...prev, dob: '' }))
                  }}
                  className={`form-input ${errors.dob ? 'border-error' : ''}`}
                />
                {errors.dob && (
                  <p className="text-error text-xs mt-1">{errors.dob}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Seat Selection */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
            </svg>
            Seat Selection
          </h2>

          <div className="glass-card p-4 sm:p-6">
            {selectedSeat ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="font-mono font-bold text-primary text-lg">
                      {selectedSeat.seat_number}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">Seat {selectedSeat.seat_number}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${CLASS_COLORS[selectedSeat.class]}`}>
                        {CLASS_LABELS[selectedSeat.class]}
                      </span>
                      {selectedSeat.extra_fee > 0 && (
                        <span className="text-xs text-warning">
                          +{formatPrice(selectedSeat.extra_fee)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowSeatModal(true)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Change Seat
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted text-sm mb-4">No seat selected yet</p>
                <button
                  onClick={handleOpenSeatModal}
                  className="btn-primary text-sm py-2.5 px-6"
                >
                  Choose Seat
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Price Summary */}
        <section className="glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted text-sm">Base fare</span>
            <span className="font-medium">{formatPrice(flight.base_price)}</span>
          </div>
          {selectedSeat && selectedSeat.extra_fee > 0 && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted text-sm">
                Seat upgrade ({CLASS_LABELS[selectedSeat.class]})
              </span>
              <span className="font-medium text-warning">
                +{formatPrice(selectedSeat.extra_fee)}
              </span>
            </div>
          )}
          <div className="border-t border-border pt-4 flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</span>
          </div>
        </section>

        {/* Error message */}
        {submitError && (
          <div className="bg-error/10 border border-error/30 text-error rounded-xl px-4 py-3 text-sm animate-fade-in">
            {submitError}
          </div>
        )}

        {/* Confirm booking button */}
        {selectedSeat && (
          <button
            id="confirm-booking-btn"
            onClick={handleConfirmBooking}
            disabled={loading}
            className="btn-primary w-full text-base py-4 animate-fade-in"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Confirming Booking…
              </span>
            ) : (
              `Confirm & Pay ${formatPrice(totalPrice)}`
            )}
          </button>
        )}
      </div>

      <SeatModal
        isOpen={showSeatModal}
        onClose={() => setShowSeatModal(false)}
        flight={flight}
        flightId={flight.id}
        initialSeats={initialSeats}
        userBookedSeatId={userBookedSeatId}
        selectedClass={selectedClass}
        onSeatConfirmed={handleSeatConfirmed}
      />
    </>
  )
}
