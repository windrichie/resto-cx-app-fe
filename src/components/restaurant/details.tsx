import Image from 'next/image';
import type { BusinessProfile } from '@/types/index';
import { sortOperatingHours } from '@/lib/actions/restaurant';
import { Globe, MapPin, Phone } from 'lucide-react';
import { OperatingHours } from '@/types/index';


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
            <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <p>{restaurant.address}</p>
                </div>

                {restaurant.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-5 w-5 flex-shrink-0" />
                        <a
                            href={`tel:${restaurant.phone}`}
                            className="hover:text-blue-600 transition-colors"
                        >
                            {restaurant.phone}
                        </a>
                    </div>
                )}

                {restaurant.website && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <Globe className="h-5 w-5 flex-shrink-0" />
                        <a
                            href={restaurant.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 transition-colors break-all"
                        >
                            {restaurant.website.replace(/^https?:\/\//, '')}
                        </a>
                    </div>
                )}
            </div>

            <p className="mb-6">{restaurant.description}</p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-3">Operating Hours:</h3>
                <ul className="space-y-1 text-gray-600">
                    {sortOperatingHours(operatingHours).map(([day, hours]) => (
                        <li key={day} className="flex justify-between">
                            <span className="font-medium">{day}</span>
                            <span>{hours}</span>
                        </li>
                    ))}
                </ul>
            </div>
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