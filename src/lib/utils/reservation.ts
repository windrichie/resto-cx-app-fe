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
    optimalTableSize?: number;
    numTables?: number;
    suitableTables?: {
        capacity: number;
        quantity: number;
    }[];
    error?: {
        code: 'NO_TABLES' | 'NO_SUITABLE_TABLE';
        message: string;
        partySize?: number;
        maxCapacity?: number;
    };
}

export function determineTableCapacity(
    partySize: number,
    tableSettings: TableSettings,
    capacityThreshold: number = 0 // Default threshold of 1 seat difference
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

    // Find the optimal capacity that can accommodate the party size
    const optimalTable = sortedTables.find(
        table => table.tableCapacity >= partySize
    );

    // If no suitable table found, return error with helpful information
    if (!optimalTable) {
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

    // Find all tables within the threshold of the optimal capacity
    const suitableTables = sortedTables.filter(table =>
        table.tableCapacity >= partySize &&
        table.tableCapacity <= optimalTable.tableCapacity + capacityThreshold
    );

    console.log('suitableTables: ', suitableTables)

    // Calculate total quantity of suitable tables
    const totalQuantity = suitableTables.reduce((sum, table) => sum + table.quantity, 0);

    // Return successful result with table details
    return {
        success: true,
        optimalTableSize: optimalTable.tableCapacity,
        numTables: totalQuantity,
        suitableTables: suitableTables.map(table => ({
            capacity: table.tableCapacity,
            quantity: table.quantity
        }))
    };
}

export function generateTimeSlots(
    selectedDate: Date,
    timeSlotLengthMinutes: number,
    existingReservations: ReservationForTimeSlotGen[],
    tableSettings: TableSettings,
    partySize: number,
    restaurantTimeZone: string,
    availableReservationTimeSlots: ReservationSettingTimeSlotRange[],
    capacityThreshold: number = 1
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
    const tableResult = determineTableCapacity(partySize, tableSettings, capacityThreshold);
    if (!tableResult.success) {
        console.log(tableResult.error?.message);
        return [];
    }
    const optimalTableSize = tableResult.optimalTableSize!;
    const tableCount = tableResult.numTables!;

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

            // console.log('\n=== Starting Table Availability Check ===');
            // console.log('Checking for party size:', partySize);
            // console.log('Initial table settings:', JSON.stringify(tableSettings.available_tables, null, 2));

            // Check existing reservations for this time slot
            const timeOverlappingReservations = existingReservations.filter(res => {
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
                    currSlotStartTime < existingSlotEndDateTime &&
                    currSlotEndTime > existingSlotStartDateTime
                );
            });

            // console.log('\nTime overlapping reservations:',
            //     timeOverlappingReservations.map(r => ({
            //         partySize: r.party_size,
            //         time: `${r.timeslot_start}-${r.timeslot_end}`
            //     }))
            // );

            // Sort overlapping reservations by party size (ascending)
            const sortedReservations = timeOverlappingReservations.sort(
                (a, b) => a.party_size - b.party_size
            );
            // console.log('\nSorted reservations by party size:',
            //     sortedReservations.map(r => ({
            //         id: r.date,
            //         partySize: r.party_size
            //     }))
            // );

            // Create a deep copy of available tables to work with
            const remainingTables = tableSettings.available_tables.map(table => ({
                ...table,
                quantity: table.quantity,
                tableTypeId: table.tableTypeId,
                tableCapacity: table.tableCapacity,
                tableTypeName: table.tableTypeName
            }));
            // console.log('\nInitial remaining tables:', remainingTables);

            // Process each existing reservation
            for (const reservation of sortedReservations) {
                // console.log(`Processing reservation of party size ${reservation.party_size}`)
                // Find suitable tables for this reservation
                const suitableTables = remainingTables.filter(table =>
                    table.tableCapacity >= reservation.party_size &&
                    table.tableCapacity <= reservation.party_size + capacityThreshold
                ).sort((a, b) => a.tableCapacity - b.tableCapacity);

                // console.log('Suitable tables found:', suitableTables);

                // Reduce table availability
                if (suitableTables.length > 0) {
                    const selectedTable = suitableTables[0];
                    // console.log('Selected table:', selectedTable);

                    const tableIndex = remainingTables.findIndex(
                        t => t.tableCapacity === selectedTable.tableCapacity
                    );

                    if (tableIndex !== -1) {
                        // console.log(`Reducing quantity for table capacity ${selectedTable.tableCapacity} from ${remainingTables[tableIndex].quantity} to ${remainingTables[tableIndex].quantity - 1}`);
                        remainingTables[tableIndex].quantity--;
                        if (remainingTables[tableIndex].quantity === 0) {
                            // console.log(`Removing table capacity ${selectedTable.tableCapacity} as quantity is 0`);
                            remainingTables.splice(tableIndex, 1);
                        }
                    }
                } else {
                    console.log('No suitable tables found for this reservation!');
                }
            }

            // console.log('Remaining tables after processing:', remainingTables);
            // Check if there are suitable tables remaining for the new reservation
            const availableTables = remainingTables.filter(table =>
                table.tableCapacity >= partySize &&
                table.tableCapacity <= partySize + capacityThreshold
            );
            const isAvailable = availableTables.length > 0;

            // console.log('\n=== Final Check ===');
            // console.log('Available tables for new reservation:', availableTables);
            // console.log('Is slot available:', availableTables.length > 0);

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

    // At the end of the function, before returning allSlots
    const uniqueSlots = allSlots.reduce((acc: TimeSlot[], current) => {
        // 1. Generate a unique key for the current slot (e.g., "11:00 AM-2:00 PM")
        const key = `${current.start}-${current.end}`;

        // 2. Check if this key already exists in our accumulator array
        const exists = acc.find(slot => `${slot.start}-${slot.end}` === key);

        // 3. Only add the slot if it doesn't exist yet
        if (!exists) {
            acc.push(current);
        }

        // 4. Return the accumulator for the next iteration
        return acc;
    }, []); // Start with empty array

    return uniqueSlots;
}

export function generateConfirmationCode(): string {
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
    const nanoid = customAlphabet(alphabet, 8);
    return nanoid();
}
