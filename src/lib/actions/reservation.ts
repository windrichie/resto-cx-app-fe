'use server'

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { startOfDay, endOfDay, format } from 'date-fns';
import { Reservation, ReservationForTimeSlotGen, ReservationSetting, ReservationSettingTimeSlotRange } from '@/types';
import { calculateReminderTimeStamp, calculateReservationTimes, convertTo12HourFormat, convertToUtc } from '../utils/date-and-time';
import { generateReservationMAC } from '@/lib/utils/reservation-auth';
import { sendCancellationEmail, sendCreateOrModifyReservationEmail } from './email';
import { getBaseUrl } from '../utils/common';
import { generateConfirmationCode } from '../utils/reservation';
import { Prisma, reservation_status } from '@prisma/client';


type ReservationUpdateData = {
    party_size: number;
    date: Date;
    timeslot_start: string;
    timeslot_end: string;
    status: reservation_status;
    deposit_payment_intent_id?: string;
};

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

async function getOrCreateUserId(
    email: string,
    name: string,
    phone: string,
): Promise<string> {
    // Try to find existing user with this email
    const existingUser = await prisma.users.findUnique({
        where: {
            email: email
        }
    });

    // If found, return existing user id
    if (existingUser) {
        const isNameExists = existingUser.name.includes(name);
        const isPhoneExists = existingUser.phone.includes(phone);

        // If both name and phone already exist, no need to update
        if (isNameExists && isPhoneExists) {
            return existingUser.id;
        }

        // Prepare update data only if needed
        const updateData: { name?: string[], phone?: string[] } = {};
        if (!isNameExists) {
            updateData.name = [...existingUser.name, name];
        }
        if (!isPhoneExists) {
            updateData.phone = [...existingUser.phone, phone];
        }

        // Only make the update call if there are changes
        if (Object.keys(updateData).length > 0) {
            await prisma.users.update({
                where: { id: existingUser.id },
                data: updateData
            });
        }

        return existingUser.id;
    }

    // If not found, create new user
    const newUser = await prisma.users.create({
        data: {
            email: email,
            name: [name],
            phone: [phone],
            joined_date: new Date(),
            is_business_user: false,
            is_external_cx: true,
            is_registered: false
        }
    });

    return newUser.id;
}

export async function getReservationByCode(confirmationCode: string) {
    try {
        const reservation = await prisma.reservations.findUnique({
            where: { confirmation_code: confirmationCode },
            include: {
                business_profiles: {
                    include: {
                        reservation_settings: true,
                        products: true  // Add this to include products
                    }
                }
            },
        });

        if (reservation) {
            const { business_profiles, ...rest } = reservation;

            // Transform reservation settings
            const transformedReservationSettings = business_profiles.reservation_settings.map((setting) => {
                const parsedTimeSlots = setting.available_reservation_time_slots as unknown as ReservationSettingTimeSlotRange[];

                return {
                    id: setting.id,
                    business_id: setting.business_id,
                    day_of_week: setting.day_of_week,
                    timeslot_length_minutes: setting.timeslot_length_minutes,
                    available_reservation_time_slots: parsedTimeSlots || [],
                    is_default: setting.is_default,
                    specific_date: setting.specific_date
                } as ReservationSetting;
            });

            // Transform products
            const transformedProducts = business_profiles.products.map(product => ({
                ...product,
                price: Number(product.price),
                discount: product.discount ? Number(product.discount) : null
            }));

            // Create the transformed reservation
            const transformedReservation = {
                ...rest,
                business: {
                    ...business_profiles,
                    deposit_amount: business_profiles.deposit_amount ?
                        Number(business_profiles.deposit_amount.toFixed(2)) * 100 : null,
                    reservation_settings: transformedReservationSettings,
                    products: transformedProducts
                }
            } as unknown as Reservation;

            return {
                success: true,
                reservation: transformedReservation
            };
        }

        return { success: false, error: 'Reservation not found' };
    } catch (error) {
        console.error('Error fetching reservation:', error);
        return { success: false, error: 'Failed to fetch reservation' };
    }
}


