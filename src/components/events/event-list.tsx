"use client"

import type { Event, Contact } from "@/components/dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Building, Users, Clock } from "lucide-react"

interface EventListProps {
  events: Event[]
  onSelectEvent: (event: Event) => void
  contacts: Contact[]
}

// Array of vibrant gradient pairs - export this for reuse
export const gradients = [
  ["from-pink-500 to-rose-500", "bg-rose-50", "text-rose-700"],
  ["from-blue-500 to-cyan-500", "bg-blue-50", "text-blue-700"],
  ["from-violet-500 to-purple-500", "bg-violet-50", "text-violet-700"],
  ["from-emerald-500 to-teal-500", "bg-emerald-50", "text-emerald-700"],
  ["from-amber-500 to-orange-500", "bg-amber-50", "text-amber-700"],
  ["from-indigo-500 to-blue-500", "bg-indigo-50", "text-indigo-700"],
]

export function EventList({ events, onSelectEvent, contacts }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
        <Calendar className="h-12 w-12 text-zinc-300" />
        <h3 className="mt-2 text-lg font-medium">No events yet</h3>
        <p className="text-sm text-zinc-500">Create your first networking event to get started</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {events.map((event) => {
        const eventContacts = contacts.filter((c) => c.eventId === event.id)
        const colorIndex = Number.parseInt(event.colorIndex || "0") % gradients.length
        const [gradientClass, bgClass, textClass] = gradients[colorIndex]

        return (
          <Card
            key={event.id}
            className="cursor-pointer overflow-hidden transition-all hover:shadow-lg"
            onClick={() => onSelectEvent(event)}
          >
            <div className={`h-2 bg-gradient-to-r ${gradientClass}`}></div>
            <CardHeader className={`pb-2 ${bgClass} bg-opacity-30`}>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className={`${textClass}`}>{event.title}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Clock className="mr-1 h-3 w-3" />
                    {event.date}
                  </CardDescription>
                </div>
                <div
                  className={`flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br ${gradientClass} text-white`}
                >
                  <span className="font-bold">{eventContacts.length}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {event.location && (
                  <div className="flex items-center text-sm text-zinc-600">
                    <MapPin className={`mr-2 h-4 w-4 ${textClass}`} />
                    {event.location}
                  </div>
                )}

                {event.company && (
                  <div className="flex items-center text-sm text-zinc-600">
                    <Building className={`mr-2 h-4 w-4 ${textClass}`} />
                    {event.company}
                  </div>
                )}

                <div className="flex items-center text-sm text-zinc-600">
                  <Users className={`mr-2 h-4 w-4 ${textClass}`} />
                  {eventContacts.length} {eventContacts.length === 1 ? "contact" : "contacts"}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
