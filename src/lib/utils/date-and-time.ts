import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { TZDate } from '@date-fns/tz';

export function convertToUtc(date: Date, restaurantTimezone: string): Date {
    return fromZonedTime(date, restaurantTimezone);
}

export function convertToLocalTime(date: Date, restaurantTimezone: string): Date {
    return toZonedTime(date, restaurantTimezone);
}

interface TimeSlotCalculationResult {
    startTimeHours: string;
    startTimeMinutes: string;
    endTimeHours: string;
    endTimeMinutes: string;
}

export function calculateReservationTimes(
    date: Date,
    timeSlotStart: string,
    timeSlotLengthMinutes: number,
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
    const endDateTime = new TZDate(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hour24,
        parseInt(minutes),
        0,
        timezone
    );

    endDateTime.setMinutes(startDateTime.getMinutes() + timeSlotLengthMinutes);

    // console.log(`startDateTime.getHours: ${startDateTime.getHours()}`);
    // console.log(`startDateTime.getMinutes: ${startDateTime.getMinutes()}`);
    // console.log(`endDateTime.getHours: ${endDateTime.getHours()}`);
    // console.log(`endDateTime.getMinutes: ${endDateTime.getMinutes()}`);

    return {
        startTimeHours: String(startDateTime.getHours()).padStart(2, '0'),
        startTimeMinutes: String(startDateTime.getMinutes()).padStart(2, '0'),
        endTimeHours: String(endDateTime.getHours()).padStart(2, '0'),
        endTimeMinutes: String(endDateTime.getMinutes()).padStart(2, '0')
    }
}

export function getTimezoneOffsetMinutes(timezone: string): number {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const offsetMinutes = tzDate.getTime() - utcDate.getTime();
    return offsetMinutes / (1000 * 60) as number;
}

export function convertTo12HourFormat(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const adjustedHours = hours % 12 || 12; // Convert 0 to 12 for midnight
    return `${adjustedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function convertTo24HourFormat(time: string): string {
    const [timePart, period] = time.split(' ');
    const [hoursStr, minutesStr] = timePart.split(':');
    let hours = Number(hoursStr);
    const minutes = Number(minutesStr);

    if (period.toLowerCase() === 'pm' && hours !== 12) {
        hours += 12;
    } else if (period.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}