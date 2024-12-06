'use client'

import { useActionState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createReservation, State } from '@/lib/actions/reservation';

interface ReservationFormProps {
  selectedDate: Date;
  selectedTime: string;
  partySize: number;
  restaurantId: number;
}

export default function ReservationForm({
  selectedDate, selectedTime, partySize, restaurantId
}: ReservationFormProps) {
  const { toast } = useToast();
  const initialState: State = { message: null, errors: {} };
  const [state, formAction] = useActionState(createReservation, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="date" value={selectedDate.toISOString()} />
      <input type="hidden" name="timeSlotStart" value={selectedTime} />
      <input type="hidden" name="partySize" value={partySize} />

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
        <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
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
        <Label htmlFor="specialOccasion">Special Occasion</Label>
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
        <Label htmlFor="specialRequests">Special Requests</Label>
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

      <Button type="submit" className="w-full">
        Confirm Reservation
      </Button>

      {state.message && (
        <p className={`mt-2 text-sm ${state.errors ? 'text-red-500' : 'text-green-500'}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}