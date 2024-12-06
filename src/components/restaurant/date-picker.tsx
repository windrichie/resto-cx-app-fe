// src/components/restaurant/date-picker.tsx
'use client'

import { useState, useEffect } from 'react';
import { format, addDays, startOfDay, isBefore } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ReservationForm from './reservation-form';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface DatePickerProps {
  restaurantId: number;
  timeSlotLength: number;
  operatingHours: Record<string, string>;
  allowedBookingAdvance: number;
  tableCapacity: Record<string, number>;
}

export default function DatePicker({
  restaurantId,
  timeSlotLength,
  operatingHours,
  allowedBookingAdvance,
  tableCapacity,
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [partySize, setPartySize] = useState<number>(2);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const maxDate = addDays(new Date(), allowedBookingAdvance);

  // Function to generate time slots based on operating hours
  const generateTimeSlots = () => {
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const hours = operatingHours[dayOfWeek];

    if (!hours) {
      setTimeSlots([]);
      return;
    }

    // Implementation of time slot generation logic
    // This is a placeholder - you'll need to implement the actual logic
    const dummySlots: TimeSlot[] = [
      { start: '12:00 PM', end: '1:00 PM', available: true },
      { start: '1:00 PM', end: '2:00 PM', available: true },
      // Add more slots as needed
    ];

    setTimeSlots(dummySlots);
  };

  useEffect(() => {
    generateTimeSlots();
  }, [selectedDate, partySize]);

  return (
    <div className="space-y-4">
      <div>
        <Label>Party Size</Label>
        <Select
          value={partySize.toString()}
          onValueChange={(value) => setPartySize(parseInt(value))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select party size" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size} {size === 1 ? 'person' : 'people'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Select Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) =>
                isBefore(date, startOfDay(new Date())) ||
                isBefore(maxDate, date)
              }
            />
          </PopoverContent>
        </Popover>
      </div>

      {timeSlots.length > 0 && (
        <div>
          <Label>Available Time Slots</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {timeSlots.map((slot) => (
              <Button
                key={slot.start}
                variant={selectedSlot?.start === slot.start ? "default" : "outline"}
                onClick={() => setSelectedSlot(slot)}
                disabled={!slot.available}
                size="sm"
              >
                {slot.start}
              </Button>
            ))}
          </div>
        </div>
      )}

      {selectedSlot && (
        <ReservationForm
          selectedDate={selectedDate}
          selectedTime={selectedSlot.start}
          partySize={partySize}
          restaurantId={restaurantId}
        />
      )}
    </div>
  );
}