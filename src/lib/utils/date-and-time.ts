import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { TZDate } from '@date-fns/tz';

export function convertToUtc(date: Date, restaurantTimezone: string): Date {
    return fromZonedTime(date, restaurantTimezone);
}

export function convertToLocalTime(date: Date, restaurantTimezone: string): Date {
    return toZonedTime(date, restaurantTimezone);
}

interface TimeSlotCalculationResult {
    startDateTime: Date;
    endDateTime: Date;
}

export function calculateReservationTimes(
    date: Date,
    timeSlotStart: string,
    timeSlotLength: number,
    timezone: string
): TimeSlotCalculationResult {
    const [timeWithoutPeriod, period] = timeSlotStart.split(' ');
    const [hours, minutes] = timeWithoutPeriod.split(':');
    let hour24 = parseInt(hours);

    if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
    }

    const startDateTime = new TZDate(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hour24,
        parseInt(minutes),
        0,
        timezone
    );

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(startDateTime.getMinutes() + timeSlotLength);

    return { startDateTime, endDateTime };
}  