// src/lib/services/restaurant.ts
import { prisma } from '@/lib/prisma';
import type { Restaurant } from '@prisma/client';

export async function getRestaurant(slug: string): Promise<Restaurant | null> {
    const restaurant = await prisma.restaurant.findUnique({
        where: { slug },
    });

    return restaurant;

}

export async function getAllRestaurants() {
    const restaurants = await prisma.restaurant.findMany({
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