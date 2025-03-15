import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { sendReservationReminderEmail } from '@/lib/actions/email';
import { format } from 'date-fns';
import { convertTo12HourFormat } from '@/lib/utils/date-and-time';
import { generateReservationMAC } from '@/lib/utils/reservation-auth';
import { getBaseUrl } from '@/lib/utils/common';


export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const reminderType = searchParams.get('type') as '1_week' | '1_day';

    console.log(`Starting cron job for ${reminderType} reminder.`);

    let advanceTime = 0;
    try {
        if (reminderType === '1_week') {
            advanceTime = 5 * 24 * 60 * 60 * 1000; // reservation is at least 5 days from now
        } else if (reminderType === '1_day') {
            advanceTime = 12 * 60 * 60 * 1000; // reservation is at least 12 hours from now
        } else {
            return NextResponse.json({
                success: false,
                error: 'Invalid reminder type'
            }, { status: 400 });
        }
        const now = new Date();

        const reservations = await prisma.reservations.findMany({
            where: {
                AND: [
                    {
                        [reminderType === '1_week' ? 'reminder_1_week_at' : 'reminder_1_day_at']: {
                            lte: now
                        }
                    },
                    {
                        [reminderType === '1_week' ? 'reminder_1_week_sent' : 'reminder_1_day_sent']: false
                    },
                    {
                        status: {
                            notIn: ['cancelled']
                        }
                    },
                    {
                        date: {
                            gte: new Date(Date.now() + advanceTime)
                        }
                    }
                ]
            },
            include: {
                business_profiles: {
                    select: {
                        name: true,
                        address: true,
                        images: true,
                        timezone: true,
                        website: true
                    }
                }
            }
        });

        if (reservations.length === 0) {
            console.log("No reservations requiring reminders found.");
        }

        for (const reservation of reservations) {
            try {
                console.log('Current reservation: ', reservation);
                // Format date and time
                const reservationDate = new Date(reservation.date);
                const formattedDate = format(reservationDate, 'PPP');
                const formattedTimeStart = convertTo12HourFormat(reservation.timeslot_start);
                const formattedTimeEnd = convertTo12HourFormat(reservation.timeslot_end);

                // Generate reservation link
                const mac = generateReservationMAC(
                    reservation.confirmation_code,
                    reservation.customer_email!
                );

                const reservationPath = `/reservations/${reservation.confirmation_code}/${mac}`;
                const baseUrl = getBaseUrl();
                const fullReservationLink = `${baseUrl}${reservationPath}`;

                await sendReservationReminderEmail({
                    reminderType: reminderType,
                    to: reservation.customer_email,
                    customerName: reservation.customer_name,
                    restaurantName: reservation.business_profiles.name,
                    date: formattedDate,
                    startTime: formattedTimeStart,
                    endTime: formattedTimeEnd,
                    guests: reservation.party_size,
                    address: reservation.business_profiles.address,
                    reservationLink: fullReservationLink,
                    restaurantThumbnail: reservation.business_profiles.images[0],
                    restaurantTimezone: reservation.business_profiles.timezone
                });

                await prisma.reservations.update({
                    where: {
                        id: reservation.id
                    },
                    data: {
                        [reminderType === '1_week' ? 'reminder_1_week_sent' : 'reminder_1_day_sent']: true,
                        updated_at: new Date()
                    }
                });

                console.log("Email sent and status updated.")
            } catch (emailError) {
                console.error(`Failed to process reminder for reservation ${reservation.id}:`, emailError);
                continue;
            }
        }

        return NextResponse.json({
            success: true,
            processedCount: reservations.length
        });
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to process reminders'
        }, { status: 500 });
    }
}
