// src/lib/services/restaurant.ts
import { prisma } from '@/lib/prisma';
import type { BusinessProfile, CapacitySettings, OperatingHours, ReservationSetting, ReservationSettingTimeSlotRange, Product } from '@/types';

export async function getRestaurant(slug: string): Promise<BusinessProfile | null> {
    const restaurant = await prisma.business_profiles.findUnique({
        where: { slug },
        include: {
            reservation_settings: true,
            products: {
                where: {
                    is_active: true,
                    stock_quantity: {
                        gt: 0
                    }
                }
            }
        }
    });

    if (!restaurant) return null;

    // Transform reservation settings to ensure proper typing of capacity_settings
    const transformedReservationSettings = restaurant.reservation_settings.map((setting: any) => ({
        ...setting,
        capacity_settings: setting.capacity_settings as unknown as CapacitySettings,
        available_reservation_time_slots: (setting.available_reservation_time_slots as unknown as ReservationSettingTimeSlotRange[]) || []
    }));

    return {
        ...restaurant,
        deposit_amount: restaurant.deposit_amount ? Number(restaurant.deposit_amount) : null,
        reservation_settings: transformedReservationSettings,
        products: restaurant.products.map(product => ({
            ...product,
            price: Number(product.price),
            discount: product.discount ? Number(product.discount) : null,
            created_at: product.created_at.toISOString(),
            updated_at: product.updated_at.toISOString()
        }))
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

export function sortOperatingHours(operatingHours: OperatingHours): Array<[string, string]> {
    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    return Object.entries(operatingHours)
        .filter(([_, schedule]) => schedule.enabled)
        .map(([day, schedule]) => {
            const timeSlot = schedule.timeSlots[0];
            return [
                day.charAt(0).toUpperCase() + day.slice(1).toLowerCase(),
                `${timeSlot.start} - ${timeSlot.end}`
            ] as [string, string];
        })
        .sort(([a], [b]) =>
            dayOrder.indexOf(a.toUpperCase()) - dayOrder.indexOf(b.toUpperCase())
        );
}

export async function getRestaurantProducts(businessId: string): Promise<Product[]> {
    const products = await prisma.products.findMany({
        where: {
            business_id: businessId,
            is_active: true,
            stock_quantity: {
                gt: 0
            }
        },
        orderBy: {
            category: 'asc'
        }
    });

    return products.map((product: any) => ({
        ...product,
        price: Number(product.price),
        discount: product.discount ? Number(product.discount) : null
    }));
}

export function formatPrice(price: number, discount: number | null): {
    originalPrice: string;
    discountedPrice: string | null;
} {
    const original = price.toFixed(2);
    if (!discount) {
        return { originalPrice: original, discountedPrice: null };
    }
    
    const discounted = (price * (1 - discount / 100)).toFixed(2);
    return { originalPrice: original, discountedPrice: discounted };
}
