'use client';

import { useRouter } from 'next/navigation';
import { Button } from './button';
import { ChevronLeft } from 'lucide-react';

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.back()}
      variant="ghost"
      size="sm"
      className="fixed left-8 top-8 bg-gray-50/90 hover:bg-gray-100/90 rounded-md px-4 py-2"
    >
      <ChevronLeft className="h-4 w-4" />
      Back
    </Button>
  );
}
