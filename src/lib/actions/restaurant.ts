import { prisma } from '@/lib/prisma';
import type { BusinessProfile, CapacitySettings, OperatingHours, ReservationSetting, ReservationSettingTimeSlotRange, Product } from '@/types';
import { Prisma } from '@prisma/client';

// Define types for Prisma models
type PrismaReservationSetting = Prisma.reservation_settingsGetPayload<{
  select: {
    id: true;
    business_id: true;
    day_of_week: true;
    timeslot_length_minutes: true;
    capacity_settings: true;
    is_default: true;
    specific_date: true;
    available_reservation_time_slots: true;
  }
}>;

type PrismaProduct = Prisma.productsGetPayload<{
  select: {
    id: true;
    business_id: true;
    name: true;
    description: true;
    price: true;
    image_urls: true;
    is_active: true;
    category: true;
    stock_quantity: true;
    discount: true;
    rating: true;
    tags: true;
    created_at: true;
    updated_at: true;
  }
}>;

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

    // Transform reservation settings with proper typing
    const transformedReservationSettings = restaurant.reservation_settings.map((setting: PrismaReservationSetting) => ({
        id: setting.id,
        business_id: setting.business_id,
        day_of_week: setting.day_of_week,
        timeslot_length_minutes: setting.timeslot_length_minutes,
        capacity_settings: setting.capacity_settings as unknown as CapacitySettings,
        is_default: setting.is_default,
        specific_date: setting.specific_date,
        available_reservation_time_slots: (setting.available_reservation_time_slots as unknown as ReservationSettingTimeSlotRange[]) || []
    })) as ReservationSetting[];

    return {
        ...restaurant,
        deposit_amount: restaurant.deposit_amount ? Number(restaurant.deposit_amount.toFixed(2)) * 100 : null,
        reservation_settings: transformedReservationSettings,
        products: restaurant.products.map((product: PrismaProduct) => ({
            ...product,
            price: Number(product.price),
            discount: product.discount ? Number(product.discount) : null,
            created_at: product.created_at.toISOString(),
            updated_at: product.updated_at.toISOString()
        }))
    };
}

export async function getAllActiveRestaurants() {
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

    return products.map((product: PrismaProduct) => ({
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
