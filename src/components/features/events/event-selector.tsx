"use client"

import { useState } from "react"
import type { Event } from "@/types/models"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Building, ArrowLeft, ArrowRight } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface EventSelectorProps {
  events: Event[]
  onSelectEvent: (event: Event) => void
  onCancel: () => void
  onCreateNewEvent: () => void
}

export function EventSelector({ events, onSelectEvent, onCancel, onCreateNewEvent }: EventSelectorProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(events.length > 0 ? events[0].id : "")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredEvents = events.filter((event) => event.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleContinue = () => {
    const selectedEvent = events.find((event) => event.id === selectedEventId)
    if (selectedEvent) {
      onSelectEvent(selectedEvent)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onCancel} className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <CardTitle>Select Event</CardTitle>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search-events">Search Events</Label>
          <Input
            id="search-events"
            placeholder="Search by event name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredEvents.length > 0 ? (
          <RadioGroup value={selectedEventId} onValueChange={setSelectedEventId} className="space-y-3">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start space-x-3 rounded-md border p-3 cursor-pointer hover:bg-muted"
                onClick={() => setSelectedEventId(event.id)}
              >
                <RadioGroupItem value={event.id} id={event.id} className="mt-1" />
                <Label htmlFor={event.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-muted-foreground">{event.date}</div>
                  {event.location && (
                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                      <MapPin className="mr-1 h-3 w-3" />
                      {event.location}
                    </div>
                  )}
                  {event.company && (
                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                      <Building className="mr-1 h-3 w-3" />
                      {event.company}
                    </div>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-2 text-lg font-medium">No matching events</h3>
            <p className="text-sm text-muted-foreground">
              {events.length > 0 ? "Try adjusting your search query" : "You need to create an event first"}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-4">
          <Button onClick={handleContinue} disabled={!selectedEventId} className="w-full">
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={onCreateNewEvent} className="w-full">
            <Calendar className="mr-2 h-4 w-4" />
            Create New Event
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
