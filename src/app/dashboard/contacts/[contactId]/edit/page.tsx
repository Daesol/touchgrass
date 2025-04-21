"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from 'next/navigation';
import { ContactForm } from "@/components/features/contacts/contact-form";
import { Event, Contact, ActionItem } from "@/types/models";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function EditContactPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params.contactId as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  // Action items are handled within ContactForm, but we might need initial ones
  // const [initialActionItems, setInitialActionItems] = useState<ActionItem[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing contact data and its event
  useEffect(() => {
    if (!contactId) return;

    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const contactRes = await fetch(`/api/contacts/${contactId}`);
        if (!isMounted) return;
        if (!contactRes.ok) {
          const errorData = await contactRes.json();
          throw new Error(errorData.message || `Contact not found (ID: ${contactId})`);
        }
        const contactData = await contactRes.json();
        const fetchedContact: Contact | null = contactData.data;
        setContact(fetchedContact);

        if (fetchedContact?.event_id) {
          const eventRes = await fetch(`/api/events/${fetchedContact.event_id}`);
           if (!isMounted) return;
           if (eventRes.ok) {
              const eventData = await eventRes.json();
              setEvent(eventData.data || null);
           } else {
              console.warn(`Could not fetch event (ID: ${fetchedContact.event_id}) for contact.`);
              setEvent(null);
           }
           // TODO: Fetch existing action items if ContactForm needs them pre-populated
           // const tasksRes = await fetch(`/api/tasks?contact_id=${contactId}`);
           // if (tasksRes.ok) setInitialActionItems((await tasksRes.json()).data || []);
           
        } else {
           setEvent(null);
        }

      } catch (err) {
        console.error('Error fetching contact data for edit:', err);
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [contactId]);

  // Handler for saving the updated contact
  const handleSaveContact = async (contactData: Partial<Contact>, actionItems: ActionItem[]) => {
    if (!contact) return; // Should not happen if form is rendered

    const payload = { ...contactData };
    console.log(`Updating contact ${contactId}:`, payload);

    try {
      // 1. Update contact data
      const contactResponse = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!contactResponse.ok) {
        const errorData = await contactResponse.json();
        throw new Error(errorData.message || 'Failed to update contact');
      }
      const savedApiContact = await contactResponse.json();
      const savedContact: Contact = savedApiContact.data;

      // 2. Handle Action Items (Create/Update/Delete logic might be needed here or in API)
      // For now, assume ContactForm handles newly added items, 
      // and existing item updates/deletions might need separate handling or API logic.
       if (actionItems && Array.isArray(actionItems)) {
         for (const item of actionItems) {
           const isPotentiallyNew = typeof item.id === 'string' && /^[0-9]+$/.test(item.id) && item.id.length > 10;
           if (isPotentiallyNew && item.title) { // Check title exists for new items
             console.log("Attempting to save new action item during update:", item);
             try {
               const taskPayload = {
                 title: item.title,
                 due_date: item.due_date,
                 contact_id: savedContact.id, // Use the saved contact ID
                 event_id: savedContact.event_id,
                 completed: false
               };
               const taskResponse = await fetch(`/api/tasks`, { 
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(taskPayload),
               });
               if (!taskResponse.ok) {
                 console.error(`Failed to save new action item "${item.title}" during update`);
                 // Non-critical error, maybe just log it
               } else {
                 console.log("Successfully saved new action item during update");
               }
             } catch (taskErr) {
               console.error(`Error saving new action item "${item.title}" during update:`, taskErr);
             }
           } else if (item.id && !isPotentiallyNew) {
              // TODO: Handle updating existing action items (PUT /api/tasks/{item.id})
              // TODO: Handle deleting action items removed in the form (DELETE /api/tasks/{item.id})
              console.log("Existing action item - update/delete logic needed:", item.id);
           }
         }
      }

      toast({ title: "Contact updated successfully!" });
      router.push(`/dashboard/contacts/${contactId}`); // Redirect back to contact detail view
      router.refresh(); // Refresh server components

    } catch (err) {
      console.error("Error updating contact:", err);
      toast({ title: "Error updating contact", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
  };

  // Handler for cancelling the edit
  const handleCancel = () => {
    router.back(); // Go back to the previous page (likely contact detail)
  };

  // --- Render Logic ---
  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-destructive">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>{error}</p>
        <Button variant="outline" size="sm" onClick={handleCancel} className="mt-4">Go Back</Button>
      </div>
    );
  }

  if (!contact || !event) {
     return (
       <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
         <p>Contact or associated event not found.</p>
         <Button variant="outline" size="sm" onClick={handleCancel} className="mt-4">Go Back</Button>
       </div>
     );
  }

  return (
    <div className="space-y-4">
       <div className="flex items-center space-x-2 mb-4">
         <Button variant="ghost" size="icon" onClick={handleCancel} aria-label="Cancel edit">
             <ArrowLeft className="h-5 w-5" />
         </Button>
         <h1 className="text-2xl font-semibold">Edit Contact: {contact.name}</h1>
       </div>
      <ContactForm
          event={event} // Pass the fetched event
          onSave={handleSaveContact}
          onCancel={handleCancel}
          existingContact={contact} // Pass the fetched contact data
          // Pass initialActionItems if ContactForm is adapted to handle them
          // initialActionItems={initialActionItems} 
        />
    </div>
  );
} 