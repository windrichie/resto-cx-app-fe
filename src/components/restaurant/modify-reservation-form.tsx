// src/components/restaurant/modify-reservation-form.tsx
'use client'

import { useState, useEffect, useActionState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckIcon, XIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { updateReservation, State } from '@/lib/actions/reservation';
import { format } from "date-fns";
import { Reservation, BusinessProfile } from '@/types';
import { useRouter } from 'next/navigation';

interface ModifyReservationFormProps {
    selectedDate: Date;
    selectedTime: string;
    partySize: number;
    restaurant: BusinessProfile;
    confirmationCode: string;
    reservation: Reservation;
    timeSlotLengthMinutes: number;
    onModificationComplete?: () => void;
}

export default function ModifyReservationForm({
    selectedDate,
    selectedTime,
    partySize,
    confirmationCode,
    restaurant,
    reservation,
    timeSlotLengthMinutes,
    onModificationComplete
}: ModifyReservationFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const initialState: State = {
        message: '',  // Change from null to empty string
        errors: {},
        newMac: undefined
    };
    const [state, formAction, isPending] = useActionState(updateReservation, initialState);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showErrorDialog, setShowErrorDialog] = useState(false);

    // Watch for successful/failed submission
    useEffect(() => {
        if (state.message) {
            if (!state.errors) {
                setShowSuccessDialog(true);
                setShowErrorDialog(false);
            } else if (Object.keys(state.errors).length > 0) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: state.message
                });
                setShowErrorDialog(true);
                setShowSuccessDialog(false);
            }
        }
    }, [state, toast]);

    return (
        <>
            <form action={formAction} className="space-y-4">
                <input type="hidden" name="confirmationCode" value={confirmationCode} />
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="restaurantName" value={restaurant.name} />
                <input type="hidden" name="date" value={selectedDate.toISOString()} />
                <input type="hidden" name="timeSlotStart" value={selectedTime} />
                <input type="hidden" name="partySize" value={partySize} />
                <input type="hidden" name="timeSlotLengthMinutes" value={timeSlotLengthMinutes} />
                {/* <input type="hidden" name="reservationSettings" value={JSON.stringify(restaurant.reservation_settings)} /> */}
                <input type="hidden" name="restaurantTimezone" value={restaurant.timezone} />
                <input type="hidden" name="restaurantAddress" value={restaurant.address} />
                <input type="hidden" name="restaurantSlug" value={restaurant.slug} />
                <input type="hidden" name="customerEmail" value={reservation.customer_email ?? ""} />
                <input type="hidden" name="customerName" value={reservation.customer_name ?? ""} />
                <input type="hidden" name="restaurantImages" value={JSON.stringify(restaurant.images)} />

                <h3 className="text-xl font-semibold mb-4">Update Reservation Details</h3>
                <p className="mb-4">
                    Date: {selectedDate.toDateString()}, Time: {selectedTime}, Party Size: {partySize}
                </p>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating Reservation...
                        </>
                    ) : (
                        'Confirm Changes'
                    )}
                </Button>

                {state.message && (
                    <p className={`mt-2 text-sm ${state.errors ? 'text-red-500' : 'text-green-500'}`}>
                        {state.message}
                    </p>
                )}
            </form>

            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="text-center max-w-md">
                    <DialogHeader className="space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                            <CheckIcon className="h-8 w-8 text-green-500" />
                        </div>
                        <DialogTitle className="text-xl text-center">Reservation Updated</DialogTitle>
                    </DialogHeader>

                    <div className="flex items-center justify-center gap-8 my-8">
                        <div className="text-center">
                            <div className="text-4xl font-semibold">
                                {format(selectedDate, 'd')}
                            </div>
                            <div className="text-sm text-muted-foreground uppercase">
                                {format(selectedDate, 'MMM')}
                            </div>
                        </div>
                        <div className="text-left">
                            <div className="font-medium text-lg">
                                {restaurant.name}
                            </div>
                            <div className="text-muted-foreground">
                                Party of {partySize}
                            </div>
                            <div className="text-muted-foreground">
                                {format(selectedDate, 'EEE')} · {selectedTime} ({restaurant.timezone})
                            </div>
                        </div>
                    </div>

                    {state.reservationLink && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">Reservation Link (Development Only - access this link to view your reservation)</p>
                            <p className="text-sm break-all font-mono">{state.reservationLink}</p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button className="w-full" onClick={() => {
                            setShowSuccessDialog(false);
                            // Reset the form state
                            onModificationComplete?.(); //
                            // Navigate to the reservation page
                            router.push(state.reservationLink || `/${restaurant.slug}`);
                        }}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Error dialog */}
            <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
                <DialogContent className="text-center max-w-md">
                    <DialogHeader className="space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                            <XIcon className="h-8 w-8 text-red-500" />
                        </div>
                        <DialogTitle className="text-xl text-center">Failed to Update Reservation</DialogTitle>
                    </DialogHeader>

                    <div className="my-4">
                        <p className="text-gray-600">{state.message}</p>
                    </div>

                    <DialogFooter>
                        <Button
                            className="w-full"
                            variant="destructive"
                            onClick={() => setShowErrorDialog(false)}
                        >
                            Try Again
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </>
    );
}
