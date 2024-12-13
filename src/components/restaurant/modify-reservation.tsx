'use client'

import { format } from 'date-fns';
import DatePicker from '@/components/restaurant/date-picker';
import { Reservation } from '@/types/index';

interface ModifyReservationProps {
    reservation: Reservation;
    onCancel: () => void;
}

export default function ModifyReservation({ reservation, onCancel }: ModifyReservationProps) {
    return (
        <div className="space-y-4">
            <DatePicker
                restaurantId={reservation.restaurant_id}
                restaurantName={reservation.restaurant.name}
                timeSlotLength={reservation.restaurant.time_slot_length}
                operatingHours={reservation.restaurant.operating_hours as Record<string, string>}
                allowedBookingAdvance={reservation.restaurant.allowed_booking_advance_days}
                tableCapacity={reservation.restaurant.table_capacity as Record<string, number>}
                restaurantTimezone={reservation.restaurant.timezone}
                initialDate={new Date(reservation.date)}
                initialPartySize={reservation.party_size}
                initialTime={format(new Date(reservation.timeslot_start), 'p')}
                isModifying={true}
                confirmationCode={reservation.confirmation_code}
            />
        </div>
    );
}
