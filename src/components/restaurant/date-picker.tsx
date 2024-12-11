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
import { generateTimeSlots } from '@/lib/utils/reservation';
import { getReservations } from '@/lib/actions/reservation';
import { ReservationForTimeSlotGen } from '@/types';
import { convertToLocalTime } from '@/lib/utils/timezone';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface DatePickerProps {
  restaurantId: number;
  restaurantName: string;
  timeSlotLength: number;
  operatingHours: Record<string, string>;
  allowedBookingAdvance: number;
  tableCapacity: Record<string, number>;
  restaurantTimezone: string;
}

export default function DatePicker({
  restaurantId,
  restaurantName,
  timeSlotLength,
  operatingHours,
  allowedBookingAdvance,
  tableCapacity,
  restaurantTimezone
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [partySize, setPartySize] = useState<number>(2);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [allReservations, setAllReservations] = useState<ReservationForTimeSlotGen[]>([]);

  const maxDate = addDays(new Date(), allowedBookingAdvance);

  // Fetch all reservations once during component mount
  useEffect(() => {
    async function fetchAllReservations() {
      try {
        const endDate = addDays(new Date(), allowedBookingAdvance);
        const { reservations, error } = await getReservations(restaurantId, new Date(), endDate);

        if (error || !reservations) {
          console.error('Error:', error);
          return;
        }

        setAllReservations(reservations);
      } catch (error) {
        console.error('Error fetching reservations:', error);
      }
    }

    fetchAllReservations();
  }, [restaurantId, allowedBookingAdvance]);

  // Generate time slots when date or party size changes
  useEffect(() => {
    // Filter reservations for selected date
    const dateReservations = allReservations.filter(reservation => {
      // convert to restaurant time zone
      const resDateInRestaurantTz = convertToLocalTime(new Date(reservation.date), restaurantTimezone)
      // Compare only the date portion
      return startOfDay(resDateInRestaurantTz).getTime() ===
        startOfDay(selectedDate).getTime();
    });

    console.log('after date filter dateReservations: ', dateReservations);

    const slots = generateTimeSlots(
      selectedDate,
      operatingHours,
      timeSlotLength,
      dateReservations,
      tableCapacity,
      partySize,
      restaurantTimezone
    );

    setTimeSlots(slots);
  }, [selectedDate, partySize, allReservations, operatingHours, timeSlotLength, tableCapacity]);

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
          restaurantName={restaurantName}
          timeSlotLength={timeSlotLength}
          restaurantTimezone={restaurantTimezone}
        />
      )}
    </div>
  );
}