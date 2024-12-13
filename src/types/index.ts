import { Decimal, JsonValue } from "@prisma/client/runtime/library";

export interface Restaurant {
    id: number;
    slug: string;
    name: string;
    short_description: string | null;
    cuisine: string | null;
    address: string;
    images: string[];
    operating_hours: JsonValue;
    time_slot_length: number;
    table_capacity: JsonValue;
    allowed_booking_advance_days: number;
    policies: string | null;
    is_deposit_required: boolean;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    timezone: string;
}

export interface ReservationForTimeSlotGen {
    date: Date;
    timeslot_start: Date;
    timeslot_end: Date;
    party_size: number;
}

export interface TimeSlot {
    start: string;
    end: string;
    available: boolean;
}

export interface Reservation {
    id: number;
    confirmation_code: string;
    date: Date;
    status: string;
    created_at: Date;
    updated_at: Date;
    customer_email: string | null;
    customer_id: string;
    customer_name: string | null;
    customer_phone: string | null;
    deposit_amount: Decimal | null;
    dietary_restrictions: string | null;
    is_deposit_made: boolean | null;
    party_size: number;
    restaurant_id: number;
    special_occasions: string | null;
    special_requests: string | null;
    timeslot_start: Date;
    timeslot_end: Date;
    restaurant: Restaurant;
}