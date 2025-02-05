// src/lib/utils/reservation.ts
import { addMinutes, parse, format, subMinutes } from 'date-fns';
import { TimeSlot, ReservationForTimeSlotGen, ReservationSettingTimeSlotRange } from '@/types';
import { convertToLocalTime, getTimezoneOffsetMinutes } from './date-and-time';
import { customAlphabet } from 'nanoid';


interface TableType {
    quantity: number;
    tableTypeId: string;
    tableCapacity: number;
    tableTypeName: string;
}
interface TableSettings {
    available_tables: TableType[];
}
interface TableType {
    quantity: number;
    tableTypeId: string;
    tableCapacity: number;
    tableTypeName: string;
}
interface TableSettings {
    available_tables: TableType[];
}
interface TableCapacityResult {
    success: boolean;
    capacity?: number;
    quantity?: number;
    error?: {
        code: 'NO_TABLES' | 'NO_SUITABLE_TABLE';
        message: string;
        partySize?: number;
        maxCapacity?: number;
    };
}

export function determineTableCapacity(
    partySize: number,
    tableSettings: TableSettings
): TableCapacityResult {
    // Guard clause for empty or invalid table settings
    if (!tableSettings?.available_tables?.length) {
        return {
            success: false,
            error: {
                code: 'NO_TABLES',
                message: 'No tables are configured for this restaurant'
            }
        };
    }

    // Sort available tables by capacity (ascending)
    const sortedTables = [...tableSettings.available_tables]
        .sort((a, b) => a.tableCapacity - b.tableCapacity);

    // Find the first table that can accommodate the party size
    const suitableTable = sortedTables.find(
        table => table.tableCapacity >= partySize
    );

    // If no suitable table found, return error with helpful information
    if (!suitableTable) {
        const maxCapacity = Math.max(...sortedTables.map(t => t.tableCapacity));
        return {
            success: false,
            error: {
                code: 'NO_SUITABLE_TABLE',
                message: `No table available for party size of ${partySize}. Maximum capacity is ${maxCapacity}`,
                partySize,
                maxCapacity
            }
        };
    }

    // Return successful result with table details
    return {
        success: true,
        capacity: suitableTable.tableCapacity,
        quantity: suitableTable.quantity
    };
}

