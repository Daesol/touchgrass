"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { ContactForm } from "@/components/features/contacts/contact-form";
import { EventSelector } from "@/components/features/events/event-selector";
import { Event, Contact, ActionItem } from "@/types/models";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Wrapper component to access searchParams
function NewContactPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventIdFromQuery = searchParams.get('event_id');

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [uiEvents, setUIEvents] = useState<Event[]>([]);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true); // Loading state for initial event fetch
  const [isLoadingEventsList, setIsLoadingEventsList] = useState(false); // Loading state for event list
  const [error, setError] = useState<string | null>(null);

  // Fetch initial event if ID provided, or all events if selector needed
  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      setIsLoadingEvent(true);
      setError(null);
      try {
        if (eventIdFromQuery) {
          // Fetch the specific event passed in the query
          const eventRes = await fetch(`/api/events/${eventIdFromQuery}`);
          if (!isMounted) return;
          if (!eventRes.ok) throw new Error('Failed to fetch the selected event');
          const eventData = await eventRes.json();
          setSelectedEvent(eventData.data || null);
        } else {
          // No event ID, fetch all events to show selector
          setIsLoadingEventsList(true);
          const eventsRes = await fetch('/api/events');
          if (!isMounted) return;
          if (!eventsRes.ok) throw new Error('Failed to fetch events for selection');
          const eventsData = await eventsRes.json();
          setUIEvents(eventsData.data || []);
          if ((eventsData.data || []).length > 0) {
            setShowEventSelector(true); // Show selector if events exist
          } else {
            toast({ title: "Create an Event First", description: "You need an event to add a contact to.", variant: "default"});
            // Optionally redirect to create event page
            // router.push('/dashboard/events/new'); 
          }
          setIsLoadingEventsList(false);
        }
      } catch (err) {
        console.error('Error fetching data for new contact:', err);
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        if (isMounted) setIsLoadingEvent(false);
      }
    };

    fetchInitialData();
    return () => { isMounted = false; };
  }, [eventIdFromQuery]);

  // Handler for saving the new contact
  const handleSaveContact = async (contactData: Partial<Contact>, actionItems: ActionItem[]) => {
    if (!selectedEvent) {
        toast({ title: "Cannot save contact", description: "No event selected.", variant: "destructive" });
        return;
    }

    const payload = { 
      ...contactData, 
      event_id: selectedEvent.id // Ensure event_id is set
    }; 

    console.log(`Saving new contact:`, payload);

    try {
      // Save contact data
      const contactResponse = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!contactResponse.ok) {
        const errorData = await contactResponse.json();
        throw new Error(errorData.message || 'Failed to create contact');
      }
      const savedApiContact = await contactResponse.json();
      const savedContact: Contact = savedApiContact.data;

      // Handle Action Items (same logic as before)
      if (actionItems && Array.isArray(actionItems)) {
         for (const item of actionItems) {
           const isPotentiallyNew = typeof item.id === 'string' && /^[0-9]+$/.test(item.id) && item.id.length > 10;
           if (isPotentiallyNew) { 
             try {
               const taskPayload = {
                 title: item.title,
                 due_date: item.due_date,
                 contact_id: savedContact.id,
                 event_id: savedContact.event_id,
                 completed: false
               };
               const taskResponse = await fetch(`/api/tasks`, { 
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(taskPayload),
               });
               if (!taskResponse.ok) {
                 const taskErrorData = await taskResponse.json();
                 console.error(`Failed to save action item "${item.title}":`, taskErrorData.message || 'Unknown error');
                 toast({ title: "Warning", description: `Failed to save action item: ${item.title}`, variant: "destructive" });
               } else {
                  console.log("Successfully saved action item:", (await taskResponse.json()).data);
               }
             } catch (taskErr) {
               console.error(`Error saving action item "${item.title}":`, taskErr);
               toast({ title: "Error", description: `Error saving action item: ${item.title}`, variant: "destructive" });
             }
           }
         }
      }

      toast({ title: "Contact created successfully!" });
      // Redirect to the event detail page where the contact was added
      router.push(`/dashboard/events/${selectedEvent.id}`);
      router.refresh(); // Refresh server components

    } catch (err) {
      console.error("Error saving contact:", err);
      toast({ title: "Error saving contact", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
  };

  // Handler for cancelling the form/selector
  const handleCancel = () => {
    router.back(); // Go back
  };
  
  // Handler when an event is selected from the EventSelector
  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowEventSelector(false); // Hide selector, show form
  };
  
  // --- Render Logic ---
  if (isLoadingEvent) {
     return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }
  
  if (error) {
     return (
       <div className="flex flex-col items-center justify-center p-8 text-destructive">
         <AlertTriangle className="h-8 w-8 mb-2" />
         <p>{error}</p>
         <button onClick={() => window.location.reload()} className="mt-4 text-sm underline">Try again</button>
       </div>
     );
  }
  
  if (showEventSelector) {
     if (isLoadingEventsList) {
       return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
     }
     return (
        <div className="space-y-4">
           <h1 className="text-2xl font-semibold">Select Event for New Contact</h1>
           <EventSelector
              events={uiEvents}
              onSelectEvent={handleSelectEvent}
              onCancel={handleCancel}
              onCreateNewEvent={() => router.push('/dashboard/events/new')}
            />
        </div>
     );
  }
  
  // If an event is selected (either from query or selector), show the form
  if (selectedEvent) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">Add Contact to "{selectedEvent.title}"</h1>
          <ContactForm
              event={selectedEvent} 
              onSave={handleSaveContact}
              onCancel={handleCancel}
              existingContact={undefined} // For new contact
            />
        </div>
      );
  }

  // Fallback if no event selected and selector not shown (e.g., no events exist)
  return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
          <p>You need to select an event to add a contact.</p>
          <button onClick={handleCancel} className="mt-4 text-sm underline">Go Back</button>
      </div>
  );
}

// Need Suspense because useSearchParams is used in the child component
export default function NewContactPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
       <NewContactPageContent />
    </Suspense>
  )
} 