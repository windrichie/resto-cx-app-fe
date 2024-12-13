'use client'

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarX } from "lucide-react";

interface CancelledViewProps {
  restaurantSlug: string;
  restaurantName: string;
}

export default function CancelledReservationView({ restaurantSlug, restaurantName }: CancelledViewProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <CalendarX className="h-8 w-8 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Reservation Cancelled</h1>
        
        <p className="text-gray-600 mb-8">
          This reservation has been cancelled. Would you like to make a new reservation at <b>{restaurantName}</b>?
        </p>

        <Link href={`/${restaurantSlug}`}>
          <Button className="w-full">
            Make New Reservation
          </Button>
        </Link>
      </div>
    </div>
  );
}
