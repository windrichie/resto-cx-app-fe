// src/lib/services/restaurant.ts
import { prisma } from '@/lib/prisma';
import type { BusinessProfile, CapacitySettings } from '@/types';

export async function getRestaurant(slug: string): Promise<BusinessProfile | null> {
    const restaurant = await prisma.business_profiles.findUnique({
        where: { slug },
        include: {
            reservation_settings: true
        }
    });

    if (!restaurant) return null;

    // Transform reservation settings to ensure proper typing of capacity_settings
    const transformedReservationSettings = restaurant.reservation_settings.map(setting => ({
        ...setting,
        capacity_settings: setting.capacity_settings as unknown as CapacitySettings
    }));

    return {
        ...restaurant,
        deposit_amount: restaurant.deposit_amount ? Number(restaurant.deposit_amount.toFixed(2)) * 100 : null,
        reservation_settings: transformedReservationSettings
    };
}

export async function getAllRestaurants() {
    const restaurants = await prisma.business_profiles.findMany({
        where: {
            is_active: true,
        },
    });

    return restaurants.map(restaurant => ({
        ...restaurant,
        deposit_amount: restaurant.deposit_amount ? Number(restaurant.deposit_amount.toFixed(2)) : null
    }));

}

export function sortOperatingHours(operatingHours: Record<string, string>): [string, string][] {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return Object.entries(operatingHours)
        .sort(([a], [b]) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
}