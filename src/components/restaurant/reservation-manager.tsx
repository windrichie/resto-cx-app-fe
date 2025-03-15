'use client'

import { useMemo, useState } from 'react';
import { differenceInHours, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Clock, Users, User, Mail, Phone, Hash } from 'lucide-react';
import RestaurantDetails from '@/components/restaurant/details';
import ModifyReservation from '@/components/restaurant/modify-reservation';
import CancelDialog from '@/components/restaurant/cancel-dialog';
import { cancelReservation } from '@/lib/actions/reservation';
import CancelledReservationView from './cancelled-reservation';
import { Reservation } from '@/types/index';
import { convertTo12HourFormat, convertToLocalTime } from '@/lib/utils/date-and-time';
import { capturePayment } from '@/lib/actions/payment';

interface ReservationManagerProps {
    reservation: Reservation;
}

export default function ReservationManager({ reservation }: ReservationManagerProps) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const isWithinCancellationPeriod = useMemo(() => {
        const now = new Date();

        // Create a date object combining reservation date and timeslot
        const reservationDateTime = new Date(
            reservation.date.getFullYear(),
            reservation.date.getMonth(),
            reservation.date.getDate(),
            ...reservation.timeslot_start.split(':').map(Number) // Split HH:mm into hours and minutes
        );
        console.log(`reservationDateTime: ${reservationDateTime}`);

        // Convert both times to the restaurant's timezone for accurate comparison
        const nowInRestaurantTz = convertToLocalTime(now, reservation.business.timezone);
        const reservationTimeInRestaurantTz = convertToLocalTime(reservationDateTime, reservation.business.timezone);
        console.log(`nowInRestaurantTz: ${nowInRestaurantTz}`)
        console.log(`reservationTimeInRestaurantTz: ${reservationTimeInRestaurantTz}`)

        // Calculate hours difference
        const hoursUntilReservation = differenceInHours(
            reservationTimeInRestaurantTz,
            nowInRestaurantTz
        );

        return hoursUntilReservation <= reservation.business.allowed_cancellation_hours;
    }, [
        reservation.date,
        reservation.timeslot_start,
        reservation.business.timezone,
        reservation.business.allowed_cancellation_hours
    ]);


    const handleCancel = async () => {
        setIsPending(true);

        try {
            if (isWithinCancellationPeriod &&
                reservation.deposit_payment_intent_id) {
                await capturePayment(reservation.deposit_payment_intent_id);
            }

            const result = await cancelReservation(reservation);

            if (result.success) {
                toast({
                    title: "Your reservation is successfully cancelled.",
                    // description: result.message,
                });
                setShowCancelDialog(false);
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.message,
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to process cancellation. Please try again.",
            });
        } finally {
            setIsPending(false);
        }
    };

    if (reservation.status === 'cancelled') {
        return (
            <CancelledReservationView
                restaurantSlug={reservation.business.slug}
                restaurantName={reservation.business.name}
            />
        );
    }

    const isCancelled = (status: Reservation['status']): status is 'cancelled' => status === 'cancelled';

    return (
        <main className="container mx-auto max-w-5xl">
            <h1 className="text-4xl font-bold mb-8">Manage Reservation</h1>
            <div className="grid md:grid-cols-2 gap-36">
                {/* Left Column */}
                <div>
                    <RestaurantDetails restaurant={reservation.business}
                        products={reservation.business.products}
                    />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Current Reservation Details Card */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">Reservation Details</h2>
                            <div className="flex gap-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsEditing(!isEditing)}
                                                    disabled={isCancelled(reservation.status) ||
                                                        isPending ||
                                                        isWithinCancellationPeriod}
                                                >
                                                    {isEditing ? 'Cancel Modification' : 'Modify'}
                                                </Button>
                                            </span>
                                        </TooltipTrigger>
                                        {isWithinCancellationPeriod && (
                                            <TooltipContent>
                                                <p>Modifications are not allowed within {reservation.business.allowed_cancellation_hours} hours of the reservation</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>

                                {!isEditing && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => setShowCancelDialog(true)}
                                                        disabled={isCancelled(reservation.status) || isPending}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            {/* {isWithinCancellationPeriod && (
                                                <TooltipContent>
                                                    <p>Cancellations are not allowed within {reservation.business.allowed_cancellation_hours} hours of the reservation</p>
                                                </TooltipContent>
                                            )} */}
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-700">
                                <Hash className="h-5 w-5 text-gray-400" />
                                <span className="text-sm text-gray-500">Confirmation Code:</span>
                                <span className="font-mono">{reservation.confirmation_code.toUpperCase()}</span>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700">
                                <CalendarDays className="h-5 w-5 text-gray-400" />
                                <span>{format(new Date(reservation.date), 'PPP')}</span>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700">
                                <Clock className="h-5 w-5 text-gray-400" />
                                <span>{convertTo12HourFormat(reservation.timeslot_start)} - {convertTo12HourFormat(reservation.timeslot_end)}</span><span className="text-gray-400">({reservation.business.timezone})</span>
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
                isWithinCancellationPeriod={isWithinCancellationPeriod}
                restaurant={reservation.business}
                reservation={reservation}
            />
        </main>
    );
}
