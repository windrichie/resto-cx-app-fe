'use server'

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { startOfDay, endOfDay, format } from 'date-fns';
import { Reservation, ReservationForTimeSlotGen } from '@/types';
import { calculateReservationTimes, convertToUtc } from '../utils/date-and-time';
import { generateReservationMAC } from '@/lib/utils/reservation-auth';
import { sendCancellationEmail, sendCreateOrModifyReservationEmail } from './email';
import { getBaseUrl } from '../utils/common';

const CreateReservationSchema = z.object({
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
    restaurantTimezone: z.string(),
    restaurantName: z.string(),
    restaurantAddress: z.string(),
    restaurantImages: z.array(z.string())
});

const UpdateReservationSchema = z.object({
    confirmationCode: z.string().min(1, 'Confirmation code is required'),
    partySize: z.number().min(1, 'Party size must be at least 1'),
    date: z.date(),
    timeSlotStart: z.string().min(1, 'Time slot is required'),
    timeSlotLength: z.number().min(1, 'Time slot length is required'),
    restaurantTimezone: z.string().min(1, 'Timezone is required'),
    restaurantName: z.string(),
    restaurantAddress: z.string(),
    customerName: z.string(),
    customerEmail: z.string(),
    restaurantImages: z.array(z.string())
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
    message: string;
    reservationLink?: string;
    newMac?: string;
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

export async function getReservationByCode(confirmationCode: string) {
    try {
        const reservation = await prisma.reservation.findUnique({
            where: { confirmation_code: confirmationCode },
            include: { restaurant: true },
        });
        return { success: true, reservation };
    } catch (error) {
        console.error('Error fetching reservation:', error);
        return { success: false, error: 'Failed to fetch reservation' };
    }
}

export async function getReservations(
    restaurantId: number, startDate: Date, endDate: Date, restaurantTimezone: string
): Promise<GetReservationsResponse> {
    try {
        const utcStartDate = convertToUtc(startOfDay(startDate), restaurantTimezone);
        const utcEndDate = convertToUtc(endOfDay(endDate), restaurantTimezone);
        console.log('startDate: ', startDate);
        console.log('startOfDay(startDate): ', startOfDay(startDate));
        console.log('utcStartDate: ', utcStartDate);
        console.log('endDate: ', endDate);
        console.log('utcEndDate: ', utcEndDate);

        const reservations = await prisma.reservation.findMany({
            where: {
                restaurant_id: restaurantId,
                date: {
                    gte: startOfDay(utcStartDate),
                    lte: endOfDay(utcEndDate),
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

export async function createReservation(prevState: State, formData: FormData): Promise<State> {
    console.log('createReservation formData: ', formData);
    const validatedFields = CreateReservationSchema.safeParse({
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
        restaurantTimezone: formData.get('restaurantTimezone'),
        restaurantName: formData.get('restaurantName'),
        restaurantAddress: formData.get('restaurantAddress'),
        restaurantImages: JSON.parse(formData.get('restaurantImages') as string || '[]')
    });

    if (!validatedFields.success) {
        console.error(validatedFields.error.flatten());
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Reservation.',
        } as State;
    }
    const data = validatedFields.data;
    console.log('Data being passed to Prisma:', data);

    // retrieve the first image for use in email as thumbnail
    const restaurantThumbnail = data.restaurantImages[0] || '';
    // get customer ID
    const customerId = await getOrCreateCustomerId(data.customerEmail);

    const { startDateTime, endDateTime } = calculateReservationTimes(
        data.date,
        data.timeSlotStart,
        data.timeSlotLength,
        data.restaurantTimezone
    );

    console.log('startDateTime: ', startDateTime);

    try {
        // First try block for database operation
        const reservation = await prisma.reservation.create({
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
                confirmation_code: uuidv4(),
                status: 'new',
            },
        });

        // Generate MAC and links
        try {
            const mac = generateReservationMAC(
                reservation.confirmation_code,
                reservation.customer_email!
            );

            const reservationLink = `/reservations/${reservation.confirmation_code}/${mac}`;
            const baseUrl = getBaseUrl();
            const fullReservationLink = `${baseUrl}${reservationLink}`;

            // Email sending
            try {
                await sendCreateOrModifyReservationEmail({
                    mode: 'Create',
                    to: data.customerEmail,
                    customerName: data.customerName,
                    restaurantName: data.restaurantName,
                    date: format(data.date, 'MMMM d, yyyy'),
                    time: format(startDateTime, 'h:mm a'),
                    guests: data.partySize,
                    address: data.restaurantAddress,
                    reservationLink: fullReservationLink,
                    restaurantThumbnail: restaurantThumbnail
                });

                revalidatePath(`/${data.restaurantId}`);
                return {
                    message: 'Reservation Created Successfully!',
                    reservationLink
                } as State;

            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Still return success but with a warning
                return {
                    message: 'Reservation Created Successfully (Email notification failed)',
                    reservationLink,
                    errors: 'Email notification could not be sent'
                } as State;
            }

        } catch (macError) {
            console.error('MAC generation failed:', macError);
            // This is a critical error as it affects the reservation link
            throw new Error('Failed to generate secure reservation link');
        }

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error creating reservation:', error.message);
            return {
                message: error.message.includes('secure reservation link')
                    ? 'Failed to generate reservation link'
                    : 'Database Error: Failed to Create Reservation',
                errors: { database: ['Failed to create reservation.'] }
            } as State;
        }

        console.error('Unknown error:', error);
        return {
            message: 'An unexpected error occurred while creating the reservation.',
            errors: { database: ['Failed to create reservation.'] }
        } as State;
    }
}

export async function updateReservation(
    prevState: State,
    formData: FormData
): Promise<State> {
    console.log('updateReservation formData: ', formData);

    const validatedFields = UpdateReservationSchema.safeParse({
        confirmationCode: formData.get('confirmationCode'),
        partySize: parseInt(formData.get('partySize') as string),
        date: new Date(formData.get('date') as string),
        timeSlotStart: formData.get('timeSlotStart'),
        timeSlotLength: parseInt(formData.get('timeSlotLength') as string),
        restaurantTimezone: formData.get('restaurantTimezone'),
        restaurantName: formData.get('restaurantName'),
        restaurantAddress: formData.get('restaurantAddress'),
        customerEmail: formData.get('customerEmail'),
        customerName: formData.get('customerName'),
        restaurantImages: JSON.parse(formData.get('restaurantImages') as string || '[]')
    });

    if (!validatedFields.success) {
        console.error(validatedFields.error.flatten());
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to update reservation.',
        } as State;
    }

    const data = validatedFields.data;

    // retrieve the first image for use in email as thumbnail
    const restaurantThumbnail = data.restaurantImages[0] || '';

    const { startDateTime, endDateTime } = calculateReservationTimes(
        data.date,
        data.timeSlotStart,
        data.timeSlotLength,
        data.restaurantTimezone
    );

    try {
        // First try block for database operation
        const reservation = await prisma.reservation.update({
            where: { confirmation_code: data.confirmationCode },
            data: {
                party_size: data.partySize,
                date: data.date,
                timeslot_start: startDateTime,
                timeslot_end: endDateTime,
                status: 'modified',
            },
            include: {
                restaurant: true
            }
        });

        // Generate MAC and links
        try {
            const mac = generateReservationMAC(
                reservation.confirmation_code,
                reservation.customer_email!
            );

            const reservationLink = `/reservations/${reservation.confirmation_code}/${mac}`;
            const baseUrl = getBaseUrl();
            const fullReservationLink = `${baseUrl}${reservationLink}`;

            // Email sending
            try {
                await sendCreateOrModifyReservationEmail({
                    mode: 'Modify',
                    to: data.customerEmail,
                    customerName: data.customerName,
                    restaurantName: data.restaurantName,
                    date: format(data.date, 'MMMM d, yyyy'),
                    time: format(startDateTime, 'h:mm a'),
                    guests: data.partySize,
                    address: data.restaurantAddress,
                    reservationLink: fullReservationLink,
                    restaurantThumbnail: restaurantThumbnail
                });

                revalidatePath(`/reservation/${data.confirmationCode}`);
                return {
                    message: 'Reservation Updated Successfully!',
                    reservationLink
                } as State;

            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Still return success but with a warning
                return {
                    message: 'Reservation Updated Successfully (Email notification failed)',
                    reservationLink,
                    errors: 'Email notification could not be sent'
                } as State;
            }

        } catch (macError) {
            console.error('MAC generation failed:', macError);
            // This is a critical error as it affects the reservation link
            throw new Error('Failed to generate secure reservation link');
        }

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error updating reservation:', error.message);
            return {
                message: error.message.includes('secure reservation link')
                    ? 'Failed to generate reservation link'
                    : 'Database Error: Failed to Update Reservation',
                errors: { database: ['Failed to update reservation.'] }
            } as State;
        }

        console.error('Unknown error:', error);
        return {
            message: 'An unexpected error occurred while updating the reservation.',
            errors: { database: ['Failed to update reservation.'] }
        } as State;
    }

}

export async function cancelReservation(
    reservation: Reservation
) {
    try {
        await prisma.reservation.update({
            where: { confirmation_code: reservation.confirmation_code },
            data: { status: 'cancelled' },
        });

        // Send cancellation email
        await sendCancellationEmail({
            to: reservation.customer_email!,
            customerName: reservation.customer_name!,
            restaurantName: reservation.restaurant.name,
            date: format(reservation.date, 'MMMM d, yyyy'),
            time: format(reservation.timeslot_start, 'h:mm a'),
            guests: reservation.party_size,
            address: reservation.restaurant.address,
            restaurantSlug: reservation.restaurant.slug,
            restaurantThumbnail: reservation.restaurant.images[0],
            baseUrl: getBaseUrl()
        });


        revalidatePath(`/reservation/${reservation.confirmation_code}`);
        return { success: true, message: 'Reservation Cancelled Successfully!' };
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        return {
            success: false,
            message: 'Failed to cancel reservation'
        };
    }
}