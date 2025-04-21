"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from 'next/navigation';
import { ContactDetail } from "@/components/features/contacts/contact-detail";
import { Event, Contact, ActionItem } from "@/types/models";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function ContactDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params.contactId as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch contact, its event, and its tasks
  useEffect(() => {
    if (!contactId) return;

    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch contact first
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
          // Fetch event and tasks in parallel if contact exists
          const [eventRes, tasksRes] = await Promise.all([
            fetch(`/api/events/${fetchedContact.event_id}`),
            fetch(`/api/tasks?contact_id=${contactId}`) // Fetch tasks for this contact
          ]);
          if (!isMounted) return;
          
          if (eventRes.ok) {
             const eventData = await eventRes.json();
             setEvent(eventData.data || null);
          } else {
             console.warn(`Could not fetch event (ID: ${fetchedContact.event_id}) for contact.`);
             setEvent(null); // Set event to null if fetch fails
          }
          
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            setActionItems(tasksData.data || []);
          } else {
             console.warn('Failed to fetch tasks for this contact');
             setActionItems([]);
          }
        } else {
          // No event ID associated with contact
          setEvent(null);
          setActionItems([]);
        }

      } catch (err) {
        console.error('Error fetching contact detail data:', err);
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [contactId]);

  // --- Action/Navigation Handlers ---
  const handleBack = () => {
    // Go back to the previous page, or default to contacts list
    // Consider going back to the event detail page if context is available
    router.back(); 
  };

  const handleEdit = () => {
    router.push(`/dashboard/contacts/${contactId}/edit`);
  };

  // Task Status Update Logic (copied from TasksPage, needs actionItems state here)
   const handleUpdateTaskStatus = async (taskId: string, completed: boolean) => {
    const originalTask = actionItems.find(item => item.id === taskId);
    const originalStatus = originalTask?.completed ?? null;

    setActionItems(prev => prev.map(item => item.id === taskId ? { ...item, completed: completed } : item));

    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update task');
        }
        const updatedApiTask = await response.json();
        const updatedActionItem: ActionItem = updatedApiTask.data;
        setActionItems(prev => prev.map(item => item.id === taskId ? updatedActionItem : item));
        toast({ title: `Task marked as ${completed ? 'complete' : 'incomplete'}` });
    } catch (err) {
        console.error("Error updating task status:", err);
        toast({ title: "Error updating task", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
        setActionItems(prev => prev.map(item => item.id === taskId ? { ...item, completed: originalStatus } : item));
    }
  };
  // --- End Handlers ---

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

  if (!contact) {
     return (
       <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
         <p>Contact not found.</p>
         <Button variant="outline" size="sm" onClick={handleBack} className="mt-4">Go Back</Button>
       </div>
     );
  }
  
  // Prepare event prop for ContactDetail, handling null case
  const eventProp = event ? { 
      ...event, 
      color_index: String(event.color_index || '0') 
  } : {
      id: '', // Provide default empty values if event is null
      title: 'Unknown Event',
      color_index: '0'
  };

  return (
    <div className="space-y-4">
        {/* Header with Back button - can enhance later */}
         <div className="flex items-center space-x-2 mb-4">
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            {/* Optionally add contact name here */}
         </div>
         
        <ContactDetail
            contact={contact}
            event={eventProp} // Pass the prepared event prop
            onBack={handleBack}
            onEdit={handleEdit}
            onUpdateTask={handleUpdateTaskStatus} // Pass the handler
            // We need to pass the fetched actionItems here if ContactDetail expects them
            // Assuming ContactDetail might fetch its own tasks or accept them as props
            // actionItems={actionItems} // Uncomment if ContactDetail accepts actionItems prop
        />
    </div>
  );
} 