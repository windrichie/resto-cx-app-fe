import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getRestaurant } from '@/lib/services/restaurant';
import RestaurantDetails from '@/components/restaurant/details';
import DatePicker from '@/components/restaurant/date-picker';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
    const restaurants = await prisma.restaurant.findMany({
        select: { slug: true },
    });

    return restaurants.map((restaurant) => ({
        slug: restaurant.slug,
    }));
}

type PageProps = {
    params: Promise<{ slug: string }>;
};

export default async function RestaurantPage({
    params,
}: PageProps) {
    const { slug } = await params;
    const restaurant = await getRestaurant(slug);

    // Handle null case early
    if (!restaurant) {
        notFound();
    }

    return (
        <main className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">{restaurant.name}</h1>
            <div className="grid md:grid-cols-2 gap-2">
                <RestaurantDetails restaurant={restaurant} />
                <div>
                    <DatePicker
                        restaurantId={restaurant.id}
                        timeSlotLength={restaurant.time_slot_length}
                        operatingHours={restaurant.operating_hours as Record<string, string>}
                        allowedBookingAdvance={restaurant.allowed_booking_advance_days}
                        tableCapacity={restaurant.table_capacity as Record<string, number>}
                    />
                </div>
            </div>
        </main>
    );
}