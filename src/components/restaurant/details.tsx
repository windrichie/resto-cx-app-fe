import Image from 'next/image';
import type { BusinessProfile } from '@/types/index';
import { sortOperatingHours } from '@/lib/actions/restaurant';

type OperatingHours = Record<string, string>;

export default function RestaurantDetails({
    restaurant
}: {
    restaurant: BusinessProfile;
}) {
    const operatingHours = restaurant.operating_hours as OperatingHours;

    const policies = [
        { title: 'Cancellation Policy', content: restaurant.cancellation_policy },
        { title: 'Refund Policy', content: restaurant.refund_policy },
        { title: 'General Policy', content: restaurant.general_policy },
        { title: 'Data Usage Policy', content: restaurant.data_usage_policy }
    ].filter(policy => policy.content);

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
            <p className="mb-4">{restaurant.description}</p>
            <h3 className="font-semibold mb-2">Operating Hours:</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4">
                {sortOperatingHours(operatingHours).map(([day, hours]) => (
                    <li key={day}>
                        {day}: {hours}
                    </li>
                ))}
            </ul>
            {policies.length > 0 && (
                <div>
                    <h3 className="text-xl font-semibold mb-3">Policies</h3>
                    <div className="space-y-4">
                        {policies.map((policy, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-md">
                                <h4 className="font-medium mb-2">{policy.title}</h4>
                                <p className="text-sm text-gray-600">{policy.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}