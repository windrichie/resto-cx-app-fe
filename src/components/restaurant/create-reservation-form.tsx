'use client'

import { useActionState, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckIcon } from "lucide-react";
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


interface ReservationFormProps {
  selectedDate: Date;
  selectedTime: string;
  partySize: number;
  restaurantId: number;
  restaurantName: string;
  timeSlotLength: number;
  restaurantTimezone: string;
}

export default function CreateReservationForm({
  selectedDate, selectedTime, partySize, restaurantId, restaurantName, timeSlotLength, restaurantTimezone
}: ReservationFormProps) {
  const { toast } = useToast();
  const initialState: State = { message: '', errors: {} };
  const [state, formAction, isPending] = useActionState(createReservation, initialState);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);;
  const [customerEmail, setCustomerEmail] = useState<string>('');

  // Watch for successful submission
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
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <input type="hidden" name="date" value={selectedDate.toISOString()} />
        <input type="hidden" name="timeSlotStart" value={selectedTime} />
        <input type="hidden" name="partySize" value={partySize} />
        <input type="hidden" name="timeSlotLength" value={timeSlotLength} />
        <input type="hidden" name="restaurantTimezone" value={restaurantTimezone} />

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

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
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
            <Button
              className="w-full"
              onClick={() => setShowSuccessDialog(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}