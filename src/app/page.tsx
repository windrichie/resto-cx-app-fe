'use client'

import { useState } from 'react'
import RestaurantDetails from '../components/restaurant-details'
import DatePicker from '../components/date-picker'
import ReservationForm from '../components/reservation-form'

export default function Home() {
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string; partySize: number } | null>(null)

  const handleSlotSelect = (date: Date, time: string, partySize: number) => {
    setSelectedSlot({ date, time, partySize })
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Restaurant Reservation</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <DatePicker onSlotSelect={handleSlotSelect} />
          {selectedSlot && (
            <ReservationForm
              selectedDate={selectedSlot.date}
              selectedTime={selectedSlot.time}
              partySize={selectedSlot.partySize}
            />
          )}
        </div>
        <RestaurantDetails />
      </div>
    </main>
  )
}

