"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { EventList } from "@/components/events/event-list"
import { ContactList } from "@/components/contacts/contact-list"
import { ContactDetail } from "@/components/contacts/contact-detail"
import { TaskList } from "@/components/tasks/task-list"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, Users, CheckSquare, User } from "lucide-react"
import { ContactForm } from "@/components/contacts/contact-form"
import { ProfileSection } from "@/components/profile/profile-section"
import { CreateOptions } from "@/components/common/create-options"
import { EventSelector } from "@/components/events/event-selector"
import { ClientEventForm } from "@/components/events/client-event-form"
import { toast } from "@/components/ui/use-toast"

// Define the client-side types that match how the UI needs the data
export type Event = {
  id: string
  title: string
  location: string
  company: string
  date: string
  colorIndex: string 
}

export type ActionItem = {
  id: string
  text: string
  dueDate: string
  completed: boolean
}

export type Contact = {
  id: string
  eventId: string
  eventTitle: string
  linkedinUrl: string
  name: string
  position: string
  company: string
  summary: string
  voiceMemo: {
    url: string
    transcript: string
    keyPoints: string[]
  }
  actionItems: ActionItem[]
  rating: number
  date: string
}

export type Task = ActionItem & {
  contactId: string
  contactName: string
  eventId: string
  eventTitle: string
}

// Use mock data for now to simplify
const MOCK_EVENTS: Event[] = [
  {
    id: "1",
    title: "Tech Conference 2023",
    location: "San Francisco, CA",
    company: "TechExpo",
    date: "2023-06-15",
    colorIndex: "2"
  },
  {
    id: "2",
    title: "Networking Mixer",
    location: "New York, NY",
    company: "Business Network",
    date: "2023-07-20",
    colorIndex: "5"
  }
];

const MOCK_CONTACTS: Contact[] = [
  {
    id: "1",
    eventId: "1",
    eventTitle: "Tech Conference 2023",
    linkedinUrl: "https://linkedin.com/in/johndoe",
    name: "John Doe",
    position: "Senior Developer",
    company: "TechCorp",
    summary: "Met at the JavaScript workshop. Interested in collaboration.",
    voiceMemo: {
      url: "",
      transcript: "",
      keyPoints: []
    },
    actionItems: [
      {
        id: "1-1",
        text: "Send follow-up email",
        dueDate: "2023-06-20",
        completed: false
      },
      {
        id: "1-2",
        text: "Share project proposal",
        dueDate: "2023-06-25",
        completed: true
      }
    ],
    rating: 4,
    date: "2023-06-15"
  }
];

