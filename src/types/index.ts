import { Decimal, JsonValue } from "@prisma/client/runtime/library";

export interface BusinessProfile {
    id: string; // Changed from number to string (UUID)
    slug: string;
    name: string;
    description: string | null; // Changed from short_description
    cuisine: string | null;
    address: string;
    google_place_id: string | null;
    google_latitude: Decimal | null;
    google_longitude: Decimal | null;
    google_maps_url: string | null;
    images: string[];
    operating_hours: JsonValue;
    min_allowed_booking_advance_hours: number;
    max_allowed_booking_advance_hours: number;
    allowed_cancellation_hours: number;
    is_deposit_required: boolean;
    deposit_amount: number | null;
    deposit_currency: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    timezone: string;
    cancellation_policy: string | null;
    refund_policy: string | null;
    general_policy: string | null;
    data_usage_policy: string | null;
    owner_user_id: string;
    phone: string | null;
    website: string | null;
    reservation_settings: ReservationSetting[];
}

export interface ReservationSetting {
    id: string;
    business_id: string;
    day_of_week: number;
    reservation_start_time: string;
    reservation_end_time: string;
    capacity_settings: JsonValue;
    specific_date: Date | null;
    is_default: boolean;
    timeslot_length_minutes: number;
}

export interface BusinessProfileWithReservationSettings extends BusinessProfile {
    reservation_settings: ReservationSetting[];
}

export interface ReservationForTimeSlotGen {
    date: Date;
    timeslot_start: string;
    timeslot_end: string;
    party_size: number;
}

export interface TimeSlot {
    start: string;
    end: string;
    available: boolean;
}

export interface Reservation {
    confirmation_code: string;
    date: Date;
    timeslot_start: string;
    timeslot_end: string;
    party_size: number;
    status: 'new' | 'cancelled' | 'completed' | 'arriving-soon' | 'late' | 'no-show' | 'confirmed' | 'seated';
    created_at: Date;
    updated_at: Date;
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    deposit_amount: number | null;
    is_deposit_made: boolean | null;
    dietary_restrictions: string | null;
    business_id: string;
    special_occasions: string | null;
    special_requests: string | null;
    business: BusinessProfileWithReservationSettings;
    deposit_payment_intent_id: string | null;
}

export interface User {
    id: string;
    email: string;
    name: string[];
    phone: string[];
    joined_date: Date;
    is_business_user: boolean;
    business_id: string | null;
    total_visits: number | null;
    is_registered: boolean;
}