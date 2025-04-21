"use client"

import React, { useState } from "react"
import type { Event } from "@/types/models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

// Array of vibrant gradient pairs - same as in event-list.tsx
const gradients = [
  ["from-pink-500 to-rose-500", "bg-rose-50", "text-rose-700"],
  ["from-blue-500 to-cyan-500", "bg-blue-50", "text-blue-700"],
  ["from-violet-500 to-purple-500", "bg-violet-50", "text-violet-700"],
  ["from-emerald-500 to-teal-500", "bg-emerald-50", "text-emerald-700"],
  ["from-amber-500 to-orange-500", "bg-amber-50", "text-amber-700"],
  ["from-indigo-500 to-blue-500", "bg-indigo-50", "text-indigo-700"],
]

interface ClientEventFormProps {
  onSubmit: (event: Event) => void
  onCancel: () => void
  existingEvent?: Event
}

export function ClientEventForm({ onSubmit, onCancel, existingEvent }: ClientEventFormProps) {
  const [title, setTitle] = useState(existingEvent?.title || "")
  const [location, setLocation] = useState(existingEvent?.location || "")
  const [company, setCompany] = useState(existingEvent?.company || "")
  const [selectedColorIndex, setSelectedColorIndex] = useState((existingEvent?.color_index || 0).toString())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!title.trim()) {
      setIsSubmitting(false)
      return
    }

    try {
      // Create event payload
      const eventPayload = {
        title: title.trim(),
        location: location.trim() || null,
        company: company.trim() || null,
        date: new Date().toISOString().split('T')[0],
        color_index: selectedColorIndex,
      };
      
      // Log the payload for debugging
      console.log('Sending event data to API:', eventPayload);

      // Add to Supabase through API
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      })

      // Handle different response types
      if (!response.ok) {
        // Try to get error details from the response
        try {
          const errorData = await response.json();
          console.error('Server error:', errorData);
          let errorMessage = 'Failed to create event';
          
          if (errorData.details && errorData.details.message) {
            errorMessage = errorData.details.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
          
          throw new Error(errorMessage);
        } catch (parseError) {
          // If we can't parse the error, use status text
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      // Parse success response
      const apiResponse = await response.json()
      console.log('Event created successfully. Server response:', apiResponse);

      // Ensure the API call was successful and data is present
      if (!apiResponse.success || !apiResponse.data) {
        throw new Error("API returned success but data field is missing.");
      }
      
      // Extract event data from the nested 'data' field
      const eventData = apiResponse.data; 

      // Convert the server response to our UI event format
      const newEvent: Event = {
        id: eventData.id,
        title: eventData.title,
        location: eventData.location || null,
        company: eventData.company || null,
        date: eventData.date, // Assuming API returns date in correct format
        color_index: eventData.color_index || null, // Use null as fallback if missing
        user_id: eventData.user_id,
        // Include optional fields if they exist in the response
        description: eventData.description || null,
        completed: eventData.completed || false, 
        created_at: eventData.created_at,
        updated_at: eventData.updated_at,
      };
      
      toast({
        title: "Event created",
        description: "Your event has been created successfully."
      })
      
      // Pass to parent component
      onSubmit(newEvent)
    } catch (error) {
      // Handle the error and show it to the user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error creating event';
      console.error('Error creating event:', error);
      setError(errorMessage);
      
      toast({
        title: "Error creating event",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{existingEvent ? "Edit Event" : "Create New Event"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title*</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tech Conference 2023"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company (Optional)</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="TechCorp Inc."
            />
          </div>

          <div className="space-y-2">
            <Label>Event Color</Label>
            <div className="flex flex-wrap gap-2">
              {gradients.map((gradient, index) => {
                const [gradientClass] = gradient
                return (
                  <button
                    key={index}
                    type="button"
                    className={`h-8 w-8 rounded-full bg-gradient-to-r ${gradientClass} ${
                      selectedColorIndex === index.toString() ? "ring-2 ring-offset-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedColorIndex(index.toString())}
                    aria-label={`Color option ${index + 1}`}
                  />
                )
              })}
            </div>
          </div>

          {/* Preview of the event card */}
          <div className="mt-4">
            <Label>Preview</Label>
            <div className="mt-2 border rounded-lg overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${gradients[parseInt(selectedColorIndex)][0]}`}></div>
              <div className={`p-4 ${gradients[parseInt(selectedColorIndex)][1]} bg-opacity-30`}>
                <div className="font-medium">{title || "Event Title"}</div>
                <div className="text-sm text-zinc-500">{location || "Location"}</div>
                {company && <div className="text-sm text-zinc-500">{company}</div>}
              </div>
            </div>
          </div>
          
          {/* Error message display */}
          {error && (
            <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? "Creating..." : existingEvent ? "Update Event" : "Create Event"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 