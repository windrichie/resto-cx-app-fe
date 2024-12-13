// src/components/restaurant/modify-reservation-form.tsx
'use client'

import { useState, useEffect, useActionState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { updateReservation, State } from '@/lib/actions/reservation';
import { format } from "date-fns";

interface ModifyReservationFormProps {
    selectedDate: Date;
    selectedTime: string;
    partySize: number;
    restaurantId: number;
    restaurantName: string;
    timeSlotLength: number;
    restaurantTimezone: string;
    confirmationCode: string;
}

export default function ModifyReservationForm({
    selectedDate,
    selectedTime,
    partySize,
    restaurantId,
    restaurantName,
    timeSlotLength,
    restaurantTimezone,
    confirmationCode,
}: ModifyReservationFormProps) {
    const { toast } = useToast();
    const initialState: State = {
        message: '',  // Change from null to empty string
        errors: {},
        newMac: undefined
    };
    const [state, formAction, isPending] = useActionState(updateReservation, initialState);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    useEffect(() => {
        if (state.message && !state.errors) {
            setShowSuccessDialog(true);
        } else if (state.errors) {
            toast({
                variant: "destructive",
                title: "Error",
                description: state.message
            });
        }
    }, [state, toast]);

    return (
        <>
            <form action={formAction} className="space-y-4">
                <input type="hidden" name="confirmationCode" value={confirmationCode} />
                <input type="hidden" name="restaurantId" value={restaurantId} />
                <input type="hidden" name="date" value={selectedDate.toISOString()} />
                <input type="hidden" name="timeSlotStart" value={selectedTime} />
                <input type="hidden" name="partySize" value={partySize} />
                <input type="hidden" name="timeSlotLength" value={timeSlotLength} />
                <input type="hidden" name="restaurantTimezone" value={restaurantTimezone} />

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
                                {restaurantName}
                            </div>
                            <div className="text-muted-foreground">
                                Party of {partySize}
                            </div>
                            <div className="text-muted-foreground">
                                {format(selectedDate, 'EEE')} · {selectedTime} ({restaurantTimezone})
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
                        <Button className="w-full" onClick={() => setShowSuccessDialog(false)}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
