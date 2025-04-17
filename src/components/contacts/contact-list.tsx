"use client"

import type { Contact } from "@/components/dashboard"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Briefcase, CheckSquare, Edit, User, Search, Filter } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { gradients } from "@/components/events/event-list"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users } from "lucide-react"

interface ContactListProps {
  contacts: Contact[]
  events: { id: string; title: string; colorIndex: string }[] // Make events required
  compact?: boolean
  onEditContact?: (contact: Contact) => void
  onSelectContact?: (contact: Contact) => void
}

export function ContactList({ contacts, events, compact = false, onEditContact, onSelectContact }: ContactListProps) {
  // Add state for search and filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  // Search is always visible now
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Filter contacts based on search query and filters
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Text search
      const matchesSearch =
        searchQuery === "" ||
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.summary.toLowerCase().includes(searchQuery.toLowerCase())

      // Event filter
      const matchesEvent = selectedEvent === "all" || contact.eventId === selectedEvent

      // Rating filter
      const matchesRating =
        ratingFilter === "all" ||
        (ratingFilter === "5" && contact.rating === 5) ||
        (ratingFilter === "4" && contact.rating === 4) ||
        (ratingFilter === "3" && contact.rating === 3) ||
        (ratingFilter === "2" && contact.rating === 2) ||
        (ratingFilter === "1" && contact.rating === 1)

      return matchesSearch && matchesEvent && matchesRating
    })
  }, [contacts, searchQuery, selectedEvent, ratingFilter])

  // Function to get color based on rating
  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 5:
        return "border-l-emerald-500" // Excellent - Green
      case 4:
        return "border-l-blue-500" // Good - Blue
      case 3:
        return "border-l-amber-500" // Average - Amber
      case 2:
        return "border-l-orange-500" // Below average - Orange
      case 1:
        return "border-l-rose-500" // Poor - Red
      default:
        return "border-l-gray-300" // No rating
    }
  }

  // Function to get background color for rating circle
  const getRatingBgColor = (rating: number) => {
    switch (rating) {
      case 5:
        return "bg-emerald-500" // Excellent - Green
      case 4:
        return "bg-blue-500" // Good - Blue
      case 3:
        return "bg-amber-500" // Average - Amber
      case 2:
        return "bg-orange-500" // Below average - Orange
      case 1:
        return "bg-rose-500" // Poor - Red
      default:
        return "bg-gray-300" // No rating
    }
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
        <Users className="h-12 w-12 text-zinc-300" />
        <h3 className="mt-2 text-lg font-medium">No contacts yet</h3>
        <p className="text-sm text-muted-foreground">Add contacts from your networking events</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            title={showAdvancedFilters ? "Hide Filters" : "Show Filters"}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {showAdvancedFilters && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-filter">Event</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger id="event-filter">
                  <SelectValue placeholder="Filter by event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating-filter">Rating</Label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger id="rating-filter">
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground">
          {filteredContacts.length} {filteredContacts.length === 1 ? "contact" : "contacts"} found
        </div>
      </div>

      <div className="space-y-3">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
            <Search className="h-8 w-8 text-zinc-300" />
            <h3 className="mt-2 text-lg font-medium">No matching contacts</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            // Rest of the existing code for rendering contact cards
            const event = events.find((e) => e.id === contact.eventId)
            const colorIndex = event ? Number.parseInt(event.colorIndex || "0") : 0
            const [gradientClass, bgClass] = gradients[colorIndex % gradients.length]

            return (
              <Card
                key={contact.id}
                className={`overflow-hidden ${onSelectContact ? "cursor-pointer hover:shadow-md transition-shadow dark:hover:shadow-zinc-800" : ""} border-l-4 ${getRatingColor(contact.rating)}`}
                onClick={() => onSelectContact && onSelectContact(contact)}
              >
                <CardContent className={compact ? "p-3" : "p-4"}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact.name)}`}
                              alt={contact.name}
                            />
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className={`font-medium ${compact ? "text-base" : "text-lg"}`}>{contact.name}</h3>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < contact.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {onEditContact && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditContact(contact)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 mt-2">
                        <Badge
                          variant="outline"
                          className={`mr-2 border-0 text-white bg-gradient-to-r ${gradientClass}`}
                        >
                          {contact.eventTitle}
                        </Badge>

                        <div className="flex items-center text-xs text-zinc-500">
                          <Briefcase className="mr-1 h-3 w-3" />
                          <span>
                            {contact.position} at {contact.company}
                          </span>
                        </div>
                      </div>

                      {!compact && (
                        <>
                          <p className="text-sm text-zinc-700 mt-2">{contact.summary}</p>

                          {contact.actionItems.length > 0 && (
                            <div className="mt-2">
                              <h4 className="text-xs font-medium text-zinc-500">Action Items:</h4>
                              <ul className="mt-1 space-y-1">
                                {contact.actionItems.slice(0, 2).map((item, index) => (
                                  <li key={index} className="flex items-center text-xs text-zinc-600">
                                    <CheckSquare className="mr-1 h-3 w-3 shrink-0" />
                                    <span className={item.completed ? "line-through" : ""}>
                                      {item.text}
                                      <span className="ml-1 text-zinc-400">
                                        ({format(parseISO(item.dueDate), "MMM d")})
                                      </span>
                                    </span>
                                  </li>
                                ))}
                                {contact.actionItems.length > 2 && (
                                  <li className="text-xs text-zinc-400">+{contact.actionItems.length - 2} more</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {!compact && (
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${getRatingBgColor(contact.rating)}`}
                      >
                        <span className="text-sm font-medium">{contact.rating}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
