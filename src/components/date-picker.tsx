'use client'

import { useState } from 'react'
import { format, addDays, setHours, setMinutes } from 'date-fns'
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DatePicker({ onSlotSelect }: { onSlotSelect: (date: Date, time: string, partySize: number) => void }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [partySize, setPartySize] = useState(1)

  const nextWeek = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))

  // Generate dummy time slots from 12 PM to 9 PM
  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const time = setMinutes(setHours(new Date(), 12 + Math.floor(i)), (i % 2) * 30)
    return format(time, 'h:mm a')
  })

  const handleSlotSelect = (time: string) => {
    setSelectedTime(time)
    if (selectedDate) {
      onSlotSelect(selectedDate, time, partySize)
    }
  }

  return (
    <div className="mb-8">
      <div className="mb-4">
        <Label htmlFor="party-size">Party Size</Label>
        <Input
          id="party-size"
          type="number"
          min="1"
          value={partySize}
          onChange={(e) => setPartySize(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>
      <h3 className="text-xl font-semibold mb-3">Select a Date</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {nextWeek.map((date) => (
          <Button
            key={date.toISOString()}
            variant={selectedDate && date.toDateString() === selectedDate.toDateString() ? "default" : "outline"}
            onClick={() => setSelectedDate(date)}
            size="sm"
          >
            {format(date, 'MMM d')}
          </Button>
        ))}
      </div>
      <Button onClick={() => setShowCalendar(!showCalendar)} size="sm" className="mb-4">
        {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
      </Button>
      {showCalendar && (
        <div className="mb-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </div>
      )}
      {selectedDate && (
        <div>
          <h4 className="text-lg font-semibold mb-2">Available Time Slots</h4>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map((time) => (
              <Button
                key={time}
                variant={selectedTime === time ? "default" : "outline"}
                onClick={() => handleSlotSelect(time)}
                size="sm"
              >
                {time}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}