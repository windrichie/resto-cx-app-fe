'use client'

import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { createPaymentIntent } from '@/lib/actions/payment';
import { Loader2 } from 'lucide-react';

interface ReservationPaymentFormProps {
    onPaymentSuccess: (paymentIntentId: string) => void;
    onPaymentError: (error: string) => void;
    customerEmail: string;
    depositAmountInCents: number;
    depositCurrency: string;
    restaurantId: string;
    validateBeforePayment: () => boolean;
}

interface PaymentFormInnerProps extends ReservationPaymentFormProps {
    paymentIntentId: string;
}

function PaymentForm({ onPaymentSuccess, onPaymentError, paymentIntentId, validateBeforePayment }: PaymentFormInnerProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async () => {
        if (!stripe || !elements) return;

        setIsProcessing(true);
        try {
            const result = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    // return_url: `${window.location.origin}/payment/success`,
                    return_url: window.location.href,
                },
                redirect: 'if_required'
            });

            if (result.error) {
                onPaymentError(result.error.message ?? 'Payment failed');
            } else {
                onPaymentSuccess(paymentIntentId);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="mt-4 p-4 border rounded-lg">
            <PaymentElement />
            <Button
                onClick={handlePayment}
                disabled={!stripe || isProcessing}
                className="w-full mt-4"
            >
                {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    'Authorize Card'
                )}
            </Button>
        </div>
    );
}

export default function ReservationPaymentForm({
    onPaymentSuccess,
    onPaymentError,
    customerEmail,
    depositAmountInCents,
    depositCurrency,
    restaurantId,
    validateBeforePayment
}: ReservationPaymentFormProps) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

    const initializePayment = async () => {
        if (!customerEmail) {
            onPaymentError('Please fill in your email first');
            return;
        }

        // Add validation check before proceeding
        if (!validateBeforePayment()) {
            onPaymentError('Please fill in all required fields correctly');
            return;
        }

        setIsLoading(true);
        try {
            const { clientSecret, paymentIntentId } = await createPaymentIntent({
                amount: depositAmountInCents,
                currency: depositCurrency,
                reservationId: 'pending',
                restaurantId,
                customerEmail
            });
            setClientSecret(clientSecret);
            setPaymentIntentId(paymentIntentId);
        } catch (error: any) {
            onPaymentError(error.message || 'Failed to initialize payment');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full p-4 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (!clientSecret || !paymentIntentId) {
        return (
            <Button
                onClick={initializePayment}
                className="w-full"
                disabled={!customerEmail}
            >
                Start Card Authorization
            </Button>
        );
    }

    return (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
                customerEmail={customerEmail}
                depositAmountInCents={depositAmountInCents}
                depositCurrency={depositCurrency}
                restaurantId={restaurantId}
                onPaymentSuccess={onPaymentSuccess}
                onPaymentError={onPaymentError}
                paymentIntentId={paymentIntentId}
                validateBeforePayment={validateBeforePayment}
            />
        </Elements>
    );
}
