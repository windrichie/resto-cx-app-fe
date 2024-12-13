// src/lib/utils/reservation.ts
import { addMinutes, parse, format } from 'date-fns';
import { TimeSlot, ReservationForTimeSlotGen } from '@/types';
import { convertToLocalTime } from './date-and-time';

export function determineTableCapacity(
    partySize: number,
    tableCapacity: Record<string, number>
): [number, number] | null {
    // Convert table_capacity keys to numbers and sort them
    const sortedCapacities = Object.entries(tableCapacity)
        .map(([key, value]) => [parseInt(key.split('-')[0]), value])
        .sort(([a], [b]) => (a as number) - (b as number));

    console.log('sortedCapacities: ', sortedCapacities);

    // Find the smallest table that can accommodate the party size
    for (const [capacity, count] of sortedCapacities) {
        if (partySize <= capacity) {
            return [capacity, count as number];
        }
    }

    return null;
}

export function generateTimeSlots(
    selectedDate: Date,
    operatingHours: Record<string, string>,
    timeSlotLength: number,
    existingReservations: ReservationForTimeSlotGen[],
    tableCapacity: Record<string, number>,
    partySize: number,
    restaurantTimeZone: string
): TimeSlot[] {
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const hours = operatingHours[dayOfWeek];

    if (!hours) return [];

    const [startStr, endStr] = hours.split(' - ');

    // Parse operating hours for the selected date
    const startTime = parse(startStr, 'h:mm aa', selectedDate);
    const endTime = parse(endStr, 'h:mm aa', selectedDate);

    // Get current time
    const currentTime = new Date();

    // Find suitable table
    const suitableTable = determineTableCapacity(partySize, tableCapacity);
    if (!suitableTable) return [];

    const [tableSize, tableCount] = suitableTable;

    const slots: TimeSlot[] = [];
    let slotStartTime = startTime;

    while (slotStartTime < endTime) {
        const slotEndTime = addMinutes(slotStartTime, timeSlotLength);

        // Skip slots that are in the past
        if (slotEndTime <= currentTime) {
            slotStartTime = slotEndTime;
            continue;
        }

        console.log('Existing Reservations:', existingReservations.map(res => ({
            start: res.timeslot_start,
            end: res.timeslot_end,
            partySize: res.party_size
        })));

        // Check existing reservations for this time slot
        const overlappingReservations = existingReservations.filter(res => {

            // convert reservation timeslots to restaurant time zone
            const resTimeslotStartRestaurantTz = convertToLocalTime(res.timeslot_start, restaurantTimeZone);
            const resTimeslotEndRestaurantTz = convertToLocalTime(res.timeslot_end, restaurantTimeZone);

            // Debug logging
            console.log('Checking reservation:', {
                resStart: resTimeslotStartRestaurantTz,
                resEnd: resTimeslotEndRestaurantTz,
                resPartySize: res.party_size,
                tableSize,
                slotStartTime,
                slotEndTime,
                isPartySmallEnough: res.party_size <= tableSize,
                isSlotBeforeResEnd: format(slotStartTime, 'HH:mm') < format(resTimeslotEndRestaurantTz, 'HH:mm'),
                isSlotAfterResStart: format(slotEndTime, 'HH:mm') > format(resTimeslotStartRestaurantTz, 'HH:mm')
            });

            return (
                res.party_size <= tableSize && // Only count reservations using same or smaller table
                format(slotStartTime, 'HH:mm') < format(resTimeslotEndRestaurantTz, 'HH:mm') &&
                format(slotEndTime, 'HH:mm') > format(resTimeslotStartRestaurantTz, 'HH:mm')
            );
        });

        console.log('overlappingReservations: ', overlappingReservations);

        // Slot is available if there are fewer reservations than tables
        const isAvailable = overlappingReservations.length < tableCount;

        slots.push({
            start: format(slotStartTime, 'h:mm aa'),
            end: format(slotEndTime, 'h:mm aa'),
            available: isAvailable
        });

        slotStartTime = slotEndTime;
    }

    return slots;
}