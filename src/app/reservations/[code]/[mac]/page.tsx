import { notFound } from 'next/navigation';
import { getReservationByCode } from '@/lib/actions/reservation';
import { verifyReservationMAC } from '@/lib/utils/reservation-auth';
import ReservationManager from '@/components/restaurant/reservation-manager';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{
        code: string;
        mac: string;
    }>;
};

export default async function ReservationPage({ params }: PageProps) {
    const { code, mac } = await params;
    const reservation = (await getReservationByCode(code)).reservation;
    console.log('found reservation: ', reservation);

    if (!reservation || !reservation.customer_email ||
        !verifyReservationMAC(code, reservation.customer_email, mac)) {
        notFound();
    }

    return (
        <main className="container mx-auto px-4 py-8 max-w-5xl">
            {/* <h1 className="text-3xl px-4 py-8 font-bold mb-8">Reservation Details</h1> */}
            <ReservationManager reservation={reservation} />
        </main>
    );
}
