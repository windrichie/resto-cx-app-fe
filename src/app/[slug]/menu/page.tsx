import { getRestaurant, getRestaurantProducts } from '@/lib/actions/restaurant';
import { notFound } from 'next/navigation';
import Menu from '@/components/restaurant/menu';

export default async function MenuPage({
    params
}: {
    params: { slug: string }
}) {
    const { slug } = await params;
    const restaurant = await getRestaurant(slug);

    if (!restaurant) {
        notFound();
    }

    const products = await getRestaurantProducts(restaurant.id);

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <h1 className="text-4xl font-bold mb-8">{restaurant.name}</h1>
            <Menu products={products} />
        </div>
    );
}