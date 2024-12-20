import nodemailer from 'nodemailer';
import ReservationConfirmedOrModified from "@/emails/reservation-confirmed-modified";
import { render } from "@react-email/components";
import ReservationCancelled from '@/emails/reservation-cancelled';


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
    tls: {
        ciphers: 'SSLv3',
    },
});

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
    restaurantThumbnail
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
            restaurantThumbnail
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

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: emailSubject,
        html: emailHtml,
    };

    return await transporter.sendMail(mailOptions);
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

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: `Reservation Cancelled - ${restaurantName}`,
        html: emailHtml,
    };

    return await transporter.sendMail(mailOptions);
}
