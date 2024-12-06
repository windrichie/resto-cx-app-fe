'use server'

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

const ReservationSchema = z.object({
    restaurantId: z.number(),
    customerName: z.string().min(1, 'Name is required'),
    customerEmail: z.string().email('Invalid email address'),
    customerPhone: z.string().min(8, 'Invalid phone number'),
    partySize: z.number().min(1),
    date: z.date(),
    timeSlotStart: z.string(),
    dietaryRestrictions: z.string().optional(),
    otherDietaryRestrictions: z.string().optional(),
    specialOccasion: z.string().optional(),
    otherSpecialOccasion: z.string().optional(),
    specialRequests: z.string().optional(),
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
        timeSlotStart: formData.get('timeSlotStart'),
        dietaryRestrictions: formData.get('dietaryRestrictions'),
        otherDietaryRestrictions: formData.get('otherDietaryRestrictions'),
        specialOccasion: formData.get('specialOccasion'),
        otherSpecialOccasion: formData.get('otherSpecialOccasion'),
        specialRequests: formData.get('specialRequests'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Reservation.',
        };
    }

    const data = validatedFields.data;
    console.log('Data being passed to Prisma:', data);

    const customerId = await getOrCreateCustomerId(data.customerEmail);

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
                timeslot_start: new Date(`${data.date.toDateString()} ${data.timeSlotStart}`),
                timeslot_end: new Date(`${data.date.toDateString()} ${data.timeSlotStart}`), // Calculate based on slot length
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