"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { EventList, EventListProps } from "@/components/features/events/event-list"
import { ContactList } from "@/components/features/contacts/contact-list"
import { ContactDetail } from "@/components/features/contacts/contact-detail"
import { TaskList } from "@/components/features/tasks/task-list"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, Users, CheckSquare, User } from "lucide-react"
import { ContactForm } from "@/components/features/contacts/contact-form"
import { ProfileSection } from "@/components/features/profile/profile-section"
import { CreateOptions } from "@/components/common/create-options"
import { EventSelector } from "@/components/features/events/event-selector"
import { ClientEventForm } from "@/components/features/events/client-event-form"
import { toast } from "@/components/ui/use-toast"
import { Event, Contact, Task, ActionItem, Profile } from "@/types/models"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DeleteEventDialog } from "@/components/features/events/delete-event-dialog"

export default function Dashboard() {
  console.log("Dashboard component rendering");
  
  const renderCountRef = useRef(0);
  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`Dashboard render count: ${renderCountRef.current}`);
    if (renderCountRef.current > 25) {
      console.error("Potential infinite rendering detected in Dashboard");
    }
  }, []);
  
  const [activeTab, setActiveTab] = useState("events")
  const [showEventForm, setShowEventForm] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null)
  const [showCreateOptions, setShowCreateOptions] = useState(false)
  const [showEventSelector, setShowEventSelector] = useState(false)
  const [uiEvents, setUIEvents] = useState<Event[]>([])
  const [uiContacts, setUIContacts] = useState<Contact[]>([])
  const [uiActionItems, setUIActionItems] = useState<ActionItem[]>([])
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Fetching events, contacts, action items...");
        
        const [eventsRes, contactsRes, actionsRes] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/contacts'),
          fetch('/api/tasks')
        ]);

        if (!eventsRes.ok) throw new Error(`Failed to fetch events: ${eventsRes.statusText}`);
        if (!contactsRes.ok) throw new Error(`Failed to fetch contacts: ${contactsRes.statusText}`);
        if (!actionsRes.ok) throw new Error(`Failed to fetch tasks: ${actionsRes.statusText}`);
        
        const eventsData = await eventsRes.json();
        const contactsData = await contactsRes.json();
        const actionsData = await actionsRes.json();

        if (!isMounted) return;

        console.log("Events:", eventsData.data);
        console.log("Contacts:", contactsData.data);
        console.log("Action Items:", actionsData.data);

        setUIEvents(eventsData.data || []);
        setUIContacts(contactsData.data || []);
        setUIActionItems(actionsData.data || []);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  const tasks: Task[] = uiActionItems.map((item) => {
     const contact = uiContacts.find(c => c.id === item.contact_id);
     const event = uiEvents.find(e => e.id === item.event_id);
     return {
        ...item,
        contactId: item.contact_id || '',
        contactName: contact?.name || 'N/A',
        eventId: item.event_id || '', 
        eventTitle: event?.title || 'N/A',
        eventColorIndex: event?.color_index || null, 
     };
  });

  const handleCreateEvent = (newEvent: Event) => {
    setUIEvents(prev => [newEvent, ...prev]);
    setShowEventForm(false);
    toast({ title: "Event created" });

    if (showEventSelector) {
      setShowEventSelector(false);
      setSelectedEvent(newEvent);
      setShowContactForm(true);
    }
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setSelectedContact(null);
    if (showEventSelector) {
      setShowEventSelector(false);
      setShowContactForm(true);
    }
  };

  const handleBackToEvents = () => {
    setSelectedEvent(null);
    setSelectedContact(null);
    setShowContactForm(false);
    setContactToEdit(null);
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setContactToEdit(null);
    setShowContactForm(false);
  };

  const handleBackToContacts = () => {
    setSelectedContact(null);
  };

  const handleEditContact = (contact: Contact) => {
    setContactToEdit(contact);
    setSelectedEvent(uiEvents.find(e => e.id === contact.event_id) || null);
    setSelectedContact(contact);
    setShowContactForm(true);
  };

  const handleSaveContact = async (contactData: Partial<Contact>) => {
    const isUpdating = !!contactToEdit;
    const method = isUpdating ? 'PUT' : 'POST';
    const endpoint = isUpdating ? `/api/contacts/${contactToEdit?.id}` : '/api/contacts';
    const payload = { ...contactData }; 

    if (!isUpdating && !payload.event_id && selectedEvent) {
        payload.event_id = selectedEvent.id;
    }
    
    if (!isUpdating && !payload.event_id) {
        toast({ title: "Cannot save contact", description: "No event selected.", variant: "destructive" });
        return;
    }

    console.log(`Saving contact (${method}):`, payload, `to ${endpoint}`);

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isUpdating ? 'update' : 'create'} contact`);
      }

      const savedApiContact = await response.json();
      const savedContact: Contact = savedApiContact.data;

      if (isUpdating) {
        setUIContacts(prev => prev.map(c => c.id === savedContact.id ? savedContact : c));
        setSelectedContact(savedContact);
        setContactToEdit(null);
        toast({ title: "Contact updated" });
      } else {
        setUIContacts(prev => [savedContact, ...prev]);
        setSelectedContact(savedContact);
        toast({ title: "Contact created" });
      }
      setShowContactForm(false);
    } catch (err) {
      console.error("Error saving contact:", err);
      toast({ title: "Error saving contact", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
  };

  const handleCancelEdit = () => {
    const previousSelectedContact = contactToEdit;
    setContactToEdit(null);
    setShowContactForm(false);
    if (selectedContact && previousSelectedContact && selectedContact.id !== previousSelectedContact.id) {
        
    } else if (previousSelectedContact) {
        setSelectedContact(null);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, completed: boolean) => {
    const taskToUpdate = uiActionItems.find(item => item.id === taskId);
    if (!taskToUpdate) {
      console.error("Task not found for update:", taskId);
      return;
    }

    const payload = { completed }; 
    console.log("Updating task status via API:", taskId, payload);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update task');
      }

      const updatedApiTask = await response.json();
      const updatedTask: ActionItem = updatedApiTask.data;

      setUIActionItems(prev => prev.map(item => item.id === taskId ? updatedTask : item));

      toast({ title: `Task marked as ${completed ? 'complete' : 'incomplete'}` });
    
    } catch (err) {
        console.error("Error updating task status:", err);
        toast({ title: "Error updating task", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
  };

  const handleCreateOptionSelect = (option: "event" | "contact") => {
    setShowCreateOptions(false);
    if (option === "event") {
      setContactToEdit(null);
      setSelectedContact(null);
      setSelectedEvent(null);
      setShowEventForm(true);
    } else {
      setContactToEdit(null);
      if (uiEvents.length > 0) {
          if(selectedEvent) {
              setShowContactForm(true);
          } else {
              setShowEventSelector(true);
          }
      } else {
        toast({ title: "Create an Event First", description: "You need to create an event before adding contacts.", variant: "default"});
        setShowEventForm(true);
      }
    }
  };

  const handleInitiateDeleteEvent = (event: Event) => {
    console.log("Initiating delete for event:", event.title);
    setEventToDelete(event);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDeleteEvent = async (eventData: Event, contactIdsToDelete: string[]) => {
    console.log(`Confirmed delete for event: ${eventData.title} (ID: ${eventData.id})`);
    console.log(`Deleting ${contactIdsToDelete.length} associated contacts:`, contactIdsToDelete);

    try {
      if (contactIdsToDelete.length > 0) {
        const idsQueryParam = contactIdsToDelete.join(',');
        const contactResponse = await fetch(`/api/contacts?ids=${idsQueryParam}`, { 
            method: 'DELETE' 
        });
        
        if (!contactResponse.ok) {
           console.error("Failed to delete some contacts. Server response:", await contactResponse.text());
           toast({ title: "Warning", description: "Failed to delete selected contacts, but proceeding with event deletion.", variant: "destructive" });
        } else {
           setUIContacts(prev => prev.filter(c => !contactIdsToDelete.includes(c.id)));
           console.log("Successfully deleted associated contacts.");
           setUIActionItems(prev => prev.filter(item => !item.contact_id || !contactIdsToDelete.includes(item.contact_id)));
           console.log("Updated UI action items state after contact deletion.");
        }
      }

      const eventResponse = await fetch(`/api/events/${eventData.id}`, {
        method: 'DELETE',
      });

      if (!eventResponse.ok) {
        let errorMsg = `Failed to delete event ${eventData.title}`;
        try {
            const errorData = await eventResponse.json();
            errorMsg = errorData?.error?.message || errorData?.message || errorMsg;
        } catch (e) { /* Ignore parsing error */ }
        throw new Error(errorMsg);
      }

      toast({ title: "Event Deleted", description: `"${eventData.title}" was successfully deleted.` });

      setUIEvents(prev => prev.filter(e => e.id !== eventData.id));
      setUIActionItems(prev => prev.filter(item => item.event_id !== eventData.id));
      console.log("Updated UI action items state after event deletion.");

      setShowDeleteConfirmation(false);
      setEventToDelete(null);

    } catch (err) {
      console.error("Error during deletion process:", err);
      toast({ title: "Error During Deletion", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
      setShowDeleteConfirmation(false);
      setEventToDelete(null);
    }
  };

  const handleCancelDeleteEvent = () => {
    setShowDeleteConfirmation(false);
    setEventToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-4 flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-4 flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-lg font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  const renderContactForm = () => {
     if (!selectedEvent) {
        return <div className="p-4 text-center text-muted-foreground">Please select an event before adding a contact.</div>;
     }
     return (
         <ContactForm
            event={selectedEvent}
            onSave={handleSaveContact}
            onCancel={handleCancelEdit}
            existingContact={contactToEdit || undefined}
          />
      );
  }
  
  const renderEventSelector = () => (
     <EventSelector
        events={uiEvents}
        onSelectEvent={handleSelectEvent}
        onCancel={() => setShowEventSelector(false)}
        onCreateNewEvent={() => {
          setShowEventSelector(false);
          setShowEventForm(true);
        }}
      />
  );

  const renderEventForm = () => (
      <ClientEventForm 
        onSubmit={handleCreateEvent}
        onCancel={() => setShowEventForm(false)} 
        existingEvent={undefined}
      />
  );

  let mainContent;
  if (showEventForm) {
      mainContent = renderEventForm();
  } else if (showEventSelector) {
      mainContent = renderEventSelector();
  } else if (showContactForm) {
      mainContent = renderContactForm();
  } else if (selectedContact && selectedEvent) {
      mainContent = (
         <ContactDetail
            contact={selectedContact}
            event={selectedEvent}
            onBack={handleBackToContacts}
            onEdit={handleEditContact}
            onUpdateTask={handleUpdateTaskStatus}
          />
      );
  } else if (selectedEvent) {
      mainContent = (
          <div className="space-y-4">
              <div className="flex items-center">
                  <Button variant="ghost" onClick={handleBackToEvents} className="mr-2">← Back</Button>
                  <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
              </div>
              <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Contacts</h3>
                  <Button onClick={() => { setContactToEdit(null); setShowContactForm(true); }}>
                      <Plus className="mr-2 h-4 w-4" /> Add Contact
                  </Button>
              </div>
              <ContactList
                  contacts={uiContacts.filter((c) => c.event_id === selectedEvent.id)}
                  events={uiEvents}
                  compact={false}
                  onEditContact={handleEditContact}
                  onSelectContact={handleSelectContact}
              />
          </div>
      );
  } else {
      mainContent = (
          <Tabs defaultValue="events" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsContent value="events" className="mt-4 flex-grow">
                  <EventList
                    events={uiEvents as Event[]}
                    onSelectEvent={handleSelectEvent}
                    onInitiateDeleteEvent={handleInitiateDeleteEvent}
                    contacts={uiContacts}
                    searchQuery=""
                    selectedEvent={selectedEvent}
                   />
              </TabsContent>
              <TabsContent value="contacts" className="mt-4 flex-grow">
                  <ContactList 
                    contacts={uiContacts} 
                    events={uiEvents} 
                    compact={true} 
                    onEditContact={handleEditContact} 
                    onSelectContact={handleSelectContact}
                   />
              </TabsContent>
              <TabsContent value="tasks" className="mt-4 flex-grow">
                  <TaskList tasks={tasks} contacts={uiContacts} events={uiEvents} onUpdateStatus={handleUpdateTaskStatus} />
              </TabsContent>
              <TabsContent value="profile" className="mt-4 flex-grow">
                  <ProfileSection />
              </TabsContent>
          </Tabs>
      );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 pb-20 bg-background text-foreground min-h-screen flex flex-col">
      <div className="flex-grow overflow-auto">
          {mainContent}
      </div>

      {!selectedEvent && !selectedContact && !showContactForm && !showEventForm && !showEventSelector && (
           <div className="fixed bottom-0 left-0 right-0 z-10 flex h-16 w-full justify-around bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] dark:bg-gray-800">
            <button
                onClick={() => setActiveTab("events")}
                className={`flex w-1/5 flex-col items-center justify-center ${
                activeTab === "events"
                    ? "text-primary"
                    : "text-gray-500 dark:text-gray-400"
                }`}
            >
                <Calendar className="h-6 w-6" />
                <span className="text-xs">Events</span>
            </button>
            <button
                onClick={() => setActiveTab("contacts")}
                className={`flex w-1/5 flex-col items-center justify-center ${
                activeTab === "contacts"
                    ? "text-primary"
                    : "text-gray-500 dark:text-gray-400"
                }`}
            >
                <Users className="h-6 w-6" />
                <span className="text-xs">Contacts</span>
            </button>
            <button
                onClick={() => setShowCreateOptions(true)}
                className="flex w-1/5 flex-col items-center justify-center rounded-full bg-primary p-1 text-white"
            >
                <Plus className="h-6 w-6" />
                <span className="text-xs">New</span>
            </button>
            <button
                onClick={() => setActiveTab("tasks")}
                className={`flex w-1/5 flex-col items-center justify-center ${
                activeTab === "tasks"
                    ? "text-primary"
                    : "text-gray-500 dark:text-gray-400"
                }`}
            >
                <CheckSquare className="h-6 w-6" />
                <span className="text-xs">Tasks</span>
            </button>
            <button
                onClick={() => setActiveTab("profile")}
                className={`flex w-1/5 flex-col items-center justify-center ${
                activeTab === "profile"
                    ? "text-primary"
                    : "text-gray-500 dark:text-gray-400"
                }`}
            >
                <User className="h-6 w-6" />
                <span className="text-xs">Profile</span>
            </button>
           </div>
       )}

      {showCreateOptions && (
        <CreateOptions 
          onCreateEvent={() => handleCreateOptionSelect("event")} 
          onCreateContact={() => handleCreateOptionSelect("contact")} 
          onClose={() => setShowCreateOptions(false)}
          showContactOption={uiEvents.length > 0} 
        />
      )}

      <DeleteEventDialog
        event={eventToDelete}
        contacts={uiContacts}
        isOpen={showDeleteConfirmation}
        onClose={handleCancelDeleteEvent}
        onConfirmDelete={handleConfirmDeleteEvent}
      />
    </div>
  )
}
