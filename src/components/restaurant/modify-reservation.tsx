'use client'

import { format } from 'date-fns';
import DatePicker from '@/components/restaurant/date-picker';
import { Reservation } from '@/types/index';

interface ModifyReservationProps {
    reservation: Reservation;
    onCancel: () => void;
    onModificationComplete: () => void;
}

export default function ModifyReservation({ reservation, onCancel, onModificationComplete }: ModifyReservationProps) {
    return (
        <div className="space-y-4">
            <DatePicker
                restaurant={reservation.restaurant}
                operatingHours={reservation.restaurant.operating_hours as Record<string, string>}
                tableCapacity={reservation.restaurant.table_capacity as Record<string, number>}
                initialDate={new Date(reservation.date)}
                initialPartySize={reservation.party_size}
                initialTime={format(new Date(reservation.timeslot_start), 'p')}
                isModifying={true}
                confirmationCode={reservation.confirmation_code}
                reservation={reservation}
                onModificationComplete={onModificationComplete}
            />
        </div>
    );
}
