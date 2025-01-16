import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';

export default async function HomePage() {
  const restaurants = await prisma.business_profiles.findMany({
    where: {
      is_active: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      cuisine: true,
      description: true,
      images: true,
    },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Restaurant Reservations</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <Link 
            key={restaurant.id} 
            href={`/${restaurant.slug}`}
            className="block group hover:shadow-lg transition-shadow duration-200 rounded-lg p-4 border"
          >
            {restaurant.images[0] && (
              <div className="relative h-48 mb-4">
                <Image
                  src={restaurant.images[0]}
                  alt={restaurant.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            )}
            <h2 className="text-xl font-semibold mb-2">{restaurant.name}</h2>
            {restaurant.cuisine && (
              <p className="text-sm text-gray-600 mb-2">{restaurant.cuisine}</p>
            )}
            <p className="text-gray-700">{restaurant.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}