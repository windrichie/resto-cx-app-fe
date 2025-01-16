// src/lib/services/restaurant.ts
import { prisma } from '@/lib/prisma';
import type { BusinessProfile } from '@/types';

export async function getRestaurant(slug: string): Promise<BusinessProfile | null> {
    const restaurant = await prisma.business_profiles.findUnique({
        where: { slug },
        include: {
            reservation_settings: true
        }
    });
    return restaurant;
}

export async function getAllRestaurants() {
    const restaurants = await prisma.business_profiles.findMany({
        where: {
            is_active: true,
        },
    });

    return restaurants;
}

export function sortOperatingHours(operatingHours: Record<string, string>): [string, string][] {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return Object.entries(operatingHours)
        .sort(([a], [b]) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
}