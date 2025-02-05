// src/components/restaurant/modify-reservation-form.tsx
'use client'

import { useState, useEffect, useActionState, startTransition } from 'react';
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
import ReservationPaymentForm from '@/components/restaurant/reservation-payment-form';
import { verifyPayment } from '@/lib/actions/payment';
import { z } from 'zod';

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

const UpdateReservationSchema = z.object({
    confirmationCode: z.string().min(1, 'Confirmation code is required'),
    partySize: z.number().min(1, 'Party size must be at least 1'),
    date: z.date(),
    timeSlotStart: z.string().min(1, 'Time slot is required'),
    timeSlotLengthMinutes: z.number().min(1, 'Time slot length is required'),
    restaurantTimezone: z.string().min(1, 'Timezone is required'),
    restaurantName: z.string(),
    restaurantAddress: z.string(),
    customerName: z.string(),
    customerEmail: z.string(),
    restaurantImages: z.array(z.string())
});


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
    const [isCheckingPayment, setIsCheckingPayment] = useState(true);
    const [isPaymentValid, setIsPaymentValid] = useState(false);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
    const [formRef, setFormRef] = useState<HTMLFormElement | null>(null);
    const [formErrors, setFormErrors] = useState<z.inferFormattedError<typeof UpdateReservationSchema>>({ _errors: [] });

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

    // verify deposit payment
    useEffect(() => {
        async function checkPayment() {
            if (restaurant.is_deposit_required && reservation.deposit_payment_intent_id) {
                const isPaymentValid = await verifyPayment(reservation.deposit_payment_intent_id);
                if (isPaymentValid) {
                    setIsPaymentValid(true);
                } else {
                    setIsPaymentValid(false);
                }
            }
            setIsCheckingPayment(false);
        }

        checkPayment();
    }, [restaurant.is_deposit_required, reservation.deposit_payment_intent_id]);

    const handlePaymentSuccess = async (intentId: string) => {
        setPaymentIntentId(intentId);
        startTransition(() => {
            const formData = new FormData(formRef!);
            formData.append('paymentIntentId', intentId);
            if (validateForm(formData)) {
                formAction(formData);
            } else {
                // Show error toast if validation fails
                toast({
                    variant: "destructive",
                    title: "Validation Error",
                    description: "Please check all required fields"
                });
            }
        });
    };

    const handlePaymentError = (error: string) => {
        toast({
            variant: "destructive",
            title: "Payment Error",
            description: error
        });
    };

    const validateFormFields = () => {
        if (!formRef) return false;

        const formData = new FormData(formRef);
        return validateForm(formData); // Your existing validation function
    };

    const validateForm = (formData: FormData): boolean => {
        const validatedFields = UpdateReservationSchema.safeParse({
            confirmationCode: formData.get('confirmationCode'),
            partySize: parseInt(formData.get('partySize') as string),
            date: new Date(formData.get('date') as string),
            timeSlotStart: formData.get('timeSlotStart'),
            timeSlotLengthMinutes: parseInt(formData.get('timeSlotLengthMinutes') as string),
            restaurantTimezone: formData.get('restaurantTimezone'),
            restaurantName: formData.get('restaurantName'),
            restaurantAddress: formData.get('restaurantAddress'),
            customerEmail: formData.get('customerEmail'),
            customerName: formData.get('customerName'),
            restaurantImages: JSON.parse(formData.get('restaurantImages') as string || '[]'),
        });

        if (!validatedFields.success) {
            setFormErrors(validatedFields.error.format());
            return false;
        }

        setFormErrors({ _errors: [] });
        return true;
    };


    return (
        <>
            <form
                ref={setFormRef}
                onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    if (validateForm(formData)) {
                        startTransition(() => {
                            formAction(formData);
                        });
                    }
                }}
                className="space-y-4"
            >
                <input type="hidden" name="confirmationCode" value={confirmationCode} />
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="restaurantName" value={restaurant.name} />
                <input type="hidden" name="date" value={selectedDate.toISOString()} />
                <input type="hidden" name="selectedDate" value={selectedDate.getDate()} />
                <input type="hidden" name="selectedMonth" value={selectedDate.getMonth()} />
                <input type="hidden" name="selectedYear" value={selectedDate.getFullYear()} />
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
                {paymentIntentId && (
                    <input
                        type="hidden"
                        name="paymentIntentId"
                        value={paymentIntentId}
                    />
                )}

                <h3 className="text-xl font-semibold mb-4">Update Reservation Details</h3>
                <p className="mb-4">
                    Date: {selectedDate.toDateString()}, Time: {selectedTime}, Party Size: {partySize}
                </p>

                {restaurant.is_deposit_required && (
                    <>
                        {isCheckingPayment ? (
                            <div className="text-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                <p className="text-sm text-gray-600 mt-2">Verifying payment status...</p>
                            </div>
                        ) : isPaymentValid ? (
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-4">
                                <p className="text-black font-bold text-lg mb-2">Card Authorization Active</p>
                                <p className="text-green-700">
                                    Your card is already authorized for <span className="font-semibold py-1 rounded">SGD 100.00</span>.
                                    This amount will only be charged if you do not show up for your reservation.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mb-4">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-lg font-semibold text-amber-800">
                                            Deposit Required: {restaurant.deposit_currency} {((restaurant.deposit_amount ?? 0) / 100).toFixed(2)}
                                        </h3>
                                        <p className="text-amber-700">
                                            This restaurant requires a refundable deposit to secure your reservation.
                                        </p>
                                        <div className="mt-2 text-sm text-amber-600">
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Your card will be authorized for {restaurant.deposit_currency} {((restaurant.deposit_amount ?? 0) / 100).toFixed(2)} </li>
                                                <li>No immediate charge will be made</li>
                                                <li>The amount will only be charged if you do not show up for your reservation</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <ReservationPaymentForm
                                    customerEmail={reservation.customer_email}
                                    depositAmountInCents={restaurant.deposit_amount ?? 0}
                                    depositCurrency={restaurant.deposit_currency ?? 'SGD'}
                                    restaurantId={restaurant.id}
                                    onPaymentSuccess={handlePaymentSuccess}
                                    onPaymentError={handlePaymentError}
                                    validateBeforePayment={validateFormFields}
                                />
                            </>
                        )}
                    </>
                )}

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending || (restaurant.is_deposit_required && !isPaymentValid)}
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

                {/* <Button
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
                </Button> */}

                {state.message && (
                    <p className={`mt-2 text-sm ${state.errors ? 'text-red-500' : 'text-green-500'}`}>
                        {state.message}
                    </p>
                )}
            </form >

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

                    {/* {state.reservationLink && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">Reservation Link (Development Only - access this link to view your reservation)</p>
                            <p className="text-sm break-all font-mono">{state.reservationLink}</p>
                        </div>
                    )} */}

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
