'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ReservationFormProps {
  selectedDate: Date;
  selectedTime: string;
  partySize: number;
}

export default function ReservationForm({ selectedDate, selectedTime, partySize }: ReservationFormProps) {
  const [dietaryRestriction, setDietaryRestriction] = useState('')
  const [specialOccasion, setSpecialOccasion] = useState('')

  return (
    <form className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Reservation Details</h3>
      <p className="mb-4">
        Date: {selectedDate.toDateString()}, Time: {selectedTime}, Party Size: {partySize}
      </p>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Your name" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="your@email.com" />
      </div>
      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" type="tel" placeholder="(123) 456-7890" />
      </div>
      <div>
        <Label htmlFor="dietary-restrictions">Dietary Restrictions</Label>
        <Select onValueChange={setDietaryRestriction}>
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
        {dietaryRestriction === 'other' && (
          <Input className="mt-2" placeholder="Please specify dietary restriction" />
        )}
      </div>
      <div>
        <Label htmlFor="special-occasion">Special Occasion</Label>
        <Select onValueChange={setSpecialOccasion}>
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
        {specialOccasion === 'other' && (
          <Input className="mt-2" placeholder="Please specify special occasion" />
        )}
      </div>
      <div>
        <Label htmlFor="special-requests">Special Requests</Label>
        <Textarea id="special-requests" placeholder="Any special requests or notes" />
      </div>
      <Button type="submit" className="w-full">Confirm Reservation</Button>
    </form>
  )
}