export async function getActiveReservations(
    restaurantId: string, startDate: Date, endDate: Date, restaurantTimezone: string
): Promise<GetReservationsResponse> {
    try {
        const utcStartDate = convertToUtc(startOfDay(startDate), restaurantTimezone);
        const utcEndDate = convertToUtc(endOfDay(endDate), restaurantTimezone);
        console.log('startDate: ', startDate);
        console.log('startOfDay(startDate): ', startOfDay(startDate));
        console.log('utcStartDate: ', utcStartDate);
        console.log('endDate: ', endDate);
        console.log('utcEndDate: ', utcEndDate);

        const reservations = await prisma.reservations.findMany({
            where: {
                business_id: restaurantId,
                date: {
                    gte: startOfDay(utcStartDate),
                    lte: endOfDay(utcEndDate),
                },
                status: {
                    notIn: ['cancelled']
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
    const data = {
        restaurantId: formData.get('restaurantId') as string,
        customerName: formData.get('customerName') as string,
        customerEmail: formData.get('customerEmail') as string,
        customerPhone: formData.get('customerPhone') as string,
        partySize: parseInt(formData.get('partySize') as string),
        selectedDate: formData.get('selectedDate') as string,
        selectedMonth: formData.get('selectedMonth') as string,
        selectedYear: formData.get('selectedYear') as string,
        timeSlotLengthMinutes: parseInt(formData.get('timeSlotLengthMinutes') as string),
        timeSlotStart: formData.get('timeSlotStart') as string,
        dietaryRestrictions: formData.get('dietaryRestrictions') as string,
        otherDietaryRestrictions: formData.get('otherDietaryRestrictions') as string,
        specialOccasion: formData.get('specialOccasion') as string,
        otherSpecialOccasion: formData.get('otherSpecialOccasion') as string,
        specialRequests: formData.get('specialRequests') as string,
        restaurantTimezone: formData.get('restaurantTimezone') as string,
        restaurantName: formData.get('restaurantName') as string,
        restaurantAddress: formData.get('restaurantAddress') as string,
        restaurantImages: JSON.parse(formData.get('restaurantImages') as string || '[]'),
        paymentIntentId: formData.get('paymentIntentId') as string || null
    };
    console.log('Data being passed to Prisma:', data);

    // construct selected date as Date object in UTC
    const selectedDate = new Date(Date.UTC(parseInt(data.selectedYear), parseInt(data.selectedMonth), parseInt(data.selectedDate)));
    const selectedDateStr = format(selectedDate, 'PPP'); // for email

    // retrieve the first image for use in email as thumbnail
    const restaurantThumbnail = data.restaurantImages[0] || '';
    // get customer ID
    const customerId = await getOrCreateUserId(data.customerEmail, data.customerName, data.customerPhone);

    // construct reservation slot timnigs to be put into DB
    const { startTimeHours, startTimeMinutes, endTimeHours, endTimeMinutes } = calculateReservationTimes(
        selectedDate,
        data.timeSlotStart,
        data.timeSlotLengthMinutes,
        data.restaurantTimezone
    );
    const startTime24HrString = `${startTimeHours.toString().padStart(2, '0')}:${startTimeMinutes.toString().padStart(2, '0')}`;
    const endTime24HrString = `${endTimeHours.toString().padStart(2, '0')}:${endTimeMinutes.toString().padStart(2, '0')}`;
    // get 12hr format for email
    const startTime12HrString = convertTo12HourFormat(startTime24HrString);

    // calculate timestamp for reminder email sending
    const reminder1WeekTimestampTz = calculateReminderTimeStamp(
        selectedDate,
        data.timeSlotStart,
        data.restaurantTimezone,
        7 * 24
    );
    const reminder1DayTimestampTz = calculateReminderTimeStamp(
        selectedDate,
        data.timeSlotStart,
        data.restaurantTimezone,
        1 * 24
    );

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        const confirmationCode = generateConfirmationCode();

        try {
            // First try block for database operation
            const reservation = await prisma.reservations.create({
                data: {
                    business_id: data.restaurantId,
                    customer_id: customerId,
                    customer_name: data.customerName,
                    customer_email: data.customerEmail,
                    customer_phone: data.customerPhone,
                    party_size: data.partySize,
                    date: selectedDate,
                    timeslot_start: startTime24HrString,
                    timeslot_end: endTime24HrString,
                    dietary_restrictions: data.dietaryRestrictions === 'other'
                        ? data.otherDietaryRestrictions
                        : data.dietaryRestrictions,
                    special_occasions: data.specialOccasion === 'other'
                        ? data.otherSpecialOccasion
                        : data.specialOccasion,
                    special_requests: data.specialRequests,
                    confirmation_code: confirmationCode,
                    status: reservation_status.new,
                    reminder_1_week_at: reminder1WeekTimestampTz,
                    reminder_1_week_sent: false,
                    reminder_1_day_at: reminder1DayTimestampTz,
                    reminder_1_day_sent: false,
                    ...(data.paymentIntentId && { deposit_payment_intent_id: data.paymentIntentId })
                },
            });

            // 2nd try block to Generate MAC and links
            try {
                const mac = generateReservationMAC(
                    reservation.confirmation_code,
                    reservation.customer_email!
                );

                const reservationLink = `/reservations/${reservation.confirmation_code}/${mac}`;
                const baseUrl = getBaseUrl();
                const fullReservationLink = `${baseUrl}${reservationLink}`;

                // 3rd try block for Email sending
                try {
                    await sendCreateOrModifyReservationEmail({
                        mode: 'Create',
                        to: data.customerEmail,
                        customerName: data.customerName,
                        restaurantName: data.restaurantName,
                        date: selectedDateStr,
                        time: startTime12HrString,
                        guests: data.partySize,
                        address: data.restaurantAddress,
                        reservationLink: fullReservationLink,
                        restaurantThumbnail: restaurantThumbnail,
                        restaurantTimezone: data.restaurantTimezone
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
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                // Unique constraint violation, regenerate confirmation code
                attempts++;
                continue;
            }

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

    throw new Error('Failed to generate a unique confirmation code after multiple attempts');
}

export async function updateReservation(
    prevState: State,
    formData: FormData
): Promise<State> {
    console.log('updateReservation formData: ', formData);

    const data = {
        confirmationCode: formData.get('confirmationCode') as string,
        partySize: parseInt(formData.get('partySize') as string),
        selectedDate: formData.get('selectedDate') as string,
        selectedMonth: formData.get('selectedMonth') as string,
        selectedYear: formData.get('selectedYear') as string,
        timeSlotStart: formData.get('timeSlotStart') as string,
        timeSlotLengthMinutes: parseInt(formData.get('timeSlotLengthMinutes') as string),
        restaurantTimezone: formData.get('restaurantTimezone') as string,
        restaurantName: formData.get('restaurantName') as string,
        restaurantAddress: formData.get('restaurantAddress') as string,
        customerEmail: formData.get('customerEmail') as string,
        customerName: formData.get('customerName') as string,
        restaurantImages: JSON.parse(formData.get('restaurantImages') as string || '[]'),
    };

    // construct selected date as Date object in UTC
    const selectedDate = new Date(Date.UTC(parseInt(data.selectedYear), parseInt(data.selectedMonth), parseInt(data.selectedDate)));
    const selectedDateStr = format(selectedDate, 'PPP'); // for email

    // retrieve the first image for use in email as thumbnail
    const restaurantThumbnail = data.restaurantImages[0] || '';

    const { startTimeHours, startTimeMinutes, endTimeHours, endTimeMinutes } = calculateReservationTimes(
        selectedDate,
        data.timeSlotStart,
        data.timeSlotLengthMinutes,
        data.restaurantTimezone
    );
    const startTime24HrString = `${startTimeHours.toString().padStart(2, '0')}:${startTimeMinutes.toString().padStart(2, '0')}`;
    const endTime24HrString = `${endTimeHours.toString().padStart(2, '0')}:${endTimeMinutes.toString().padStart(2, '0')}`;
    const startTime12HrString = convertTo12HourFormat(startTime24HrString);

    try {
        // First try block for database operation
        // Get payment intent ID from form data if it exists
        const depositPaymentIntentId = formData.get('paymentIntentId');

        // Prepare update data
        const updateData: ReservationUpdateData = {
            party_size: data.partySize,
            date: selectedDate,
            timeslot_start: startTime24HrString,
            timeslot_end: endTime24HrString,
            status: reservation_status.new,
        };

        // Only add deposit_payment_intent_id if it exists in form data
        if (depositPaymentIntentId) {
            updateData.deposit_payment_intent_id = String(depositPaymentIntentId)
        }

        // Update reservation with conditional payment intent
        const reservation = await prisma.reservations.update({
            where: { confirmation_code: data.confirmationCode },
            data: updateData,
            include: {
                business_profiles: true
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
                    date: selectedDateStr,
                    time: startTime12HrString,
                    guests: data.partySize,
                    address: data.restaurantAddress,
                    reservationLink: fullReservationLink,
                    restaurantThumbnail: restaurantThumbnail,
                    restaurantTimezone: data.restaurantTimezone
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
    const dateInRestaurantTz = reservation.date.toLocaleString('en-US', {
        timeZone: reservation.business.timezone,
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const startTimeIn12HrFormat = convertTo12HourFormat(reservation.timeslot_start);

    try {
        await prisma.reservations.update({
            where: { confirmation_code: reservation.confirmation_code },
            data: { status: 'cancelled' },
        });

        // Send cancellation email
        await sendCancellationEmail({
            to: reservation.customer_email!,
            customerName: reservation.customer_name!,
            restaurantName: reservation.business.name,
            date: dateInRestaurantTz,
            time: startTimeIn12HrFormat,
            guests: reservation.party_size,
            address: reservation.business.address,
            restaurantSlug: reservation.business.slug,
            restaurantThumbnail: reservation.business.images[0],
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