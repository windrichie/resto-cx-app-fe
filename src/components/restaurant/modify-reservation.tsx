'use client'

import { format } from 'date-fns';
import DatePicker from '@/components/restaurant/date-picker';
import { Reservation } from '@/types/index';
import { convertTo12HourFormat } from '@/lib/utils/date-and-time';

interface ModifyReservationProps {
    reservation: Reservation;
    onCancel: () => void;
    onModificationComplete: () => void;
}

export default function ModifyReservation({ reservation, onCancel, onModificationComplete }: ModifyReservationProps) {
    return (
        <div className="space-y-4">
            <DatePicker
                restaurant={reservation.business}
                operatingHours={reservation.business.operating_hours as Record<string, string>}
                initialDate={new Date(reservation.date)}
                initialPartySize={reservation.party_size}
                initialTime={convertTo12HourFormat(reservation.timeslot_start)}
                isModifying={true}
                confirmationCode={reservation.confirmation_code}
                reservation={reservation}
                onModificationComplete={onModificationComplete}
                reservationSettings={reservation.business.reservation_settings}
            />
        </div>
    );
}
