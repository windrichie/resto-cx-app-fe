import { Resend } from 'resend';
import { render } from "@react-email/components";
import ReservationConfirmedOrModified from "@/emails/reservation-confirmed-modified";
import ReservationCancelled from '@/emails/reservation-cancelled';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendReservationEmailParams {
    mode: string;
    to: string;
    customerName: string;
    restaurantName: string;
    date: string;
    time: string;
    guests: number;
    address: string;
    // postalCode: string;
    // country: string;
    reservationLink: string;
    restaurantThumbnail: string;
    restaurantTimezone: string;
}

interface SendCancellationEmailParams {
    to: string;
    customerName: string;
    restaurantName: string;
    date: string;
    time: string;
    guests: number;
    address: string;
    restaurantSlug: string;
    restaurantThumbnail: string;
    baseUrl: string;
}

export async function sendCreateOrModifyReservationEmail({
    mode,
    to,
    customerName,
    restaurantName,
    date,
    time,
    guests,
    address,
    // postalCode,
    // country,
    reservationLink,
    restaurantThumbnail,
    restaurantTimezone
}: SendReservationEmailParams) {
    const emailHtml = await render(
        ReservationConfirmedOrModified({
            mode,
            customerName,
            restaurantName,
            date,
            time,
            guests,
            address,
            // postalCode,
            // country,
            reservationLink,
            restaurantThumbnail,
            restaurantTimezone
        })
    );

    let emailSubject = '';
    if (mode == 'Create') {
        emailSubject = `Reservation Confirmed - ${restaurantName}`;
    } else if (mode == 'Modify') {
        emailSubject = `Reservation Modified - ${restaurantName}`;
    } else {
        console.error(`Mode not recognised. Expected either "Create" or "Modify" but got ${mode}`);
        return {
            message: `Mode not recognised. Expected either "Create" or "Modify" but got ${mode}`
        };
    }

    return await resend.emails.send({
        from: `${restaurantName} <reservations@notifications.hellogroot.com>`,
        to,
        subject: emailSubject,
        html: emailHtml,
    });

}

export async function sendCancellationEmail({
    to,
    customerName,
    restaurantName,
    date,
    time,
    guests,
    address,
    restaurantSlug,
    restaurantThumbnail,
    baseUrl
}: SendCancellationEmailParams) {
    const emailHtml = await render(
        ReservationCancelled({
            customerName,
            restaurantName,
            date,
            time,
            guests,
            address,
            restaurantSlug,
            restaurantThumbnail,
            baseUrl
        })
    );

    return await resend.emails.send({
        from: `${restaurantName} <reservations@notifications.hellogroot.com>`,
        to,
        subject: `Reservation Cancelled - ${restaurantName}`,
        html: emailHtml,
    });
}
