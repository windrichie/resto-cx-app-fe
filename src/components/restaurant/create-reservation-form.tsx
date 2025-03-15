'use client'

import { useActionState, useState, useEffect, startTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckIcon, XIcon, Clock, Users, Calendar } from "lucide-react";
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
import { z } from 'zod';


interface ReservationFormProps {
  selectedDate: Date;
  selectedTimeStart: string;
  selectedTimeEnd: string;
  partySize: number;
  restaurant: BusinessProfile;
  timeSlotLengthMinutes: number;
}

const CreateReservationSchema = z.object({
  restaurantId: z.string(),
  customerName: z.string().min(1, 'Name is required'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().min(8, 'Invalid phone number'),
  partySize: z.number().min(1),
  date: z.date(),
  timeSlotLengthMinutes: z.number(),
  timeSlotStart: z.string(),
  timeSlotEnd: z.string(),
  dietaryRestrictions: z.string().optional(),
  otherDietaryRestrictions: z.string().optional(),
  specialOccasion: z.string().optional(),
  otherSpecialOccasion: z.string().optional(),
  specialRequests: z.string().optional(),
  restaurantTimezone: z.string(),
  restaurantName: z.string(),
  restaurantAddress: z.string(),
  restaurantImages: z.array(z.string()),
  paymentIntentId: z.string().nullable().optional()
});

export default function CreateReservationForm({
  selectedDate, selectedTimeStart, selectedTimeEnd, partySize, restaurant, timeSlotLengthMinutes
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
  const [formErrors, setFormErrors] = useState<z.inferFormattedError<typeof CreateReservationSchema>>({ _errors: [] });

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
    const validatedFields = CreateReservationSchema.safeParse({
      restaurantId: formData.get('restaurantId'),
      customerName: formData.get('customerName'),
      customerEmail: formData.get('customerEmail'),
      customerPhone: formData.get('customerPhone'),
      partySize: parseInt(formData.get('partySize') as string),
      date: new Date(formData.get('date') as string),
      timeSlotLengthMinutes: parseInt(formData.get('timeSlotLengthMinutes') as string),
      timeSlotStart: formData.get('timeSlotStart'),
      timeSlotEnd: formData.get('timeSlotEnd'),
      dietaryRestrictions: formData.get('dietaryRestrictions'),
      otherDietaryRestrictions: formData.get('otherDietaryRestrictions'),
      specialOccasion: formData.get('specialOccasion'),
      otherSpecialOccasion: formData.get('otherSpecialOccasion'),
      specialRequests: formData.get('specialRequests'),
      restaurantTimezone: formData.get('restaurantTimezone'),
      restaurantName: formData.get('restaurantName'),
      restaurantAddress: formData.get('restaurantAddress'),
      restaurantImages: JSON.parse(formData.get('restaurantImages') as string || '[]'),
      paymentIntentId: formData.get('paymentIntentId') || null
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
        <input type="hidden" name="restaurantId" value={restaurant.id} />
        <input type="hidden" name="date" value={selectedDate.toISOString()} />
        <input type="hidden" name="selectedDate" value={selectedDate.getDate()} />
        <input type="hidden" name="selectedMonth" value={selectedDate.getMonth()} />
        <input type="hidden" name="selectedYear" value={selectedDate.getFullYear()} />
        <input type="hidden" name="timeSlotStart" value={selectedTimeStart} />
        <input type="hidden" name="timeSlotEnd" value={selectedTimeEnd} />
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
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <span className="text-sm text-gray-500">Date</span>
                <p className="font-medium">{selectedDate.toDateString()}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <span className="text-sm text-gray-500">Time</span>
                <p className="font-medium">{selectedTimeStart} - {selectedTimeEnd}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Users className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <span className="text-sm text-gray-500">Party Size</span>
                <p className="font-medium">{partySize} {partySize === 1 ? 'Guest' : 'Guests'}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="customerName">Name</Label>
          <Input
            id="customerName"
            name="customerName"
            placeholder="Your name"
            aria-describedby="customer-name-error"
          />
          <div id="customer-name-error" aria-live="polite" aria-atomic="true">
            {formErrors?.customerName?._errors.map((error: string) => (
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
            {formErrors?.customerEmail?._errors.map((error: string) => (
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
            {formErrors?.customerPhone?._errors.map((error: string) => (
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
              validateBeforePayment={validateFormFields}
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
                {format(selectedDate, 'EEE')} · {selectedTimeStart} - {selectedTimeEnd} ({restaurant.timezone})
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