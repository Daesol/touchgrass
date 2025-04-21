"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from 'next/navigation';
import { ContactList } from "@/components/features/contacts/contact-list";
import { Button } from "@/components/ui/button";
import { Event, Contact } from "@/types/models";
import { Loader2, AlertTriangle, ArrowLeft, Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string; // Get event ID from route params

  const [event, setEvent] = useState<Event | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]) // Need all events for ContactList mapping
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch event details and associated contacts
  useEffect(() => {
    if (!eventId) return; // Don't fetch if eventId is not available yet

    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [eventRes, contactsRes, allEventsRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/contacts?event_id=${eventId}`), // Fetch contacts filtered by event ID
          fetch('/api/events') // Fetch all events for ContactList color mapping
        ]);

        if (!isMounted) return;

        if (!eventRes.ok) {
          const errorData = await eventRes.json();
          throw new Error(errorData.message || `Event not found (ID: ${eventId})`);
        }
        if (!contactsRes.ok) throw new Error('Failed to fetch contacts for this event');
        if (!allEventsRes.ok) throw new Error('Failed to fetch all events data');

        const eventData = await eventRes.json();
        const contactsData = await contactsRes.json();
        const allEventsData = await allEventsRes.json();

        setEvent(eventData.data || null);
        setContacts(contactsData.data || []);
        setAllEvents(allEventsData.data || []);

      } catch (err) {
        console.error('Error fetching event detail data:', err);
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [eventId]); // Re-fetch if eventId changes

  // --- Navigation Handlers ---
  const handleBack = () => {
    router.push('/dashboard/events');
  };

  const handleAddContact = () => {
    // Pass the current event ID to the new contact page
    router.push(`/dashboard/contacts/new?event_id=${eventId}`);
  };

  const handleSelectContact = (contact: Contact) => {
    router.push(`/dashboard/contacts/${contact.id}`);
  };

  const handleEditContact = (contact: Contact) => {
    router.push(`/dashboard/contacts/${contact.id}/edit`);
  };
  // --- End Navigation Handlers ---

  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-destructive">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>{error}</p>
        <Button variant="outline" size="sm" onClick={handleBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  if (!event) {
     return (
       <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
         <p>Event not found.</p>
        <Button variant="outline" size="sm" onClick={handleBack} className="mt-4">Go Back</Button>
       </div>
     );
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center space-x-2 mb-4">
          <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back to events">
              <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold truncate">{event.title}</h1>
          {/* Add event edit/delete buttons here if needed */}
      </div>
      
      {/* Event Details (Optional - Add more details as needed) */}
      {event.description && <p className="text-muted-foreground">{event.description}</p>}
      {event.date && <p className="text-sm text-muted-foreground">Date: {new Date(event.date).toLocaleDateString()}</p>}
      {event.location && <p className="text-sm text-muted-foreground">Location: {event.location}</p>}
      
      {/* Contacts Section Header */}
       <div className="flex justify-between items-center pt-4 border-t mt-4">
          <h2 className="text-xl font-semibold">Contacts ({contacts.length})</h2>
          <Button size="sm" onClick={handleAddContact}>
              <Plus className="mr-2 h-4 w-4" /> Add Contact
          </Button>
      </div>

      {/* Contact List */}
      <ContactList
          contacts={contacts} // Pass only contacts for this event
          events={allEvents} // Pass all events for color mapping
          onSelectContact={handleSelectContact}
          onEditContact={handleEditContact}
          // compact={false} // Assuming default is not compact
      />
    </div>
  );
} 