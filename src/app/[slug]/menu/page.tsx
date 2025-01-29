import { getRestaurant, getRestaurantProducts } from '@/lib/actions/restaurant';
import { notFound } from 'next/navigation';
import Menu from '@/components/restaurant/menu';
import { BackButton } from '@/components/ui/back-button';

export default async function MenuPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params;
    const restaurant = await getRestaurant(slug);

    if (!restaurant) {
        notFound();
    }

    const products = await getRestaurantProducts(restaurant.id);

    return (
        <main className="container mx-auto px-8 py-12 max-w-5xl">
            <div className="pl-24"> {/* Add left padding to account for fixed back button */}
                <h1 className="text-4xl font-bold mb-8">{restaurant.name}</h1>
                <div className="w-full">
                    <Menu products={products} />
                </div>
            </div>
            <BackButton />
        </main>
    );    
}
