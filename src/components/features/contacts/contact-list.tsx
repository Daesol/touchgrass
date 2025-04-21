"use client"

import type { Contact, Event } from "@/types/models"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Briefcase, CheckSquare, Edit, User, Search, Filter } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { gradients } from "@/components/features/events/event-list"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface ContactListProps {
  contacts: Contact[]
  events: Event[]
  compact?: boolean
  onEditContact?: (contact: Contact) => void
  onSelectContact?: (contact: Contact) => void
  isSelectionMode?: boolean
  selectedContactIds?: string[]
  onToggleSelection?: (contactId: string) => void
}

export function ContactList({ contacts, events, compact = false, onEditContact, onSelectContact, isSelectionMode = false, selectedContactIds = [], onToggleSelection }: ContactListProps) {
  // Add state for search and filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Filter contacts based on search query and filters
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Text search (handle potential nulls)
      const nameMatch = contact.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const positionMatch = contact.position?.toLowerCase().includes(searchQuery.toLowerCase());
      const companyMatch = contact.company?.toLowerCase().includes(searchQuery.toLowerCase());
      const summaryMatch = contact.summary?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = searchQuery === "" || nameMatch || positionMatch || companyMatch || summaryMatch;

      // Event filter (use event_id)
      const matchesEvent = selectedEvent === "all" || contact.event_id === selectedEvent

      // Rating filter removed
      return matchesSearch && matchesEvent
    })
  }, [contacts, searchQuery, selectedEvent])

  const handleCardClick = (contact: Contact) => {
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection(contact.id);
    } else if (onSelectContact) {
      onSelectContact(contact);
    }
  };

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
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            title={showAdvancedFilters ? "Hide Filters" : "Show Filters"}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {showAdvancedFilters && (
          <div className="grid gap-4 md:grid-cols-1">
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
            const event = events.find((e) => e.id === contact.event_id)
            // Parse color_index string to number, default to 0 if invalid or null
            const colorIndex = parseInt(event?.color_index ?? '0', 10);
            const validColorIndex = isNaN(colorIndex) ? 0 : colorIndex;
            const [gradientClass, bgClass] = gradients[validColorIndex % gradients.length]
            const isSelected = isSelectionMode && selectedContactIds.includes(contact.id);

            return (
              <Card
                key={contact.id}
                className={`overflow-hidden border-l-4 border-l-gray-300 transition-all duration-150 ease-in-out 
                    ${isSelectionMode ? "cursor-pointer" : (onSelectContact ? "cursor-pointer hover:shadow-md dark:hover:shadow-zinc-800" : "")}
                    ${isSelected ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-background" : ""}
                `}
                onClick={() => handleCardClick(contact)}
              >
                <CardContent className={compact ? "p-3" : "p-4"}>
                  <div className="flex items-start justify-between">
                    {isSelectionMode && (
                      <div className="mr-3 flex h-full items-center pr-2">
                        <Checkbox
                          id={`select-${contact.id}`}
                          checked={isSelected}
                          onCheckedChange={() => onToggleSelection && onToggleSelection(contact.id)}
                          aria-label={`Select contact ${contact.name}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
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
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          {onEditContact && !isSelectionMode && (
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
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 mt-2">
                        <Badge
                          variant="outline"
                          className={`mr-2 border-0 text-white bg-gradient-to-r ${gradientClass}`}
                        >
                          {event?.title || "Unknown Event"}
                        </Badge>

                        <div className="flex items-center text-xs text-zinc-500">
                          <Briefcase className="mr-1 h-3 w-3" />
                          <span>
                            {contact.position || "N/A"} at {contact.company || "N/A"}
                          </span>
                        </div>
                      </div>

                      {!compact && (
                        <>
                          <p className="text-sm text-zinc-700 mt-2">{contact.summary || "No summary"}</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
