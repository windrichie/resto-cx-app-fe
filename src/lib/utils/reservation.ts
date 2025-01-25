// src/lib/utils/reservation.ts
import { addMinutes, parse, format, subMinutes } from 'date-fns';
import { TimeSlot, ReservationForTimeSlotGen } from '@/types';
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
    reservationStartTime: string,
    reservationEndTime: string
): TimeSlot[] {

    console.log(`reservationStartTime: ${reservationStartTime}`);
    console.log(`reservationEndTime: ${reservationEndTime} `);
    console.log(`selectedDate: ${selectedDate} `);
    console.log(`selectedDate.getFullYear: ${selectedDate.getFullYear()} `);
    console.log(`selectedDate.getMonth: ${selectedDate.getMonth()} `);
    console.log(`selectedDate.getDate: ${selectedDate.getDate()} `);

    // calculate the offset from restaurant TZ to UTC to be used later
    const restaurantTimeZoneOffsetMinutes = getTimezoneOffsetMinutes(restaurantTimeZone);
    console.log(`restaurantTimeZoneOffsetMinutes: ${restaurantTimeZoneOffsetMinutes}`);

    const [reservationStartTimeHours, reservationStartTimeMinutes] = reservationStartTime.split(':').map(Number);
    // create a new Date object that take into account the timezone offset
    const reservationStartTimeDateTimeBeforeTZOffset = new Date(Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        reservationStartTimeHours,
        reservationStartTimeMinutes
    ));
    const reservationStartTimeDateTimeAfterTZOffset = subMinutes(reservationStartTimeDateTimeBeforeTZOffset, restaurantTimeZoneOffsetMinutes);
    // console.log(`reservationStartTimeDateTimeBeforeTZOffset: ${reservationStartTimeDateTimeBeforeTZOffset}`);
    console.log(`reservationStartTimeDateTimeAfterTZOffset: ${reservationStartTimeDateTimeAfterTZOffset}`);

    // do the same for reservationEndTime
    const [reservationEndTimeHours, reservationEndTimeMinutes] = reservationEndTime.split(':').map(Number);
    // create a new Date object that take into account the timezone offset
    const reservationEndTimeDateTimeBeforeTZOffset = new Date(Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        reservationEndTimeHours,
        reservationEndTimeMinutes
    ));
    const reservationEndTimeDateTimeAfterTZOffset = subMinutes(reservationEndTimeDateTimeBeforeTZOffset, restaurantTimeZoneOffsetMinutes);
    // console.log(`reservationStartTimeDateTimeBeforeTZOffset: ${reservationStartTimeDateTimeBeforeTZOffset}`);
    console.log(`reservationEndTimeDateTimeAfterTZOffset: ${reservationEndTimeDateTimeAfterTZOffset}`);

    // Get current time
    const currentTime = new Date();

    // Find suitable table
    const tableResult = determineTableCapacity(partySize, tableSettings);
    console.log('Table capacity result:', tableResult);

    if (!tableResult.success) {
        console.error(tableResult.error?.message);
        return []; // Return empty array if no suitable tables found
    }
    // Destructure capacity and quantity from successful result
    const tableSize = tableResult.capacity!;
    const tableCount = tableResult.quantity!;

    const slots: TimeSlot[] = [];
    let currSlotStartTime = reservationStartTimeDateTimeAfterTZOffset;

    while (currSlotStartTime < reservationEndTimeDateTimeAfterTZOffset) {
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

        // Check existing reservations for this time slot
        const overlappingReservations = existingReservations.filter(res => {

            // create a Date time object for existing reservation time slot with the time zone in mind
            const [existingResSlotStartHours, existingResSlotStartMinutes] = res.timeslot_start.split(':').map(Number);
            // create a new Date object that take into account the timezone offset
            const existingSlotStartDateTimeBeforeTZOffset = new Date(Date.UTC(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate(),
                existingResSlotStartHours,
                existingResSlotStartMinutes
            ));
            const existingSlotStartDateTimeAfterTZOffset = subMinutes(existingSlotStartDateTimeBeforeTZOffset, restaurantTimeZoneOffsetMinutes);
            console.log(`existingSlotStartDateTimeAfterTZOffset: ${existingSlotStartDateTimeAfterTZOffset}`);

            // create a Date time object for existing reservation time slot with the time zone in mind
            const [existingResSlotEndHours, existingResSlotEndMinutes] = res.timeslot_end.split(':').map(Number);
            // create a new Date object that take into account the timezone offset
            const existingSlotEndDateTimeBeforeTZOffset = new Date(Date.UTC(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate(),
                existingResSlotEndHours,
                existingResSlotEndMinutes
            ));
            const existingSlotEndDateTimeAfterTZOffset = subMinutes(existingSlotEndDateTimeBeforeTZOffset, restaurantTimeZoneOffsetMinutes);
            console.log(`existingSlotStartDateTimeAfterTZOffset: ${existingSlotEndDateTimeAfterTZOffset}`);

            // // convert reservation timeslots to restaurant time zone
            // const existingResSlotStartRestaurantTz = convertToLocalTime(res.timeslot_start, restaurantTimeZone);
            // const existingResSlotEndRestaurantTz = convertToLocalTime(res.timeslot_end, restaurantTimeZone);

            // Debug logging
            console.log('Checking reservation:', {
                resStart: existingSlotStartDateTimeAfterTZOffset,
                resEnd: existingSlotEndDateTimeAfterTZOffset,
                resPartySize: res.party_size,
                tableSize,
                currSlotStartTime: currSlotStartTime,
                currSlotEndTime: currSlotEndTime,
                isPartySmallEnough: res.party_size <= tableSize,
                isSlotBeforeResEnd: currSlotStartTime < existingSlotEndDateTimeAfterTZOffset,
                isSlotAfterResStart: currSlotEndTime > existingSlotStartDateTimeAfterTZOffset
            });

            return (
                res.party_size <= tableSize && // Only count reservations using same or smaller table
                currSlotStartTime < existingSlotEndDateTimeAfterTZOffset &&
                currSlotEndTime > existingSlotStartDateTimeAfterTZOffset
            );
        });

        console.log('overlappingReservations: ', overlappingReservations);

        // Slot is available if there are fewer reservations than tables
        const isAvailable = overlappingReservations.length < tableCount;

        slots.push({
            start: format(currSlotStartTime, 'h:mm aa'),
            end: format(currSlotEndTime, 'h:mm aa'),
            available: isAvailable
        });

        currSlotStartTime = currSlotEndTime;
    }

    return slots;
}

export function generateConfirmationCode(): string {
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
    const nanoid = customAlphabet(alphabet, 8);
    return nanoid();
}
