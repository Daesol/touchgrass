"use client"

import type React from "react"

import { useState } from "react"
import type { Event } from "@/types/models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

// Array of vibrant gradient pairs - same as in event-list.tsx
const gradients = [
  ["from-pink-500 to-rose-500", "bg-rose-50", "text-rose-700"],
  ["from-blue-500 to-cyan-500", "bg-blue-50", "text-blue-700"],
  ["from-violet-500 to-purple-500", "bg-violet-50", "text-violet-700"],
  ["from-emerald-500 to-teal-500", "bg-emerald-50", "text-emerald-700"],
  ["from-amber-500 to-orange-500", "bg-amber-50", "text-amber-700"],
  ["from-indigo-500 to-blue-500", "bg-indigo-50", "text-indigo-700"],
]

interface EventFormProps {
  onSubmit: (event: Event) => void
  onCancel: () => void
  existingEvent?: Event
}

export function EventForm({ onSubmit, onCancel, existingEvent }: EventFormProps) {
  const [title, setTitle] = useState(existingEvent?.title || "")
  const [location, setLocation] = useState(existingEvent?.location || "")
  const [company, setCompany] = useState(existingEvent?.company || "")
  const [selectedColorIndex, setSelectedColorIndex] = useState((existingEvent?.color_index || 0).toString())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const eventData: Omit<Event, "id" | "user_id" | "created_at" | "updated_at"> = {
      title: title.trim(),
      location: location.trim() || null,
      company: company.trim() || null,
      date: new Date().toLocaleDateString(),
      color_index: parseInt(selectedColorIndex),
    }

    const newEvent: Event = {
      id: existingEvent?.id || Date.now().toString(),
      user_id: existingEvent?.user_id || 'placeholder_user_id',
      ...eventData,
    }

    onSubmit(newEvent)
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
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim()}>
            {existingEvent ? "Update Event" : "Create Event"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
