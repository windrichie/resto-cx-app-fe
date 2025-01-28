import Image from 'next/image';
import { type Product } from '@/types';

interface MenuProps {
  products: Product[];
}

export default function Menu({ products }: MenuProps) {
    const activeProducts = products.filter(
        (product) => product.is_active && (product.stock_quantity ?? 0) > 0
    );

  const productsByCategory = activeProducts.reduce<Record<string, Product[]>>((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  return (
    <div className="space-y-16">
      {Object.entries(productsByCategory).map(([category, items]) => (
        <section key={category}>
          <h2 className="text-2xl font-bold mb-8 pb-2 border-b border-gray-200">
            {category}
          </h2>
          <div className="grid gap-8">
            {items.map((product) => (
              <div
                key={product.id}
                className="flex gap-6 items-start group"
              >
                {product.image_urls?.[0] && (
                  <div className="relative w-40 h-40 flex-shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={product.image_urls[0]}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-lg font-medium">
                      {product.name}
                    </h3>
                    <div className="text-right flex-shrink-0">
                      {product.discount ? (
                        <div className="space-y-1">
                          <div className="text-gray-400 line-through text-sm">
                            ${Number(product.price).toFixed(2)}
                          </div>
                          <div className="font-medium">
                            ${(Number(product.price) * (1 - Number(product.discount) / 100)).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <div className="font-medium">
                          ${Number(product.price).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                  {product.description && (
                    <p className="text-gray-600 mt-2 text-sm">
                      {product.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
