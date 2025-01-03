'use client'

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Clock, Users, User, Mail, Phone, Hash } from 'lucide-react';
import RestaurantDetails from '@/components/restaurant/details';
import ModifyReservation from '@/components/restaurant/modify-reservation';
import CancelDialog from '@/components/restaurant/cancel-dialog';
import { cancelReservation } from '@/lib/actions/reservation';
import CancelledReservationView from './cancelled-reservation';
import { Reservation } from '@/types/index';

interface ReservationManagerProps {
    reservation: Reservation;
}

export default function ReservationManager({ reservation }: ReservationManagerProps) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleCancel = async () => {
        setIsPending(true);
        const result = await cancelReservation(reservation);
        setIsPending(false);

        if (result.success) {
            toast({
                title: "Success",
                description: result.message,
            });
            setShowCancelDialog(false);
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: result.message,
            });
        }
    };

    if (reservation.status === 'cancelled') {
        return (
            <CancelledReservationView
                restaurantSlug={reservation.restaurant.slug}
                restaurantName={reservation.restaurant.name}
            />
        );
    }

    return (
        <main className="container mx-auto max-w-5xl">
            <h1 className="text-4xl font-bold mb-8">Manage Reservation</h1>
            <div className="grid md:grid-cols-2 gap-36">
                {/* Left Column */}
                <div>
                    <RestaurantDetails restaurant={reservation.restaurant} />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Current Reservation Details Card */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">Reservation Details</h2>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(!isEditing)}
                                    disabled={reservation.status === 'cancelled' || isPending}
                                >
                                    {isEditing ? 'Cancel Modification' : 'Modify'}
                                </Button>
                                {!isEditing && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setShowCancelDialog(true)}
                                        disabled={reservation.status === 'cancelled' || isPending}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* <div className="flex items-center gap-3 text-gray-700">
                                <Hash className="h-5 w-5 text-gray-400" />
                                <span className="text-sm text-gray-500">Confirmation Code:</span>
                                <span className="font-mono">{reservation.confirmation_code}</span>
                            </div> */}

                            <div className="flex items-center gap-3 text-gray-700">
                                <CalendarDays className="h-5 w-5 text-gray-400" />
                                <span>{format(new Date(reservation.date), 'PPP')}</span>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700">
                                <Clock className="h-5 w-5 text-gray-400" />
                                <span>{format(new Date(reservation.timeslot_start), 'p')}</span>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700">
                                <Users className="h-5 w-5 text-gray-400" />
                                <span>Party of {reservation.party_size}</span>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex items-center gap-3 text-gray-700 mb-3">
                                    <User className="h-5 w-5 text-gray-400" />
                                    <span>{reservation.customer_name}</span>
                                </div>

                                <div className="flex items-center gap-3 text-gray-700 mb-3">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                    <span>{reservation.customer_email}</span>
                                </div>

                                <div className="flex items-center gap-3 text-gray-700">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                    <span>{reservation.customer_phone}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modification Form */}
                    {isEditing && (
                        <ModifyReservation
                            reservation={reservation}
                            onCancel={() => setIsEditing(false)}
                            onModificationComplete={() => setIsEditing(false)}
                        />
                    )}
                </div>
            </div>

            <CancelDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
                onConfirm={handleCancel}
                isPending={isPending}
            />
        </main>
    );
}
