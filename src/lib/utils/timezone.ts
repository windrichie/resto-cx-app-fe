import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export function convertToUtc(date: Date, restaurantTimezone: string): Date {
    return fromZonedTime(date, restaurantTimezone);
}

export function convertToLocalTime(date: Date, restaurantTimezone: string): Date {
    return toZonedTime(date, restaurantTimezone);
}