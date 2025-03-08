import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { verifyPayment } from '@/lib/actions/payment';
import { BusinessProfile, Reservation } from '@/types';
import ReservationPaymentForm from './reservation-payment-form';
import { toast } from '@/hooks/use-toast';
import { boolean } from 'zod';
import { updateReservation, updateReservationPaymentIntent } from '@/lib/actions/reservation';

interface CancelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isPending: boolean;
    isWithinCancellationPeriod?: boolean;
    restaurant: BusinessProfile;
    reservation: Reservation;
}

export default function CancelDialog({
    open,
    onOpenChange,
    onConfirm,
    isPending,
    isWithinCancellationPeriod,
    restaurant,
    reservation
}: CancelDialogProps) {
    const hasDeposit = reservation.deposit_payment_intent_id;
    const [isCheckingPayment, setIsCheckingPayment] = useState(true);
    const [isPaymentValid, setIsPaymentValid] = useState(false);
    const [existingDepositAmount, setExistingDepositAmount] = useState<number>(0);
    const [existingDepositCurrency, setExistingDepositCurrency] = useState<string>('');

    // verify deposit payment
    async function checkPayment(paymentIntentId: string) {
        if (restaurant.is_deposit_required && paymentIntentId) {
            const verifyPaymentResponse = await verifyPayment(paymentIntentId);
            setIsPaymentValid(verifyPaymentResponse.isValid);
            setExistingDepositAmount(verifyPaymentResponse.amount);
            setExistingDepositCurrency(verifyPaymentResponse.currency.toUpperCase());
        }
        setIsCheckingPayment(false);
    }

    useEffect(() => {
        if (reservation.deposit_payment_intent_id) {
            checkPayment(reservation.deposit_payment_intent_id);
        }
    }, [restaurant.is_deposit_required, reservation.deposit_payment_intent_id]);

    const handlePaymentSuccess = async (intentId: string) => {
        checkPayment(intentId);
        await updateReservationPaymentIntent(reservation.confirmation_code, intentId);
    };

    const handlePaymentError = (error: string) => {
        toast({
            variant: "destructive",
            title: "Payment Error",
            description: error
        });
    };
    const validateFormFields = () => {
        return true; // returns true as there is no validation required here
    };


    const handleConfirmCancel = async () => {
        onConfirm();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cancel Reservation</DialogTitle>
                </DialogHeader>

                {isWithinCancellationPeriod && restaurant.is_deposit_required ? (
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
                                    Your card is authorized for <span className="font-semibold py-1 rounded">{existingDepositCurrency} {(existingDepositAmount / 100).toFixed(2)}</span>.
                                    This amount will be charged if you proceed to cancel your reservation.
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
                                            This restaurant requires a deposit, and your current reservation does not have any valid deposit yet. Please authorize your card to proceed with the cancellation.
                                        </p>
                                        <div className="mt-2 text-sm text-amber-600">
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Your card will be authorized for {restaurant.deposit_currency} {((restaurant.deposit_amount ?? 0) / 100).toFixed(2)} </li>
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
                        <p>Are you sure you want to cancel this reservation? Your card will be charged with the deposit and this action cannot be undone.</p>
                    </>
                ) : (
                    <p>Are you sure you want to cancel this reservation? This action cannot be undone.</p>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        No, Keep It
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirmCancel}
                        disabled={isPending || !isPaymentValid}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cancelling...
                            </>
                        ) : (
                            isWithinCancellationPeriod && hasDeposit ?
                                'Yes, Cancel and Charge Deposit' :
                                'Yes, Cancel It'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