export function generateTimeSlots(
    selectedDate: Date,
    timeSlotLengthMinutes: number,
    existingReservations: ReservationForTimeSlotGen[],
    tableSettings: TableSettings,
    partySize: number,
    restaurantTimeZone: string,
    availableReservationTimeSlots: ReservationSettingTimeSlotRange[]
): TimeSlot[] {

    // console.log(`availableReservationTimeSlots: ${availableReservationTimeSlots}`);
    // console.log(`selectedDate: ${selectedDate} `);
    // console.log(`selectedDate.getFullYear: ${selectedDate.getFullYear()} `);
    // console.log(`selectedDate.getMonth: ${selectedDate.getMonth()} `);
    // console.log(`selectedDate.getDate: ${selectedDate.getDate()} `);
    // calculate the offset from restaurant TZ to UTC
    const restaurantTimeZoneOffsetMinutes = getTimezoneOffsetMinutes(restaurantTimeZone);

    // Get current time
    const currentTime = new Date();

    // Find suitable table
    const tableResult = determineTableCapacity(partySize, tableSettings);
    if (!tableResult.success) {
        console.error(tableResult.error?.message);
        return [];
    }
    const tableSize = tableResult.capacity!;
    const tableCount = tableResult.quantity!;

    // Generate slots for each time range
    const allSlots: TimeSlot[] = [];

    for (const timeRange of availableReservationTimeSlots) {
        const [startHours, startMinutes] = timeRange.start_time.split(':').map(Number);
        const [endHours, endMinutes] = timeRange.end_time.split(':').map(Number);

        // Create datetime objects with timezone offset
        const rangeStartDateTimeBeforeTZOffset = new Date(Date.UTC(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            startHours,
            startMinutes
        ));
        const rangeStartDateTime = subMinutes(rangeStartDateTimeBeforeTZOffset, restaurantTimeZoneOffsetMinutes);

        const rangeEndDateTimeBeforeTZOffset = new Date(Date.UTC(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            endHours,
            endMinutes
        ));
        const rangeEndDateTime = subMinutes(rangeEndDateTimeBeforeTZOffset, restaurantTimeZoneOffsetMinutes);

        let currSlotStartTime = rangeStartDateTime;

        while (currSlotStartTime < rangeEndDateTime) {
            const currSlotEndTime = addMinutes(currSlotStartTime, timeSlotLengthMinutes);

            // Skip slots that are in the past
            if (currSlotEndTime <= currentTime) {
                currSlotStartTime = currSlotEndTime;
                continue;
            }

            console.log('Existing Reservations:', existingReservations.map(res => ({
                start: res.timeslot_start,
                end: res.timeslot_end,
                partySize: res.party_size
            })));

            // Skip slots that end after the rangeEndDateTime
            if (currSlotEndTime > rangeEndDateTime) {
                currSlotStartTime = currSlotEndTime;
                continue;
            }

            // Check existing reservations for this time slot
            const overlappingReservations = existingReservations.filter(res => {
                const [existingResSlotStartHours, existingResSlotStartMinutes] = res.timeslot_start.split(':').map(Number);
                const [existingResSlotEndHours, existingResSlotEndMinutes] = res.timeslot_end.split(':').map(Number);

                const existingSlotStartDateTimeBeforeTZOffset = new Date(Date.UTC(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate(),
                    existingResSlotStartHours,
                    existingResSlotStartMinutes
                ));
                const existingSlotStartDateTime = subMinutes(existingSlotStartDateTimeBeforeTZOffset, restaurantTimeZoneOffsetMinutes);

                const existingSlotEndDateTimeBeforeTZOffset = new Date(Date.UTC(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate(),
                    existingResSlotEndHours,
                    existingResSlotEndMinutes
                ));
                const existingSlotEndDateTime = subMinutes(existingSlotEndDateTimeBeforeTZOffset, restaurantTimeZoneOffsetMinutes);

                // // convert reservation timeslots to restaurant time zone
                // const existingResSlotStartRestaurantTz = convertToLocalTime(res.timeslot_start, restaurantTimeZone);
                // const existingResSlotEndRestaurantTz = convertToLocalTime(res.timeslot_end, restaurantTimeZone);

                // Debug logging
                // console.log('Checking reservation:', {
                //     resStart: existingSlotStartDateTime,
                //     resEnd: existingSlotEndDateTime,
                //     resPartySize: res.party_size,
                //     tableSize,
                //     currSlotStartTime: currSlotStartTime,
                //     currSlotEndTime: currSlotEndTime,
                //     isPartySmallEnough: res.party_size <= tableSize,
                //     isSlotBeforeResEnd: currSlotStartTime < existingSlotEndDateTime,
                //     isSlotAfterResStart: currSlotEndTime > existingSlotStartDateTime
                // });

                return (
                    res.party_size <= tableSize && // Only count reservations using same or smaller table
                    currSlotStartTime < existingSlotEndDateTime &&
                    currSlotEndTime > existingSlotStartDateTime
                );
            });

            console.log('overlappingReservations: ', overlappingReservations);

            // Slot is available if there are fewer reservations than tables
            const isAvailable = overlappingReservations.length < tableCount;

            // Convert time to restaurant's local timezone
            const currSlotStartTimeInRestaurantTz = convertToLocalTime(currSlotStartTime, restaurantTimeZone);
            const currSlotEndTimeInRestaurantTz = convertToLocalTime(currSlotEndTime, restaurantTimeZone);

            allSlots.push({
                start: format(currSlotStartTimeInRestaurantTz, 'h:mm aa'),
                end: format(currSlotEndTimeInRestaurantTz, 'h:mm aa'),
                available: isAvailable
            });

            currSlotStartTime = currSlotEndTime;
        }
    }

    return allSlots;
}

export function generateConfirmationCode(): string {
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
    const nanoid = customAlphabet(alphabet, 8);
    return nanoid();
}
