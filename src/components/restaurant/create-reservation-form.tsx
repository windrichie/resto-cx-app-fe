'use client'

import { useActionState, useState, useEffect, startTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createReservation, State } from '@/lib/actions/reservation';
import { format } from "date-fns";
import { useRouter } from 'next/navigation';
import { BusinessProfile } from '@/types';
import ReservationPaymentForm from './reservation-payment-form';


interface ReservationFormProps {
  selectedDate: Date;
  selectedTime: string;
  partySize: number;
  restaurant: BusinessProfile;
  timeSlotLengthMinutes: number;
}

export default function CreateReservationForm({
  selectedDate, selectedTime, partySize, restaurant, timeSlotLengthMinutes
}: ReservationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const initialState: State = { message: '', errors: {} };
  const [state, formAction, isPending] = useActionState(createReservation, initialState);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);;
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [formRef, setFormRef] = useState<HTMLFormElement | null>(null);

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

  const handlePaymentSuccess = async (intentId: string) => {
    setPaymentIntentId(intentId);
    startTransition(() => {
      const formData = new FormData(formRef!);
      formData.append('paymentIntentId', intentId);
      formAction(formData);
    });
  };

  const handlePaymentError = (error: string) => {
    toast({
      variant: "destructive",
      title: "Payment Error",
      description: error
    });
  };


  return (
    <>
      <form ref={setFormRef} action={formAction} className="space-y-4">
        <input type="hidden" name="restaurantId" value={restaurant.id} />
        <input type="hidden" name="date" value={selectedDate.toISOString()} />
        <input type="hidden" name="timeSlotStart" value={selectedTime} />
        <input type="hidden" name="partySize" value={partySize} />
        <input type="hidden" name="timeSlotLengthMinutes" value={timeSlotLengthMinutes} />
        <input type="hidden" name="restaurantTimezone" value={restaurant.timezone} />
        <input type="hidden" name="restaurantName" value={restaurant.name} />
        <input type="hidden" name="restaurantAddress" value={restaurant.address} />
        <input type="hidden" name="restaurantImages" value={JSON.stringify(restaurant.images)} />
        {paymentIntentId && (
          <input
            type="hidden"
            name="paymentIntentId"
            value={paymentIntentId}
          />
        )}

        <h3 className="text-xl font-semibold mb-4">Reservation Details</h3>
        <p className="mb-4">
          Date: {selectedDate.toDateString()}, Time: {selectedTime}, Party Size: {partySize}
        </p>

        <div>
          <Label htmlFor="customerName">Name</Label>
          <Input
            id="customerName"
            name="customerName"
            placeholder="Your name"
            aria-describedby="customer-name-error"
          />
          <div id="customer-name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.customerName &&
              state.errors.customerName.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        <div>
          <Label htmlFor="customerEmail">Email</Label>
          <Input
            id="customerEmail"
            name="customerEmail"
            type="email"
            placeholder="your@email.com"
            onChange={(e) => setCustomerEmail(e.target.value)}
            aria-describedby="customer-email-error"
          />
          <div id="customer-email-error" aria-live="polite" aria-atomic="true">
            {state.errors?.customerEmail &&
              state.errors.customerEmail.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        <div>
          <Label htmlFor="customerPhone">Phone Number</Label>
          <Input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            placeholder="(123) 456-7890"
            aria-describedby="customer-phone-error"
          />
          <div id="customer-phone-error" aria-live="polite" aria-atomic="true">
            {state.errors?.customerPhone &&
              state.errors.customerPhone.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        <div>
          <Label htmlFor="dietaryRestrictions">Dietary Restrictions (optional)</Label>
          <Select name="dietaryRestrictions">
            <SelectTrigger>
              <SelectValue placeholder="Select dietary restriction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="vegetarian">Vegetarian</SelectItem>
              <SelectItem value="vegan">Vegan</SelectItem>
              <SelectItem value="gluten-free">Gluten-free</SelectItem>
              <SelectItem value="dairy-free">Dairy-free</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Input
            name="otherDietaryRestrictions"
            className="mt-2"
            placeholder="Please specify dietary restriction"
          />
        </div>

        <div>
          <Label htmlFor="specialOccasion">Special Occasion (optional)</Label>
          <Select name="specialOccasion">
            <SelectTrigger>
              <SelectValue placeholder="Select special occasion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="birthday">Birthday</SelectItem>
              <SelectItem value="anniversary">Anniversary</SelectItem>
              <SelectItem value="date">Date Night</SelectItem>
              <SelectItem value="business">Business Meal</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Input
            name="otherSpecialOccasion"
            className="mt-2"
            placeholder="Please specify special occasion"
          />
        </div>

        <div>
          <Label htmlFor="specialRequests">Special Requests (optional)</Label>
          <Textarea
            id="specialRequests"
            name="specialRequests"
            placeholder="Any special requests or notes"
            aria-describedby="special-requests-error"
          />
          <div id="special-requests-error" aria-live="polite" aria-atomic="true">
            {state.errors?.specialRequests &&
              state.errors.specialRequests.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        {restaurant.is_deposit_required && (
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
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              customerEmail={customerEmail}
              depositAmountInCents={restaurant.deposit_amount ?? 0}
              depositCurrency={restaurant.deposit_currency ?? 'SGD'} // default to SGD
              restaurantId={restaurant.id}
            />
          </>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || restaurant.is_deposit_required}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Reservation...
            </>
          ) : (
            'Confirm Reservation'
          )}
        </Button>

        {state.message && (
          <p className={`mt-2 text-sm ${state.errors ? 'text-red-500' : 'text-green-500'}`}>
            {state.message}
          </p>
        )}
      </form>

      {/* Successful dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="text-center max-w-md">
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckIcon className="h-8 w-8 text-green-500" />
            </div>
            <DialogTitle className="text-xl text-center">Reservation confirmed</DialogTitle>
            <div className="text-sm text-center">
              <span className="text-muted-foreground">Email sent to</span> <br />
              {customerEmail}
            </div>
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
            <Button
              className="w-full"
              onClick={() => {
                setShowSuccessDialog(false);
                router.push(state.reservationLink || `/${restaurant.slug}`);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Failed dialog */}
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