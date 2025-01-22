'use server'

// lib/actions/payments.ts
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export type CreatePaymentIntentParams = {
  amount: number;
  currency: string;
  reservationId: string;
  restaurantId: string;
  customerEmail: string;
};

// check for legit currency
const VALID_CURRENCIES = ['SGD', 'USD', 'MYR'] as const;
type ValidCurrency = typeof VALID_CURRENCIES[number];

function isValidCurrency(currency: string): currency is ValidCurrency {
  return VALID_CURRENCIES.includes(currency as ValidCurrency);
}

export async function createPaymentIntent({
  amount: amountInCents,
  currency,
  reservationId,
  restaurantId,
  customerEmail,
}: CreatePaymentIntentParams) {
  try {
    if (!currency) {
      throw new Error('Currency is required');
    }

    if (!isValidCurrency(currency)) {
      throw new Error(`Invalid currency code: ${currency}. Supported currencies are: ${VALID_CURRENCIES.join(', ')}`);
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      capture_method: 'manual', // Enable separate auth/capture
      metadata: {
        reservationId,
        restaurantId,
      },
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    throw new Error(`Failed to create payment intent: ${error}`);
  }
}

export async function capturePayment(paymentIntentId: string) {
  try {
    return await stripe.paymentIntents.capture(paymentIntentId);
  } catch (error) {
    throw new Error(`Failed to capture payment: ${error}`);
  }
}

export async function voidPayment(paymentIntentId: string) {
  try {
    return await stripe.paymentIntents.cancel(paymentIntentId);
  } catch (error) {
    throw new Error(`Failed to void payment: ${error}`);
  }
}

export async function verifyPayment(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId
    );
    if (paymentIntent.status !== 'canceled' && paymentIntent.status !== 'succeeded') {
      return true;
    } else {
      return false;
    };
  } catch (error) {
    throw new Error(`Failed to verify payment: ${error}`);
  }
}