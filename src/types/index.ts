export interface Restaurant {
    id: number;
    slug: string;
    name: string;
    shortDescription: string | null;
    cuisine: string | null;
    address: string;
    images: string[];
    operatingHours: {
        [key: string]: string;
    };
    timeSlotLength: number;
    tableCapacity: {
        [key: string]: number;
    };
    allowedBookingInAdvance: number;
    policies: string | null;
    depositRequired: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
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