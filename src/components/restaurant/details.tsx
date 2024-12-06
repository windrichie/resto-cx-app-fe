import Image from 'next/image';
import type { Restaurant } from '@prisma/client';
import { sortOperatingHours } from '@/lib/services/restaurant';

type OperatingHours = Record<string, string>;

export default function RestaurantDetails({
    restaurant
}: {
    restaurant: Restaurant;
}) {
    const operatingHours = restaurant.operating_hours as OperatingHours;

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">{restaurant.name}</h2>
            {restaurant.images[0] && (
                <Image
                    src={restaurant.images[0]}
                    alt={restaurant.name}
                    width={400}
                    height={300}
                    className="rounded-lg mb-4"
                />
            )}
            <p className="text-gray-600 mb-2">{restaurant.address}</p>
            <p className="mb-4">{restaurant.short_description}</p>
            <h3 className="font-semibold mb-2">Operating Hours:</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4">
                {sortOperatingHours(operatingHours).map(([day, hours]) => (
                    <li key={day}>
                        {day}: {hours}
                    </li>
                ))}
            </ul>
            {restaurant.policies && (
                <p className="text-sm text-gray-500">{restaurant.policies}</p>
            )}
        </div>
    );
}