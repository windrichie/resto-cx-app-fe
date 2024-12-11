'use server'

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { startOfDay, endOfDay } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { ReservationForTimeSlotGen } from '@/types';
import RestaurantDetails from '@/components/restaurant-details';

const ReservationSchema = z.object({
    restaurantId: z.number(),
    customerName: z.string().min(1, 'Name is required'),
    customerEmail: z.string().email('Invalid email address'),
    customerPhone: z.string().min(8, 'Invalid phone number'),
    partySize: z.number().min(1),
    date: z.date(),
    timeSlotLength: z.number(),
    timeSlotStart: z.string(),
    dietaryRestrictions: z.string().optional(),
    otherDietaryRestrictions: z.string().optional(),
    specialOccasion: z.string().optional(),
    otherSpecialOccasion: z.string().optional(),
    specialRequests: z.string().optional(),
    restaurantTimezone: z.string()
});

export type State = {
    errors?: {
        customerName?: string[];
        customerEmail?: string[];
        customerPhone?: string[];
        dietaryRestrictions?: string[];
        specialOccasion?: string[];
        specialRequests?: string[];
    };
    message?: string | null;
};

interface GetReservationsResponse {
    reservations: ReservationForTimeSlotGen[];
    error?: string;
}

async function getOrCreateCustomerId(email: string): Promise<string> {
    // Try to find existing reservation with this email
    const existingReservation = await prisma.reservation.findFirst({
        where: {
            customer_email: email
        },
        select: {
            customer_id: true
        }
    });

    // If found, return existing customer_id
    if (existingReservation) {
        return existingReservation.customer_id;
    }

    // If not found, generate new UUID
    return uuidv4();
}

export async function createReservation(prevState: State, formData: FormData) {
    console.log(formData);
    const validatedFields = ReservationSchema.safeParse({
        restaurantId: parseInt(formData.get('restaurantId') as string),
        customerName: formData.get('customerName'),
        customerEmail: formData.get('customerEmail'),
        customerPhone: formData.get('customerPhone'),
        partySize: parseInt(formData.get('partySize') as string),
        date: new Date(formData.get('date') as string),
        timeSlotLength: parseInt(formData.get('timeSlotLength') as string),
        timeSlotStart: formData.get('timeSlotStart'),
        dietaryRestrictions: formData.get('dietaryRestrictions'),
        otherDietaryRestrictions: formData.get('otherDietaryRestrictions'),
        specialOccasion: formData.get('specialOccasion'),
        otherSpecialOccasion: formData.get('otherSpecialOccasion'),
        specialRequests: formData.get('specialRequests'),
        restaurantTimezone: formData.get('restaurantTimezone')
    });

    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten())
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Reservation.',
        };
    }

    const data = validatedFields.data;
    console.log('Data being passed to Prisma:', data);

    const customerId = await getOrCreateCustomerId(data.customerEmail);

    // Calculate reservation start and end times with the actual date
    const reservationDate = data.date;
    const [timeWithoutPeriod, period] = data.timeSlotStart.split(' ');
    const [hours, minutes] = timeWithoutPeriod.split(':');
    let hour24 = parseInt(hours);

    if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
    }

    const startDateTime = new TZDate(
        reservationDate.getFullYear(),
        reservationDate.getMonth(),
        reservationDate.getDate(),
        hour24,
        parseInt(minutes),
        0,
        data.restaurantTimezone
    )
    console.log('startDateTime: ', startDateTime);

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(startDateTime.getMinutes() + data.timeSlotLength);

    try {
        await prisma.reservation.create({
            data: {
                restaurant_id: data.restaurantId,
                customer_id: customerId,
                customer_name: data.customerName,
                customer_email: data.customerEmail,
                customer_phone: data.customerPhone,
                party_size: data.partySize,
                date: data.date,
                timeslot_start: startDateTime,
                timeslot_end: endDateTime,
                dietary_restrictions: data.dietaryRestrictions === 'other'
                    ? data.otherDietaryRestrictions
                    : data.dietaryRestrictions,
                special_occasions: data.specialOccasion === 'other'
                    ? data.otherSpecialOccasion
                    : data.specialOccasion,
                special_requests: data.specialRequests,
                status: 'new',
            },
        });

        revalidatePath(`/restaurants/${data.restaurantId}`);
        return { message: 'Reservation Created Successfully!' };
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error message:', error.message);
        } else {
            console.error('Unknown error:', error);
        }

        return {
            message: 'Database Error: Failed to Create Reservation.',
        };
    }
}

export async function getReservations(
    restaurantId: number, startDate: Date, endDate: Date
): Promise<GetReservationsResponse> {
    try {
        const reservations = await prisma.reservation.findMany({
            where: {
                restaurant_id: restaurantId,
                date: {
                    gte: startOfDay(startDate),
                    lte: endOfDay(endDate),
                },
                status: {
                    in: ['new', 'confirmed']
                }
            },
            select: {
                date: true,
                timeslot_start: true,
                timeslot_end: true,
                party_size: true,
            },
            orderBy: {
                timeslot_start: 'asc'
            }
        }) as ReservationForTimeSlotGen[];

        console.log('prisma reservations: ', reservations);

        return { reservations };
    } catch (error) {
        console.error('Error fetching reservations:', error);
        return { reservations: [], error: 'Failed to fetch reservations' };
    }
}