export default function Dashboard() {
  console.log("Dashboard component rendering");
  
  // For debugging purposes
  const renderCountRef = useRef(0);
  
  // Track render count
  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`Dashboard render count: ${renderCountRef.current}`);
    
    // Report when we might be in an infinite loop
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
  
  // Fetch events from API endpoint instead of using server actions
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        
        // Fetch events from the API
        const response = await fetch('/api/events');
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const eventsData = await response.json();
        setUIEvents(eventsData);
        
        // After fetching events, fetch contacts
        await fetchContacts();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
        setIsLoading(false);
      }
    };

    const fetchContacts = async () => {
      try {
        // Fetch contacts from the API
        const response = await fetch('/api/contacts');
        
        if (!response.ok) {
          throw new Error('Failed to fetch contacts');
        }
        
        const contactsData = await response.json();
        setUIContacts(contactsData);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        // Don't set error state here as we already have events loaded
      }
    };
    
    // For development mock data fallback
    const setMockContacts = () => {
      // Only set mock contacts if we don't have any from the API
      if (uiContacts.length === 0) {
        setUIContacts(MOCK_CONTACTS);
      }
    };
    
    fetchEvents();
    
    // Set some mock contacts for development
    if (process.env.NODE_ENV === 'development') {
      setMockContacts();
    }
  }, []);

  // Derive tasks from contacts and their action items
  const tasks: Task[] = uiContacts.flatMap((contact) =>
    contact.actionItems.map((item) => ({
      ...item,
      contactId: contact.id,
      contactName: contact.name,
      eventId: contact.eventId,
      eventTitle: contact.eventTitle,
    })),
  )

  const handleCreateEvent = async (event: Event) => {
    // Client-side form will handle the API call and UI updates
    // Just add the new event to our UI state
    setUIEvents(prev => [event, ...prev]);
    setShowEventForm(false);

    // If we were in the event selector flow, continue to contact form with the new event
    if (showEventSelector) {
      setShowEventSelector(false);
      setSelectedEvent(event);
      setShowContactForm(true);
    }
  }

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event)
    setSelectedContact(null)

    // If we're in the event selector flow, continue to contact form
    if (showEventSelector) {
      setShowEventSelector(false)
      setShowContactForm(true)
    }
  }

  const handleBackToEvents = () => {
    setSelectedEvent(null)
    setSelectedContact(null)
    setShowContactForm(false)
  }

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact)
    setContactToEdit(null)
  }

  const handleBackToContacts = () => {
    setSelectedContact(null)
  }

  const handleAddContact = (contact: Contact) => {
    setUIContacts([...uiContacts, contact])
    setShowContactForm(false)
  }

  const handleEditContact = (contact: Contact) => {
    setContactToEdit(contact)

    // If we're in event view or contact detail view, we need to make sure we're showing the contact form
    if (selectedEvent || selectedContact) {
      setShowContactForm(true)
    } else {
      // If we're in the main tabs view, switch to contacts tab
      setActiveTab("contacts")
    }
  }

  // Helper function to perform a proper logout
  const handleLogout = async () => {
    try {
      console.log("Logging out and clearing auth");
      
      // First clear all cookies using our clearall endpoint
      await fetch('/api/auth/clearall', { method: 'POST' });
      
      // Then call the normal logout endpoint
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache, no-store'
        }
      });
      
      if (!response.ok) {
        console.error('Logout failed:', response.statusText);
      }
      
      // Force reload the page to clear any cached state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: direct to login
      window.location.href = '/login';
    }
  };

  // Helper function to clear browser cache and reload
  const handleClearCache = () => {
    try {
      // Clear localStorage items related to this app
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('touchgrass') || key.includes('networkpro') || key.includes('contact'))) {
          localStorage.removeItem(key);
        }
      }
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Force a hard reload to bypass cache
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Failed to clear cache. Try manually clearing your browser cache.');
    }
  };

  const handleSaveContact = async (updatedContact: Contact) => {
    try {
      console.log("handleSaveContact called with:", updatedContact);
      
      // Check if this is an update or a new contact
      if (contactToEdit) {
        console.log("Updating existing contact");
        // Update existing contact - Future: implement PUT to contacts API
        const updatedContacts = uiContacts.map((c) => (c.id === updatedContact.id ? updatedContact : c))
        setUIContacts(updatedContacts)

        // If we were viewing this contact's details, update the selected contact
        if (selectedContact && selectedContact.id === updatedContact.id) {
          setSelectedContact(updatedContact)
        }

        setContactToEdit(null)
      } else {
        console.log("Creating new contact via API");
        // Add new contact via API
        const response = await fetch('/api/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedContact),
        });

        console.log("API response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error saving contact:', errorData);
          alert("Failed to save contact. See console for details.");
        } else {
          const apiContact = await response.json();
          console.log("Received new contact from API:", apiContact);
          
          // Transform the API response to match client-side format
          const clientContact: Contact = {
            id: apiContact.id,
            eventId: apiContact.event_id || "",
            eventTitle: apiContact.event_title || "",
            linkedinUrl: apiContact.linkedin_url || "",
            name: apiContact.name || "",
            position: apiContact.position || "",
            company: apiContact.company || "",
            summary: apiContact.summary || "",
            voiceMemo: {
              url: apiContact.voice_memo?.url || "",
              transcript: apiContact.voice_memo?.transcript || "",
              keyPoints: apiContact.voice_memo?.key_points || []
            },
            actionItems: [], // Initialize with empty array since new contacts don't have action items yet
            rating: apiContact.rating || 0,
            date: apiContact.date ? new Date(apiContact.date).toLocaleDateString() : new Date().toLocaleDateString()
          };
          
          // Add the properly formatted contact to UI state
          setUIContacts([...uiContacts, clientContact]);
        }
      }

      setShowContactForm(false)
    } catch (error) {
      console.error('Failed to save contact:', error);
      alert("An error occurred while saving the contact. Please try again.");
    }
  }

  const handleCancelEdit = () => {
    setContactToEdit(null)
    setShowContactForm(false)
  }

  const handleUpdateTaskStatus = (taskId: string, completed: boolean) => {
    const updatedContacts = uiContacts.map((contact) => {
      const updatedItems = contact.actionItems.map((item) => (item.id === taskId ? { ...item, completed } : item))

      if (JSON.stringify(updatedItems) !== JSON.stringify(contact.actionItems)) {
        return { ...contact, actionItems: updatedItems }
      }
      return contact
    })

    setUIContacts(updatedContacts)

    // If we're viewing a contact's details, update the selected contact
    if (selectedContact) {
      const updatedContact = updatedContacts.find((c) => c.id === selectedContact.id)
      if (updatedContact) {
        setSelectedContact(updatedContact)
      }
    }
  }

  const handleCreateOptionSelect = (option: "event" | "contact") => {
    setShowCreateOptions(false)

    if (option === "event") {
      setShowEventForm(true)
    } else {
      // For creating a contact, show the event selector first
      if (uiEvents.length > 0) {
        setShowEventSelector(true)
      } else {
        // If no events exist, show event form first
        setShowEventForm(true)
      }
    }
  }

  // Handle when the event form is showing
  if (showEventForm) {
    return (
      <div className="container mx-auto max-w-4xl p-4 bg-background">
        <header className="mb-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => setShowEventForm(false)} className="mr-2">
              ← Back
            </Button>
            <h2 className="text-xl font-semibold">Create New Event</h2>
          </div>
        </header>
        
        <ClientEventForm 
          onSubmit={handleCreateEvent} 
          onCancel={() => setShowEventForm(false)} 
          existingEvent={undefined} 
        />
      </div>
    );
  }

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

  return (
    <div className="container mx-auto max-w-4xl p-4 bg-background text-foreground">
      {selectedEvent ? (
        <div className="space-y-4 pb-16">
          {selectedContact ? (
            showContactForm ? (
              <ContactForm
                event={selectedEvent}
                onSave={handleSaveContact}
                onCancel={handleCancelEdit}
                existingContact={contactToEdit || selectedContact}
              />
            ) : (
              <ContactDetail
                contact={selectedContact}
                event={selectedEvent}
                onBack={handleBackToContacts}
                onEdit={handleEditContact}
                onUpdateTask={handleUpdateTaskStatus}
              />
            )
          ) : (
            <>
              <div className="flex items-center">
                <Button variant="ghost" onClick={handleBackToEvents} className="mr-2">
                  ← Back to Events
                </Button>
                <h2 className="text-xl font-semibold">{selectedEvent.title}</h2>
              </div>

              {showContactForm ? (
                <ContactForm
                  event={selectedEvent}
                  onSave={handleSaveContact}
                  onCancel={handleCancelEdit}
                  existingContact={contactToEdit || undefined}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Contacts from this event</h3>
                    <Button onClick={() => setShowContactForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Contact
                    </Button>
                  </div>

                  <ContactList
                    contacts={uiContacts.filter((c) => c.eventId === selectedEvent.id)}
                    events={[selectedEvent]}
                    compact={false}
                    onEditContact={handleEditContact}
                    onSelectContact={handleSelectContact}
                  />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <div className="pb-16 mb-2">
            <Tabs defaultValue="events" value={activeTab} onValueChange={setActiveTab}>
              {/* Tab content remains at the top */}
              <TabsContent value="events" className="mt-4">
                {showEventForm ? (
                  <ClientEventForm onSubmit={handleCreateEvent} onCancel={() => setShowEventForm(false)} />
                ) : showEventSelector ? (
                  <EventSelector
                    events={uiEvents}
                    onSelectEvent={handleSelectEvent}
                    onCancel={() => setShowEventSelector(false)}
                    onCreateNewEvent={() => {
                      setShowEventSelector(false)
                      setShowEventForm(true)
                    }}
                  />
                ) : (
                  <EventList events={uiEvents} onSelectEvent={handleSelectEvent} contacts={uiContacts} />
                )}
              </TabsContent>
              <TabsContent value="contacts" className="mt-4">
                {showContactForm ? (
                  <ContactForm
                    event={selectedEvent!}
                    onSave={handleSaveContact}
                    onCancel={handleCancelEdit}
                    existingContact={contactToEdit || undefined}
                  />
                ) : (
                  <ContactList
                    contacts={uiContacts}
                    events={uiEvents}
                    compact={true}
                    onEditContact={handleEditContact}
                    onSelectContact={handleSelectContact}
                  />
                )}
              </TabsContent>
              <TabsContent value="tasks" className="mt-4">
                <TaskList tasks={tasks} contacts={uiContacts} events={uiEvents} onUpdateStatus={handleUpdateTaskStatus} />
              </TabsContent>
              <TabsContent value="profile" className="mt-4">
                <ProfileSection />
              </TabsContent>
            </Tabs>

            {/* Bottom Navigation */}
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
            {/* Add padding at the bottom to prevent content from being hidden behind the navigation */}
            <div className="h-16"></div>
          </div>

          {showCreateOptions && (
            <CreateOptions 
              onCreateEvent={() => handleCreateOptionSelect("event")} 
              onCreateContact={() => handleCreateOptionSelect("contact")} 
              onClose={() => setShowCreateOptions(false)}
              showContactOption={uiEvents.length > 0 || selectedEvent !== null} 
            />
          )}
        </>
      )}
    </div>
  )
}
