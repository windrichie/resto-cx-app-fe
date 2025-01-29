import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getRestaurant, getRestaurantProducts } from '@/lib/actions/restaurant';
import RestaurantDetails from '@/components/restaurant/details';
import DatePicker from '@/components/restaurant/date-picker';
import { BackButton } from '@/components/ui/back-button';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
    const restaurants = await prisma.business_profiles.findMany({
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

    const products = await getRestaurantProducts(restaurant.id);

    return (
        <main className="container mx-auto px-8 py-12 max-w-5xl">
            <div className="pl-24"> {/* Add left padding to account for fixed back button */}
                <h1 className="text-4xl font-bold mb-8">{restaurant.name}</h1>
                <div className="grid md:grid-cols-2 gap-40">
                    <RestaurantDetails 
                        restaurant={restaurant}
                        products={products}
                    />
                    <div>
                        <DatePicker
                            operatingHours={restaurant.operating_hours as Record<string, string>}
                            reservationSettings={restaurant.reservation_settings}
                            restaurant={restaurant}
                            isModifying={false}
                        />
                    </div>
                </div>
            </div>
            <BackButton />
        </main>
    );
    
    
}